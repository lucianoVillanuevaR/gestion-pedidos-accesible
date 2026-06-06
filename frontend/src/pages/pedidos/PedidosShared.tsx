import { ClipboardPlus } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { getPedidos, updatePedidoEstado } from "../../services/pedidos";
import type { EstadoPedido, PedidoDetalleResponse, PedidoResponse } from "../../types";

export type EstadoFilter = EstadoPedido | "todos";
export type ModalAction = "detail" | "state" | "finish" | "cancel" | "history";
export type SortOption = "recent" | "oldest" | "highest_total" | "state";

export const FOCUS_VISIBLE_CLASS =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export type ActiveModal = {
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

export const ESTADO_OPTIONS: EstadoOption[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendiente", value: "pendiente" },
  { label: "En preparación", value: "en_preparacion" },
  { label: "Listo", value: "listo" },
  { label: "Entregado", value: "entregado" },
  { label: "Cancelado", value: "cancelado" }
];

export const ESTADO_META: Record<EstadoPedido, EstadoMeta> = {
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
    listo: ["entregado"],
    entregado: [],
    cancelado: []
  };

  return CAMBIO_ESTADO_OPTIONS.filter((option) => allowedByEstado[estado].includes(option.value));
}

export function getPedidoCounts(pedidos: PedidoResponse[]) {
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

export function getNormalSummary(pedidos: PedidoResponse[]) {
  return {
    ...getPedidoCounts(pedidos),
    totalVendido: pedidos
      .filter((pedido) => pedido.estado === "entregado")
      .reduce((total, pedido) => total + Number(pedido.total), 0)
  };
}

export function formatCurrency(value: string) {
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

export function formatTime(value?: string) {
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

export function formatElapsedTime(value?: string) {
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

export function isPedidoDelayed(pedido: PedidoResponse) {
  if (!["pendiente", "en_preparacion"].includes(pedido.estado)) {
    return false;
  }

  const elapsedMinutes = getElapsedMinutes(pedido.createdAt);
  return elapsedMinutes !== null && elapsedMinutes > 20;
}

export function getPedidoDelayMessage(pedido: PedidoResponse) {
  if (!isPedidoDelayed(pedido)) {
    return null;
  }

  return pedido.estado === "en_preparacion"
    ? "Pedido con demora: más de 20 min en preparación"
    : "Pedido con demora: más de 20 min pendiente";
}

export function formatMetodoPago(value: PedidoResponse["metodoPago"]) {
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

export function getProductCount(pedido: PedidoResponse) {
  return pedido.detalles?.reduce((total, detalle) => total + detalle.cantidad, 0) ?? 0;
}

export function getPedidoSummary(pedido: PedidoResponse) {
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

  const searchableText = [
    `pedido ${pedido.id}`,
    String(pedido.id),
    getPedidoSummary(pedido),
    formatMetodoPago(pedido.metodoPago),
    ESTADO_META[pedido.estado].label,
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

export function usePedidosController({
  searchTerm = "",
  sortOption = "recent"
}: {
  searchTerm?: string;
  sortOption?: SortOption;
}) {
  const [pedidos, setPedidos] = useState<PedidoResponse[]>([]);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModalState] = useState<ActiveModal>(null);
  const [updatingPedidoId, setUpdatingPedidoId] = useState<number | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

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

  const setActiveModal = useCallback((modal: ActiveModal) => {
    if (modal) {
      const activeElement = document.activeElement;
      lastFocusedElementRef.current = activeElement instanceof HTMLElement ? activeElement : null;
      setActiveModalState(modal);
      return;
    }

    setActiveModalState(null);
    window.requestAnimationFrame(() => {
      lastFocusedElementRef.current?.focus();
      lastFocusedElementRef.current = null;
    });
  }, []);

  return {
    activeModal,
    error,
    estadoFilter,
    filteredPedidos,
    handleEstadoChange,
    isLoading,
    loadPedidos,
    normalSummary,
    pedidoCounts,
    setActiveModal,
    setEstadoFilter,
    updatingPedidoId
  };
}

export function StatusBadge({ estado, isLarge = false }: { estado: EstadoPedido; isLarge?: boolean }) {
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
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  const { isAccessible, isHighContrast } = useAccessibilityContext();
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl sm:p-6 ${
        isHighContrast ? "contrast-panel border-2 border-yellow-400" : isAccessible ? "border-2 border-slate-900" : "border border-slate-200"
      }`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            ref={titleRef}
            id={titleId}
            tabIndex={-1}
            className={`font-black text-slate-950 outline-none ${isAccessible ? "text-3xl" : ""}`}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center justify-center rounded-xl border px-4 font-black transition hover:bg-slate-100 ${
              isAccessible ? "min-h-[56px] border-2 border-slate-900 text-lg text-slate-950" : "min-h-[44px] border-slate-300 text-slate-700"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            Volver
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

export function PedidoModal({
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
    const unavailableMessage = pedido.estado === "entregado"
      ? "Pedido finalizado"
      : pedido.estado === "cancelado"
        ? "Pedido cancelado"
        : "Este pedido no tiene cambios de estado disponibles.";

    return (
      <ModalShell onClose={onClose} title={`Cambiar estado del pedido #${pedido.id}`}>
        <div className="grid gap-3">
          <p className="text-lg font-bold text-slate-700">Elige la siguiente acción disponible.</p>
          {allowedOptions.length === 0 && (
            <p className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-5 text-lg font-black text-slate-700">
              {unavailableMessage}
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
              className={`min-h-[64px] rounded-2xl border-2 border-slate-900 bg-white px-5 text-left text-lg font-black text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
            >
              {isUpdating ? "Actualizando..." : option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[64px] rounded-2xl border-2 border-slate-900 bg-slate-100 px-5 text-lg font-black text-slate-900 transition hover:bg-slate-200 ${FOCUS_VISIBLE_CLASS}`}
          >
            Volver
          </button>
        </div>
      </ModalShell>
    );
  }

  const isFinish = action === "finish";

  return (
    <ModalShell onClose={onClose} title={isFinish ? `Finalizar pedido #${pedido.id}` : `Cancelar pedido #${pedido.id}`}>
      <div className="space-y-5">
        <p className="text-xl font-black text-slate-950">
          {isFinish ? `¿Seguro que deseas finalizar el pedido #${pedido.id}?` : `¿Seguro que deseas cancelar el pedido #${pedido.id}?`}
        </p>
        <p className="font-bold text-slate-600">
          {isFinish
            ? "Confirma solo si el pedido ya fue entregado al cliente."
            : "Esta acción cambiará el estado del pedido a cancelado."}
        </p>
        <p className="font-bold text-slate-600">Pedido #{pedido.id} · {formatCurrency(pedido.total)}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[62px] rounded-2xl border border-slate-300 bg-white px-5 text-lg font-black text-slate-900 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
          >
            Volver
          </button>
          <button
            type="button"
            onClick={() => onEstadoChange(pedido, isFinish ? "entregado" : "cancelado")}
            disabled={isUpdating}
            className={`min-h-[62px] rounded-2xl border px-5 text-lg font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isFinish
                ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                : "border-red-700 bg-red-600 text-white hover:bg-red-700"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isUpdating ? "Guardando..." : isFinish ? "Sí, finalizar" : "Sí, cancelar"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function LargeActionButton({
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
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      {label}
    </button>
  );
}

export function LargeStatusLabel({ label, tone = "default" }: { label: string; tone?: "danger" | "default" }) {
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

export function EmptyPedidosMessage({ isAccessible = false }: { isAccessible?: boolean }) {
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
          } ${FOCUS_VISIBLE_CLASS}`}
        >
          {isAccessible ? "Ir a Nuevo Pedido" : "Crear nuevo pedido"}
        </Link>
      </div>
    </div>
  );
}
