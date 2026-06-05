import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ClipboardPlus,
  Eye,
  LoaderCircle,
  RefreshCw,
  XCircle
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import { getPedidos, updatePedidoEstado } from "../services/pedidos";
import type { EstadoPedido, PedidoDetalleResponse, PedidoResponse } from "../types";

type EstadoFilter = EstadoPedido | "todos";
type ModalAction = "detail" | "state" | "finish" | "cancel" | "history";
type SortOption = "recent" | "oldest" | "highest_total" | "state";

type ActiveModal = {
  action: ModalAction;
  pedido: PedidoResponse;
} | null;

type PedidoModalState = NonNullable<ActiveModal>;

type EstadoOption = {
  label: string;
  value: EstadoFilter;
};

type EstadoMeta = {
  className: string;
  label: string;
};

const ESTADO_OPTIONS: EstadoOption[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendiente", value: "pendiente" },
  { label: "En preparación", value: "en_preparacion" },
  { label: "Listo", value: "listo" },
  { label: "Entregado", value: "entregado" },
  { label: "Cancelado", value: "cancelado" }
];

const ESTADO_META: Record<EstadoPedido, EstadoMeta> = {
  pendiente: {
    label: "Pendiente",
    className: "border-amber-200 bg-amber-100 text-amber-900"
  },
  en_preparacion: {
    label: "En preparación",
    className: "border-orange-200 bg-orange-100 text-orange-900"
  },
  listo: {
    label: "Listo",
    className: "border-emerald-200 bg-emerald-100 text-emerald-900"
  },
  entregado: {
    label: "Entregado",
    className: "border-blue-200 bg-blue-100 text-blue-900"
  },
  cancelado: {
    label: "Cancelado",
    className: "border-red-200 bg-red-100 text-red-900"
  }
};

const CAMBIO_ESTADO_OPTIONS: Array<{ label: string; value: EstadoPedido }> = [
  { label: "Marcar en preparación", value: "en_preparacion" },
  { label: "Marcar como listo", value: "listo" },
  { label: "Entregar pedido", value: "entregado" },
  { label: "Cancelar pedido", value: "cancelado" }
];

function getAllowedEstadoOptions(estado: EstadoPedido) {
  const allowedByEstado: Record<EstadoPedido, EstadoPedido[]> = {
    pendiente: ["en_preparacion", "cancelado"],
    en_preparacion: ["listo", "cancelado"],
    listo: ["entregado", "cancelado"],
    entregado: [],
    cancelado: []
  };

  return CAMBIO_ESTADO_OPTIONS.filter((option) => allowedByEstado[estado].includes(option.value));
}

function getPedidoCounts(pedidos: PedidoResponse[]) {
  const pendientes = pedidos.filter((pedido) => pedido.estado === "pendiente").length;
  const enPreparacion = pedidos.filter((pedido) => pedido.estado === "en_preparacion").length;
  const listos = pedidos.filter((pedido) => pedido.estado === "listo").length;

  return {
    enPreparacion,
    entregados: pedidos.filter((pedido) => pedido.estado === "entregado").length,
    listos,
    pendientes,
    total: pedidos.length
  };
}

function getNormalSummary(pedidos: PedidoResponse[]) {
  return {
    ...getPedidoCounts(pedidos),
    totalVendido: pedidos
      .filter((pedido) => pedido.estado === "entregado")
      .reduce((total, pedido) => total + Number(pedido.total), 0)
  };
}

