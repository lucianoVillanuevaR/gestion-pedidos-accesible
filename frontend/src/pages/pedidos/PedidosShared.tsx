import { ClipboardPlus } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { ESTADOS_PEDIDO_ACTIVOS, TRANSICIONES_ESTADO_PERMITIDAS } from "../../domain/pedidoRules";
import { obtenerPedidoIdsCerrados } from "../../services/cierresTurno";
import { getPedidos, updatePedidoEstado } from "../../services/pedidos";
import type { CierreTurno, EstadoPedido, MetodoPago, PedidoDetalleResponse, PedidoResponse } from "../../types";

export type EstadoFilter = EstadoPedido | "todos";
type ModalAction = "detail" | "state" | "finish" | "cancel" | "history";
export type SortOption = "recent" | "oldest" | "highest_total" | "state";

export const FOCUS_VISIBLE_CLASS =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const TURNO_ABIERTO_STORAGE_KEY = "riquisimo:turno-abierto";
const TURNO_FECHA_INICIO_STORAGE_KEY = "riquisimo:turno-fecha-inicio";

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
    className: "border-yellow-200 bg-yellow-100 text-yellow-900"
  },
  en_preparacion: {
    label: "En preparación",
    className: "border-yellow-200 bg-yellow-100 text-yellow-900"
  },
  listo: {
    label: "Listo",
    className: "border-emerald-200 bg-emerald-100 text-emerald-900"
  },
  entregado: {
    label: "Entregado",
    className: "border-emerald-200 bg-emerald-100 text-emerald-900"
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
  return CAMBIO_ESTADO_OPTIONS.filter((option) => TRANSICIONES_ESTADO_PERMITIDAS[estado].includes(option.value));
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

function getNormalSummary(pedidos: PedidoResponse[]) {
  const turnoSummary = getTurnoSummary(pedidos);

  return {
    ...getPedidoCounts(pedidos),
    totalPendiente: turnoSummary.totalPendiente,
    totalVendido: turnoSummary.totalVendido
  };
}

export type NormalSummary = ReturnType<typeof getNormalSummary>;

export function getTurnoSummary(pedidos: PedidoResponse[]) {
  const pedidosEntregados = pedidos.filter((pedido) => pedido.estado === "entregado");
  const pedidosPendientesTurno = pedidos.filter((pedido) => ESTADOS_PEDIDO_ACTIVOS.includes(pedido.estado));
  const totalPendiente = pedidosPendientesTurno.reduce((total, pedido) => total + Number(pedido.total), 0);
  const totalPorMetodo: Record<MetodoPago, number> = {
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0
  };

  pedidosEntregados.forEach((pedido) => {
    totalPorMetodo[pedido.metodoPago] += Number(pedido.total);
  });

  return {
    pedidosCancelados: pedidos.filter((pedido) => pedido.estado === "cancelado").length,
    pedidosEntregados: pedidosEntregados.length,
    pedidosPendientes: pedidosPendientesTurno.length,
    totalPendiente: Number.isNaN(totalPendiente) ? 0 : totalPendiente,
    totalEfectivo: totalPorMetodo.efectivo,
    totalPedidos: pedidos.length,
    totalTarjeta: totalPorMetodo.tarjeta,
    totalTransferencia: totalPorMetodo.transferencia,
    totalVendido: totalPorMetodo.efectivo + totalPorMetodo.tarjeta + totalPorMetodo.transferencia
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

function getPedidoNumeroTurnoMap(pedidos: PedidoResponse[]) {
  const sortedPedidos = [...pedidos].sort((left, right) => {
    const leftTime = getCreatedDate(left.createdAt)?.getTime() ?? left.id;
    const rightTime = getCreatedDate(right.createdAt)?.getTime() ?? right.id;

    if (leftTime === rightTime) {
      return left.id - right.id;
    }

    return leftTime - rightTime;
  });

  return new Map(sortedPedidos.map((pedido, index) => [pedido.id, index + 1]));
}

export function getPedidoDisplayNumber(pedido: Pick<PedidoResponse, "id" | "numeroTurno">) {
  return pedido.numeroTurno ?? pedido.id;
}

export function withPedidoNumerosTurno(pedidos: PedidoResponse[]) {
  const numeroTurnoByPedidoId = getPedidoNumeroTurnoMap(pedidos);

  return pedidos.map((pedido) => ({
    ...pedido,
    numeroTurno: numeroTurnoByPedidoId.get(pedido.id) ?? pedido.numeroTurno
  }));
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

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function readTurnoAbierto() {
  if (typeof window === "undefined") {
    return true;
  }

  const storedValue = window.localStorage.getItem(TURNO_ABIERTO_STORAGE_KEY);
  return storedValue === null ? true : storedValue === "true";
}

export function setTurnoAbierto(isOpen: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TURNO_ABIERTO_STORAGE_KEY, String(isOpen));
}

function readTurnoFechaInicio() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage.getItem(TURNO_FECHA_INICIO_STORAGE_KEY) ?? undefined;
}

export function setTurnoFechaInicio(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TURNO_FECHA_INICIO_STORAGE_KEY, value);
}

export function getFechaInicioTurno(pedidos: PedidoResponse[]) {
  const storedFechaInicio = readTurnoFechaInicio();

  if (storedFechaInicio) {
    return storedFechaInicio;
  }

  const timestamps = pedidos
    .map((pedido) => (pedido.createdAt ? new Date(pedido.createdAt).getTime() : null))
    .filter((timestamp): timestamp is number => timestamp !== null && !Number.isNaN(timestamp));

  if (timestamps.length === 0) {
    return undefined;
  }

  return new Date(Math.min(...timestamps)).toISOString();
}

function parseMoneyValue(value: string) {
  const amount = Number(value);
  return Number.isNaN(amount) ? 0 : amount;
}

function getDetalleProductoNombre(detalle: NonNullable<PedidoResponse["detalles"]>[number]) {
  return detalle.producto?.nombre ?? `Producto #${detalle.productoId}`;
}

export function getCierrePedidosResumen(pedidos: PedidoResponse[]): CierreTurno["pedidos"] {
  const numeroTurnoByPedidoId = getPedidoNumeroTurnoMap(pedidos);

  return pedidos.map((pedido) => ({
    id: pedido.id,
    numeroTurno: numeroTurnoByPedidoId.get(pedido.id),
    clienteNombre: pedido.clienteNombre,
    createdAt: pedido.createdAt,
    estado: pedido.estado,
    metodoPago: pedido.metodoPago,
    observacion: pedido.observacion,
    total: parseMoneyValue(pedido.total),
    detalles: (pedido.detalles ?? []).map((detalle) => ({
      cantidad: detalle.cantidad,
      precioUnitario: parseMoneyValue(detalle.precioUnitario),
      productoId: detalle.productoId,
      productoNombre: getDetalleProductoNombre(detalle),
      subtotal: parseMoneyValue(detalle.subtotal)
    }))
  }));
}

export function getProductosVendidosResumen(pedidos: PedidoResponse[]): CierreTurno["productosVendidos"] {
  const productos = new Map<number, CierreTurno["productosVendidos"][number]>();

  pedidos
    .filter((pedido) => pedido.estado === "entregado")
    .forEach((pedido) => {
      (pedido.detalles ?? []).forEach((detalle) => {
        const currentProducto = productos.get(detalle.productoId);
        const subtotal = parseMoneyValue(detalle.subtotal);

        if (!currentProducto) {
          productos.set(detalle.productoId, {
            cantidad: detalle.cantidad,
            productoId: detalle.productoId,
            productoNombre: getDetalleProductoNombre(detalle),
            total: subtotal
          });
          return;
        }

        currentProducto.cantidad += detalle.cantidad;
        currentProducto.total += subtotal;
      });
    });

  return [...productos.values()].sort((left, right) => right.cantidad - left.cantidad);
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

  const displayNumber = getPedidoDisplayNumber(pedido);
  const searchableText = [
    `pedido ${displayNumber}`,
    String(displayNumber),
    pedido.clienteNombre ?? "",
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
    const pedidosByEstado =
      estadoFilter === "todos" ? pedidos : pedidos.filter((pedido) => pedido.estado === estadoFilter);
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
      const pedidoIdsCerrados = obtenerPedidoIdsCerrados();
      setPedidos(withPedidoNumerosTurno(pedidosResponse.filter((pedido) => !pedidoIdsCerrados.has(pedido.id))));
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
        currentPedidos.map((currentPedido) =>
          currentPedido.id === pedido.id
            ? { ...pedidoActualizado, numeroTurno: currentPedido.numeroTurno }
            : currentPedido
        )
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
    pedidos,
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

function ModalShell({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
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
        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl sm:p-6 ${
          isHighContrast
            ? "contrast-panel border-2 border-yellow-400"
            : isAccessible
              ? "border-2 border-slate-900"
              : "border border-slate-200"
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
              isAccessible
                ? "min-h-[56px] border-2 border-slate-900 text-lg text-slate-950"
                : "min-h-[44px] border-slate-300 text-slate-700"
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
  const { isAccessible } = useAccessibilityContext();
  const { action, pedido } = activeModal;

  if (action === "detail") {
    return (
      <ModalShell onClose={onClose} title={`Pedido #${getPedidoDisplayNumber(pedido)}`}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge estado={pedido.estado} />
            <span className="font-bold text-slate-600">{formatTime(pedido.createdAt)}</span>
            <span className="font-bold text-slate-600">{formatMetodoPago(pedido.metodoPago)}</span>
          </div>
          {pedido.clienteNombre && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Cliente</p>
              <p className="mt-1 text-lg font-black text-slate-950">{pedido.clienteNombre}</p>
            </div>
          )}
          <div className="space-y-3">
            {(pedido.detalles ?? []).map((detalle) => (
              <div key={detalle.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-black leading-snug text-slate-950">
                      {detalle.cantidad}x {getItemName(detalle)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {formatCurrency(detalle.precioUnitario)} c/u
                    </p>
                  </div>
                  <p className="shrink-0 font-black text-slate-950">{formatCurrency(detalle.subtotal)}</p>
                </div>
                <DetalleSeleccion detalle={detalle} isAccessible={isAccessible} />
              </div>
            ))}
          </div>
          {pedido.observacion && (
            <div className="rounded-2xl border-2 border-yellow-300 bg-[#FFF8DC] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-yellow-900">Observación del pedido</p>
              <p className="mt-1 font-bold leading-relaxed text-slate-900">{pedido.observacion}</p>
            </div>
          )}
          <p className="text-right text-2xl font-black text-slate-950">Total {formatCurrency(pedido.total)}</p>
        </div>
      </ModalShell>
    );
  }

  if (action === "history") {
    return (
      <ModalShell onClose={onClose} title={`Historial del pedido #${getPedidoDisplayNumber(pedido)}`}>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-black text-slate-950">Historial no disponible</p>
          <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600">
            Este proyecto todavía no tiene un endpoint o registro real de cambios de estado. Cuando exista, aquí se
            podrá mostrar estado anterior, estado nuevo, hora del cambio y usuario responsable.
          </p>
        </div>
      </ModalShell>
    );
  }

  if (action === "state") {
    const allowedOptions = getAllowedEstadoOptions(pedido.estado);
    const unavailableMessage =
      pedido.estado === "entregado"
        ? "Pedido finalizado"
        : pedido.estado === "cancelado"
          ? "Pedido cancelado"
          : "Este pedido no tiene cambios de estado disponibles.";

    return (
      <ModalShell onClose={onClose} title={`Cambiar estado del pedido #${getPedidoDisplayNumber(pedido)}`}>
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
    <ModalShell
      onClose={onClose}
      title={
        isFinish
          ? `Marcar pedido #${getPedidoDisplayNumber(pedido)} como entregado`
          : `Cancelar pedido #${getPedidoDisplayNumber(pedido)}`
      }
    >
      <div className="space-y-5">
        <p className="text-xl font-black text-slate-950">
          {isFinish ? "¿Deseas marcar este pedido como entregado?" : "¿Deseas cancelar este pedido?"}
        </p>
        <p className="font-bold text-slate-600">
          {isFinish
            ? "Confirma solo si el pedido ya fue entregado al cliente."
            : "Esta acción cambiará el estado del pedido a cancelado."}
        </p>
        <p className="font-bold text-slate-600">
          Pedido #{getPedidoDisplayNumber(pedido)} · {formatCurrency(pedido.total)}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[62px] rounded-2xl border border-slate-300 bg-white px-5 text-lg font-black text-slate-900 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
          >
            {isFinish ? "Cancelar" : "No cancelar"}
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
            {isUpdating ? "Guardando..." : isFinish ? "Marcar entregado" : "Cancelar pedido"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function DetalleSeleccion({ detalle, isAccessible }: { detalle: PedidoDetalleResponse; isAccessible: boolean }) {
  const aderezos = detalle.personalizacion?.aderezos ?? [];
  const comentario = detalle.personalizacion?.comentario?.trim();
  const variante = detalle.variante?.nombre;

  if (!variante && aderezos.length === 0 && !comentario) return null;

  const varianteNormalizada = variante?.toLocaleLowerCase("es") ?? "";
  const esTipoCarne = ["churrasco", "pollo", "lomito", "mechada", "ave", "lomo"].some((carne) =>
    varianteNormalizada.includes(carne)
  );

  return (
    <div className={`mt-2 space-y-2 ${isAccessible ? "text-lg" : "text-sm"}`}>
      {variante && (
        <p className="w-fit rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 font-black text-slate-900">
          {esTipoCarne ? "Carne" : "Opción"}: {variante}
        </p>
      )}
      {aderezos.length > 0 && (
        <p className="font-bold leading-relaxed text-slate-700">
          <span className="font-black">Aderezos:</span> {aderezos.join(", ")}
        </p>
      )}
      {comentario && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2.5 text-slate-950">
          <p className="text-xs font-black uppercase tracking-wide text-amber-900">Comentario para cocina</p>
          <p className="mt-1 font-black leading-relaxed">{comentario}</p>
        </div>
      )}
    </div>
  );
}

export function EmptyPedidosMessage({ isAccessible = false }: { isAccessible?: boolean }) {
  return (
    <div
      className={`rounded-[26px] bg-white p-8 sm:p-10 ${
        isAccessible ? "border-2 border-slate-900" : "border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
      }`}
    >
      <div className="mx-auto max-w-2xl text-center">
        <div
          className={`mx-auto flex items-center justify-center rounded-2xl border text-slate-950 ${
            isAccessible ? "h-20 w-20 border-2 border-slate-900 bg-white" : "h-14 w-14 border-yellow-200 bg-[#FFF8DC]"
          }`}
        >
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