function formatCurrency(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("es-CL", {
    currency: "CLP",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(amount);
}

function formatTime(value?: string) {
  if (!value) {
    return "Sin hora";
  }

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getCreatedDate(value?: string) {
  const createdAt = value ? new Date(value) : null;

  return createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null;
}

function getElapsedMinutes(value?: string) {
  const createdAt = getCreatedDate(value);

  if (!createdAt) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));
}

function formatElapsedTime(value?: string) {
  const minutes = getElapsedMinutes(value);

  if (minutes === null) {
    return "Sin tiempo";
  }

  if (minutes < 1) {
    return "Hace menos de 1 min";
  }

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `Hace ${hours} h ${remainingMinutes} min` : `Hace ${hours} h`;
}

function isPedidoDelayed(pedido: PedidoResponse) {
  if (!["pendiente", "en_preparacion"].includes(pedido.estado)) {
    return false;
  }

  const elapsedMinutes = getElapsedMinutes(pedido.createdAt);

  return elapsedMinutes !== null && elapsedMinutes > 20;
}

function formatMetodoPago(value: PedidoResponse["metodoPago"]) {
  const labels: Record<PedidoResponse["metodoPago"], string> = {
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
    transferencia: "Transferencia"
  };

  return labels[value];
}

function getItemName(detalle: PedidoDetalleResponse) {
  return detalle.producto?.nombre ?? `Producto #${detalle.productoId}`;
}

function getProductCount(pedido: PedidoResponse) {
  return pedido.detalles?.reduce((total, detalle) => total + detalle.cantidad, 0) ?? 0;
}

function getPedidoSummary(pedido: PedidoResponse) {
  const detalles = pedido.detalles ?? [];

  if (detalles.length === 0) {
    return "Sin detalle de productos";
  }

  return detalles
    .slice(0, 2)
    .map((detalle) => `${detalle.cantidad}x ${getItemName(detalle)}`)
    .join(", ")
    .concat(detalles.length > 2 ? ` y ${detalles.length - 2} más` : "");
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function pedidoMatchesSearch(pedido: PedidoResponse, searchTerm: string) {
  const normalizedSearch = normalizeText(searchTerm.trim());

  if (!normalizedSearch) {
    return true;
  }

  const meta = ESTADO_META[pedido.estado];
  const searchableText = [
    `pedido ${pedido.id}`,
    String(pedido.id),
    getPedidoSummary(pedido),
    formatMetodoPago(pedido.metodoPago),
    meta.label,
    pedido.estado
  ].join(" ");

  return normalizeText(searchableText).includes(normalizedSearch);
}

function sortPedidos(pedidos: PedidoResponse[], sortOption: SortOption) {
  return [...pedidos].sort((left, right) => {
    if (sortOption === "oldest") {
      return (getCreatedDate(left.createdAt)?.getTime() ?? 0) - (getCreatedDate(right.createdAt)?.getTime() ?? 0);
    }

    if (sortOption === "highest_total") {
      return Number(right.total) - Number(left.total);
    }

    if (sortOption === "state") {
      return ESTADO_META[left.estado].label.localeCompare(ESTADO_META[right.estado].label, "es");
    }

    return (getCreatedDate(right.createdAt)?.getTime() ?? 0) - (getCreatedDate(left.createdAt)?.getTime() ?? 0);
  });
}

function StatusBadge({ estado, isLarge = false }: { estado: EstadoPedido; isLarge?: boolean }) {
  const meta = ESTADO_META[estado];

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border font-black ${meta.className} ${
        isLarge ? "border-2 px-5 py-3 text-xl" : "px-3 py-1.5 text-xs uppercase"
      }`}
    >
      {meta.label}
    </span>
  );
}

function ModalShell({
  children,
  onClose,
  title
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  const { isAccessible, isHighContrast } = useAccessibilityContext();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <section className={`max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl sm:p-6 ${
        isHighContrast ? "contrast-panel border-2 border-yellow-400" : isAccessible ? "border-2 border-slate-900" : "border border-slate-200"
      }`}>
        <div className="flex items-start justify-between gap-4">
          <h2 className={`font-black text-slate-950 ${isAccessible ? "text-3xl" : ""}`}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center justify-center rounded-xl border px-4 font-black transition hover:bg-slate-100 ${
              isAccessible ? "min-h-[56px] border-2 border-slate-900 text-lg text-slate-950" : "min-h-[44px] border-slate-300 text-slate-700"
            }`}
          >
            Volver
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

function PedidosPage() {
  const { isAccessible, isHighContrast, isPanelOpen, openAccessibilityPanel } = useAccessibilityContext();
  const [pedidos, setPedidos] = useState<PedidoResponse[]>([]);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [updatingPedidoId, setUpdatingPedidoId] = useState<number | null>(null);

  const filteredPedidos = useMemo(() => {
    const pedidosByEstado = estadoFilter === "todos"
      ? pedidos
      : pedidos.filter((pedido) => pedido.estado === estadoFilter);
    const pedidosBySearch = pedidosByEstado.filter((pedido) => pedidoMatchesSearch(pedido, searchTerm));

    return sortPedidos(pedidosBySearch, sortOption);
  }, [estadoFilter, pedidos, searchTerm, sortOption]);
  const pedidoCounts = useMemo(() => getPedidoCounts(pedidos), [pedidos]);
  const normalSummary = useMemo(() => getNormalSummary(pedidos), [pedidos]);

  const loadPedidos = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);
      const pedidosResponse = await getPedidos(signal);
      setPedidos(pedidosResponse);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        return;
      }

      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar los pedidos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadPedidos(controller.signal);

    return () => controller.abort();
  }, [loadPedidos]);

  async function handleEstadoChange(pedido: PedidoResponse, estado: EstadoPedido) {
    try {
      setUpdatingPedidoId(pedido.id);
      setError(null);
      const pedidoActualizado = await updatePedidoEstado(pedido.id, estado);
      setPedidos((currentPedidos) =>
        currentPedidos.map((currentPedido) => (currentPedido.id === pedido.id ? pedidoActualizado : currentPedido))
      );
      setActiveModal(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo actualizar el pedido");
    } finally {
      setUpdatingPedidoId(null);
    }
  }

  const panelClass = isHighContrast
    ? "contrast-panel border-yellow-400 bg-black"
    : isAccessible
      ? "border-2 border-slate-900 bg-white"
      : "border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]";

  const softPanelClass = isHighContrast
    ? "contrast-panel-soft"
    : isAccessible
      ? "border-2 border-slate-900 bg-white"
      : "border border-slate-200 bg-[linear-gradient(180deg,#fffdf7_0%,#ffffff_100%)]";
  const headerBg = isHighContrast
    ? "bg-black text-white border-b-2 border-yellow-400"
    : isAccessible
      ? "bg-slate-900 text-white border-b border-slate-700"
      : "bg-[#FECE00] text-[#1F2937] border-b border-amber-200";
  const pageBg = isHighContrast ? "bg-black" : isAccessible ? "bg-white" : "bg-[#F7F7F7]";
  const accessiblePanelClass = isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className={headerBg}>
        <div className={`mx-auto flex w-full max-w-[1520px] items-center justify-between gap-4 px-3 sm:px-4 lg:px-5 xl:px-6 ${isAccessible ? "min-h-[84px] flex-wrap py-3" : "h-[64px] min-h-[64px]"}`}>
          <h1 className={`font-black leading-none tracking-tight contrast-important ${isAccessible ? "text-3xl" : "text-xl"}`}>
            Pedidos
          </h1>
          <div className={`flex flex-wrap items-center justify-end gap-3 ${isAccessible ? "w-full sm:w-auto" : ""}`}>
            {isAccessible && (
              <>
                <Link
                  to="/pdv"
                  className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-lg font-black no-underline transition ${
                    isHighContrast
                      ? "contrast-button-secondary"
                      : "border-white bg-white text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  <ClipboardPlus className="h-6 w-6" aria-hidden="true" />
                  Ir a Nuevo Pedido
                </Link>
                <button
                  type="button"
                  onClick={openAccessibilityPanel}
                  aria-haspopup="dialog"
                  aria-expanded={isPanelOpen}
                  className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-lg font-black transition ${
                    isHighContrast
                      ? "contrast-button-secondary"
                      : "border-white bg-white text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  <Accessibility className="h-6 w-6" aria-hidden="true" />
                  Accesibilidad
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => loadPedidos()}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border px-4 font-black transition ${
                isHighContrast
                  ? "contrast-button-secondary"
                  : isAccessible
                    ? "border-white bg-white text-slate-950 hover:bg-slate-100"
                    : "border-amber-300 bg-[#FFF8DC] text-slate-950 hover:bg-[#FFF4BF]"
              } ${isAccessible ? "min-h-[56px] text-lg" : "text-sm"}`}
            >
              <RefreshCw className={isAccessible ? "h-6 w-6" : "h-5 w-5"} aria-hidden="true" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <section className={`mx-auto w-full max-w-[1520px] space-y-4 px-3 sm:px-4 lg:px-5 xl:px-6 ${isAccessible ? "py-6" : "py-2 sm:py-3"}`}>
        {isAccessible && (
          <AccessibleIntroCard isHighContrast={isHighContrast} />
        )}

        {isAccessible && (
          <AccessibleEstadoSummary counts={pedidoCounts} isHighContrast={isHighContrast} />
        )}

        {!isAccessible && (
          <>
            <NormalSummaryCards summary={normalSummary} />
            <NormalSearchAndSort
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setSortOption={setSortOption}
              sortOption={sortOption}
            />
          </>
        )}

        <div className={`rounded-[22px] px-3 py-3 sm:px-4 ${softPanelClass}`}>
          <div className={`flex gap-2 overflow-x-auto ${isAccessible ? "flex-wrap gap-4" : ""}`} aria-label="Filtros por estado">
            {ESTADO_OPTIONS.map((option) => {
              const isActive = estadoFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEstadoFilter(option.value)}
                  className={`min-h-[44px] whitespace-nowrap rounded-2xl border px-4 font-black transition ${
                    isHighContrast
                      ? isActive
                        ? "contrast-button-primary"
                        : "contrast-button-secondary"
                      : isAccessible
                        ? isActive
                          ? "border-2 border-slate-900 bg-slate-900 text-white"
                          : "border-2 border-slate-300 bg-white text-slate-900 hover:border-slate-900 hover:bg-slate-50"
                      : isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  } ${isAccessible ? "min-h-[64px] rounded-xl px-6 text-lg" : "text-sm"}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className={`flex items-start gap-3 rounded-2xl border p-4 ${isHighContrast ? "contrast-panel" : "border-red-200 bg-red-50 text-red-950"}`} role="alert">
            <AlertTriangle className="mt-1 h-5 w-5" aria-hidden="true" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className={`flex min-h-[260px] items-center justify-center rounded-[26px] ${isAccessible ? accessiblePanelClass : panelClass}`}>
            <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
            <span className={`ml-3 font-black ${isAccessible ? "text-xl" : ""}`}>Cargando pedidos...</span>
          </div>
        ) : isAccessible ? (
          <AccessiblePedidosList
            pedidos={filteredPedidos}
            isHighContrast={isHighContrast}
            onOpenModal={setActiveModal}
            updatingPedidoId={updatingPedidoId}
          />
        ) : (
          <NormalPedidosList
            pedidos={filteredPedidos}
            onOpenModal={setActiveModal}
            updatingPedidoId={updatingPedidoId}
          />
        )}

        {activeModal && (
          <PedidoModal
            activeModal={activeModal}
            isUpdating={updatingPedidoId === activeModal.pedido.id}
            onClose={() => setActiveModal(null)}
            onEstadoChange={handleEstadoChange}
            onOpenModal={setActiveModal}
          />
        )}
      </section>
    </div>
  );
}

function NormalPedidosList({
  onOpenModal,
  pedidos,
  updatingPedidoId
}: {
  onOpenModal: (modal: ActiveModal) => void;
  pedidos: PedidoResponse[];
  updatingPedidoId: number | null;
}) {
  if (pedidos.length === 0) {
    return <EmptyPedidosMessage />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {pedidos.map((pedido) => (
        <article key={pedido.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xl font-black text-slate-950">Pedido #{pedido.id}</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-600">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {formatTime(pedido.createdAt)} · {formatElapsedTime(pedido.createdAt)}
              </p>
            </div>
            <StatusBadge estado={pedido.estado} />
          </div>

          {isPedidoDelayed(pedido) && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900">
              Pedido con demora
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <PedidoMetric label="Total" value={formatCurrency(pedido.total)} />
            <PedidoMetric label="Pago" value={formatMetodoPago(pedido.metodoPago)} />
            <PedidoMetric label="Productos" value={`${getProductCount(pedido)}`} />
          </div>

          <div className="mt-4 rounded-2xl border border-yellow-100 bg-[#FFF8DC] px-4 py-3">
            <p className="text-xs font-black uppercase text-slate-500">Resumen</p>
            <p className="mt-1 font-bold leading-snug text-slate-900">{getPedidoSummary(pedido)}</p>
          </div>

          <NormalPedidoActions
            isUpdating={updatingPedidoId === pedido.id}
            onOpenModal={onOpenModal}
            pedido={pedido}
          />
        </article>
      ))}
    </div>
  );
}

function NormalPedidoActions({
  isUpdating,
  onOpenModal,
  pedido
}: {
  isUpdating: boolean;
  onOpenModal: (modal: ActiveModal) => void;
  pedido: PedidoResponse;
}) {
  const detailAction = <SmallActionButton label="Ver detalle" onClick={() => onOpenModal({ action: "detail", pedido })} />;
  const historyAction = <SmallActionButton label="Ver historial" onClick={() => onOpenModal({ action: "history", pedido })} />;

  if (pedido.estado === "entregado") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {detailAction}
        {historyAction}
        <SmallStatusLabel label="Finalizado" />
      </div>
    );
  }

  if (pedido.estado === "cancelado") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {detailAction}
        {historyAction}
        <SmallStatusLabel label="Cancelado" tone="danger" />
      </div>
    );
  }

  if (pedido.estado === "listo") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {detailAction}
        {historyAction}
        <SmallActionButton
          label="Finalizar"
          onClick={() => onOpenModal({ action: "finish", pedido })}
          disabled={isUpdating}
        />
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {detailAction}
      {historyAction}
      <SmallActionButton label="Cambiar estado" onClick={() => onOpenModal({ action: "state", pedido })} />
      <SmallActionButton
        label="Cancelar"
        onClick={() => onOpenModal({ action: "cancel", pedido })}
        disabled={isUpdating}
        tone="danger"
      />
    </div>
  );
}

function AccessiblePedidosList({
  isHighContrast,
  onOpenModal,
  pedidos,
  updatingPedidoId
}: {
  isHighContrast: boolean;
  onOpenModal: (modal: ActiveModal) => void;
  pedidos: PedidoResponse[];
  updatingPedidoId: number | null;
}) {
  if (pedidos.length === 0) {
    return <EmptyPedidosMessage isAccessible />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {pedidos.map((pedido) => (
        <article
          key={pedido.id}
          className={`rounded-[26px] p-6 ${
            isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-3xl font-black text-slate-950">Pedido #{pedido.id}</p>
              <p className="mt-3 flex items-center gap-2 text-xl font-bold text-slate-700">
                <Clock3 className="h-5 w-5" aria-hidden="true" />
                Hora: {formatTime(pedido.createdAt)}
              </p>
            </div>
            <StatusBadge estado={pedido.estado} isLarge />
          </div>

          <div className={`mt-6 rounded-2xl p-5 ${isHighContrast ? "contrast-panel-soft border-2 border-yellow-400" : "border-2 border-slate-300 bg-slate-50"}`}>
            <p className="text-xl font-black leading-snug text-slate-950">{getPedidoSummary(pedido)}</p>
            <p className="mt-4 text-3xl font-black text-slate-950">Total: {formatCurrency(pedido.total)}</p>
          </div>

          <AccessiblePedidoActions
            isUpdating={updatingPedidoId === pedido.id}
            onOpenModal={onOpenModal}
            pedido={pedido}
          />
        </article>
      ))}
    </div>
  );
}

function AccessiblePedidoActions({
  isUpdating,
  onOpenModal,
  pedido
}: {
  isUpdating: boolean;
  onOpenModal: (modal: ActiveModal) => void;
  pedido: PedidoResponse;
}) {
  if (pedido.estado === "entregado") {
    return (
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <LargeActionButton label="Ver pedido" onClick={() => onOpenModal({ action: "detail", pedido })} />
        <LargeStatusLabel label="Pedido finalizado" />
      </div>
    );
  }

  if (pedido.estado === "cancelado") {
    return (
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <LargeActionButton label="Ver pedido" onClick={() => onOpenModal({ action: "detail", pedido })} />
        <LargeStatusLabel label="Pedido cancelado" tone="danger" />
      </div>
    );
  }

  if (pedido.estado === "listo") {
    return (
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <LargeActionButton label="Ver pedido" onClick={() => onOpenModal({ action: "detail", pedido })} />
        <LargeActionButton
          label="Finalizar pedido"
          onClick={() => onOpenModal({ action: "finish", pedido })}
          disabled={isUpdating}
          tone="success"
        />
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-3 lg:grid-cols-2">
      <LargeActionButton label="Ver pedido" onClick={() => onOpenModal({ action: "detail", pedido })} />
      <LargeActionButton label="Cambiar estado" onClick={() => onOpenModal({ action: "state", pedido })} />
    </div>
  );
}

function NormalSummaryCards({ summary }: { summary: ReturnType<typeof getNormalSummary> }) {
  const cards = [
    { label: "Total pedidos del turno", value: String(summary.total) },
    { label: "Pendientes", value: String(summary.pendientes) },
    { label: "En preparación", value: String(summary.enPreparacion) },
    { label: "Listos", value: String(summary.listos) },
    { label: "Entregados", value: String(summary.entregados) },
    { label: "Total vendido", value: formatCurrency(String(summary.totalVendido)) }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Resumen de pedidos">
      {cards.map((card) => (
        <article key={card.label} className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-black uppercase text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-black leading-none text-slate-950">{card.value}</p>
        </article>
      ))}
    </section>
  );
}

function NormalSearchAndSort({
  searchTerm,
  setSearchTerm,
  setSortOption,
  sortOption
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  setSortOption: (value: SortOption) => void;
  sortOption: SortOption;
}) {
  return (
    <section className="grid gap-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] lg:grid-cols-[minmax(0,1fr)_240px]">
      <label className="block">
        <span className="text-xs font-black uppercase text-slate-500">Buscar</span>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar pedido, producto o método de pago"
          className="mt-2 min-h-[48px] w-full rounded-2xl border border-slate-300 bg-white px-4 font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
        />
      </label>

      <label className="block">
        <span className="text-xs font-black uppercase text-slate-500">Ordenar por</span>
        <select
          value={sortOption}
          onChange={(event) => setSortOption(event.target.value as SortOption)}
          className="mt-2 min-h-[48px] w-full rounded-2xl border border-slate-300 bg-white px-4 font-black text-slate-950 outline-none transition focus:border-slate-900"
        >
          <option value="recent">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="highest_total">Mayor total</option>
          <option value="state">Estado</option>
        </select>
      </label>
    </section>
  );
}

function AccessibleIntroCard({ isHighContrast }: { isHighContrast: boolean }) {
  return (
    <header className={`rounded-3xl p-6 sm:p-8 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}>
      <div className="flex flex-col gap-5">
        <div>
          <p className={`text-sm font-black uppercase tracking-[0.18em] ${isHighContrast ? "contrast-secondary-text" : "text-slate-500"}`}>
            Riquísimo · Modo Fácil
          </p>
          <h2 className="mt-3 text-[2.35rem] font-black leading-tight tracking-tight text-slate-950">
            Pedidos del turno
          </h2>
          <p className={`mt-3 max-w-3xl text-xl font-semibold leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-600"}`}>
            Revisa pedidos activos, entregados o cancelados del turno actual.
          </p>
        </div>
      </div>
    </header>
  );
}

function AccessibleEstadoSummary({
  counts,
  isHighContrast
}: {
  counts: ReturnType<typeof getPedidoCounts>;
  isHighContrast: boolean;
}) {
  const cards = [
    { label: "Pendientes", value: counts.pendientes },
    { label: "En preparación", value: counts.enPreparacion },
    { label: "Listos", value: counts.listos },
    { label: "Entregados", value: counts.entregados },
    { label: "Total pedidos", value: counts.total }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Resumen de estados">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`rounded-2xl p-5 ${
            isHighContrast ? "contrast-panel-soft border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"
          }`}
        >
          <p className="text-lg font-black text-slate-700">{card.label}</p>
          <p className="mt-2 text-4xl font-black leading-none text-slate-950">{card.value}</p>
        </article>
      ))}
    </section>
  );
}

function PedidoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate font-black text-slate-950">{value}</p>
    </div>
  );
}

function PedidoModal({
  activeModal,
  isUpdating,
  onClose,
  onEstadoChange,
  onOpenModal
}: {
  activeModal: PedidoModalState;
  isUpdating: boolean;
  onClose: () => void;
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onOpenModal: (modal: ActiveModal) => void;
}) {
  const { action, pedido } = activeModal;

  if (action === "detail") {
    return (
      <ModalShell onClose={onClose} title={`Pedido #${pedido.id}`}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge estado={pedido.estado} />
            <span className="font-bold text-slate-600">{formatTime(pedido.createdAt)}</span>
            <span className="font-bold text-slate-600">{formatMetodoPago(pedido.metodoPago)}</span>
          </div>
          <div className="rounded-2xl border border-slate-200">
            {(pedido.detalles ?? []).map((detalle) => (
              <div key={detalle.id} className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0">
                <div>
                  <p className="font-black text-slate-950">{detalle.cantidad}x {getItemName(detalle)}</p>
                  <p className="text-sm font-bold text-slate-500">{formatCurrency(detalle.precioUnitario)} c/u</p>
                </div>
                <p className="font-black text-slate-950">{formatCurrency(detalle.subtotal)}</p>
              </div>
            ))}
          </div>
          {pedido.observacion && (
            <p className="rounded-2xl border border-yellow-100 bg-[#FFF8DC] p-4 font-bold text-slate-700">
              {pedido.observacion}
            </p>
          )}
          <p className="text-right text-2xl font-black text-slate-950">Total {formatCurrency(pedido.total)}</p>
        </div>
      </ModalShell>
    );
  }

  if (action === "history") {
    return (
      <ModalShell onClose={onClose} title={`Historial del pedido #${pedido.id}`}>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-black text-slate-950">Historial no disponible</p>
          <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600">
            Este proyecto todavía no tiene un endpoint o registro real de cambios de estado.
            Cuando exista, aquí se podrá mostrar estado anterior, estado nuevo, hora del cambio y usuario responsable.
          </p>
        </div>
      </ModalShell>
    );
  }

  if (action === "state") {
    const allowedOptions = getAllowedEstadoOptions(pedido.estado);

    return (
      <ModalShell onClose={onClose} title={`Cambiar estado del pedido #${pedido.id}`}>
        <div className="grid gap-3">
          {allowedOptions.length === 0 && (
            <p className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-5 text-lg font-black text-slate-700">
              Este pedido no tiene cambios de estado disponibles.
            </p>
          )}
          {allowedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (option.value === "entregado") {
                  onOpenModal({ action: "finish", pedido });
                  return;
                }

                if (option.value === "cancelado") {
                  onOpenModal({ action: "cancel", pedido });
                  return;
                }

                onEstadoChange(pedido, option.value);
              }}
              disabled={isUpdating}
              className="min-h-[64px] rounded-2xl border-2 border-slate-900 bg-white px-5 text-left text-lg font-black text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdating ? "Actualizando..." : option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[64px] rounded-2xl border-2 border-slate-900 bg-slate-100 px-5 text-lg font-black text-slate-900 transition hover:bg-slate-200"
          >
            Volver
          </button>
        </div>
      </ModalShell>
    );
  }

  const isFinish = action === "finish";

  return (
    <ModalShell onClose={onClose} title={isFinish ? "Finalizar pedido" : "Cancelar pedido"}>
      <div className="space-y-5">
        <p className="text-xl font-black text-slate-950">
          {isFinish ? "¿Seguro que deseas finalizar este pedido?" : "¿Seguro que deseas cancelar este pedido?"}
        </p>
        <p className="font-bold text-slate-600">Pedido #{pedido.id} · {formatCurrency(pedido.total)}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onEstadoChange(pedido, isFinish ? "entregado" : "cancelado")}
            disabled={isUpdating}
            className={`min-h-[62px] rounded-2xl border px-5 text-lg font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isFinish
                ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                : "border-red-700 bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isUpdating ? "Guardando..." : isFinish ? "Sí, finalizar" : "Sí, cancelar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[62px] rounded-2xl border border-slate-300 bg-white px-5 text-lg font-black text-slate-900 transition hover:bg-slate-100"
          >
            Volver
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function SmallActionButton({
  disabled = false,
  label,
  onClick,
  tone = "default"
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  tone?: "danger" | "default";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label === "Ver detalle" && <Eye className="h-4 w-4" aria-hidden="true" />}
      {label === "Finalizar" && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
      {label === "Cancelar" && <XCircle className="h-4 w-4" aria-hidden="true" />}
      {label}
    </button>
  );
}

function SmallStatusLabel({ label, tone = "default" }: { label: string; tone?: "danger" | "default" }) {
  return (
    <span
      aria-disabled="true"
      className={`inline-flex min-h-[38px] items-center justify-center rounded-xl border px-3 text-xs font-black ${
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </span>
  );
}

function LargeActionButton({
  disabled = false,
  label,
  onClick,
  tone = "default"
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  tone?: "default" | "success";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[72px] rounded-2xl border-2 px-5 text-xl font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
        tone === "success"
          ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
          : "border-slate-900 bg-slate-900 text-white hover:bg-black"
      }`}
    >
      {label}
    </button>
  );
}

function LargeStatusLabel({ label, tone = "default" }: { label: string; tone?: "danger" | "default" }) {
  return (
    <div
      aria-disabled="true"
      className={`flex min-h-[72px] items-center justify-center rounded-2xl border-2 px-5 text-center text-xl font-black ${
        tone === "danger"
          ? "border-red-700 bg-red-50 text-red-800"
          : "border-slate-400 bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </div>
  );
}

function EmptyPedidosMessage({ isAccessible = false }: { isAccessible?: boolean }) {
  return (
    <div className={`rounded-[26px] bg-white p-8 sm:p-10 ${
      isAccessible ? "border-2 border-slate-900" : "border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
    }`}>
      <div className="mx-auto max-w-2xl text-center">
        <div className={`mx-auto flex items-center justify-center rounded-2xl border text-slate-950 ${
          isAccessible ? "h-20 w-20 border-2 border-slate-900 bg-white" : "h-14 w-14 border-yellow-200 bg-[#FFF8DC]"
        }`}>
          <ClipboardPlus className={isAccessible ? "h-10 w-10" : "h-7 w-7"} aria-hidden="true" />
        </div>
        <p className={`mt-5 font-black text-slate-950 ${isAccessible ? "text-4xl" : "text-2xl"}`}>
          {isAccessible ? "No hay pedidos en este estado" : "No hay pedidos activos"}
        </p>
        <p className={`mt-3 text-slate-600 ${isAccessible ? "text-xl" : "text-base"}`}>
          {isAccessible
            ? "Cuando registres un pedido desde Punto de Venta, aparecerá aquí para su seguimiento."
            : "Cuando se registre un nuevo pedido desde caja, aparecerá aquí para su seguimiento."}
        </p>
        <Link
          to="/pdv"
          className={`mt-6 inline-flex items-center justify-center rounded-2xl border border-slate-900 bg-slate-900 px-5 font-black text-white no-underline transition hover:bg-black ${
            isAccessible ? "min-h-[72px] border-2 px-7 text-xl" : "min-h-[50px] text-sm"
          }`}
        >
          {isAccessible ? "Ir a Nuevo Pedido" : "Crear nuevo pedido"}
        </Link>
      </div>
    </div>
  );
}

export default PedidosPage;
