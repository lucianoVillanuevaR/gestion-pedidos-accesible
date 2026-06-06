import { AlertTriangle, CalendarDays, Check, Clock3, CreditCard, Eye, Filter, LoaderCircle, RefreshCw, Search, Store, X } from "lucide-react";
import { useState } from "react";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import type { EstadoPedido, PedidoResponse } from "../../types";
import {
  EmptyPedidosMessage,
  ESTADO_OPTIONS,
  FOCUS_VISIBLE_CLASS,
  formatCurrency,
  formatElapsedTime,
  formatMetodoPago,
  getPedidoSummary,
  getProductCount,
  isPedidoDelayed,
  PedidoModal,
  StatusBadge,
  usePedidosController,
  type ActiveModal,
  type EstadoFilter
} from "./PedidosShared";

function PedidosNormalPage() {
  const { isHighContrast } = useAccessibilityContext();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    activeModal,
    error,
    estadoFilter,
    filteredPedidos,
    handleEstadoChange,
    isLoading,
    loadPedidos,
    normalSummary,
    setActiveModal,
    setEstadoFilter,
    updatingPedidoId
  } = usePedidosController({ searchTerm });

  const panelClass = isHighContrast
    ? "contrast-panel border-yellow-400 bg-black"
    : "border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]";

  const headerBg = isHighContrast
    ? "bg-black text-white border-b-2 border-yellow-400"
    : "bg-[#FECE00] text-[#1F2937] border-b border-amber-200";

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className={headerBg}>
        <div className="mx-auto flex h-[64px] min-h-[64px] w-full max-w-[1520px] items-center px-3 sm:px-4 lg:px-5 xl:px-6">
          <h1 className="font-black leading-none tracking-tight contrast-important text-xl">
            Pedidos
          </h1>
        </div>
      </div>

      <section className="mx-auto w-full max-w-[1520px] space-y-4 px-3 py-2 sm:px-4 sm:py-3 lg:px-5 xl:px-6">
        <NormalPedidosToolbar
          estadoFilter={estadoFilter}
          isHighContrast={isHighContrast}
          isLoading={isLoading}
          loadPedidos={loadPedidos}
          searchTerm={searchTerm}
          setEstadoFilter={setEstadoFilter}
          setSearchTerm={setSearchTerm}
          summary={normalSummary}
        />

        {error && (
          <div className={`flex items-start gap-3 rounded-2xl border p-4 ${isHighContrast ? "contrast-panel" : "border-red-200 bg-red-50 text-red-950"}`} role="alert">
            <AlertTriangle className="mt-1 h-5 w-5" aria-hidden="true" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className={`flex min-h-[260px] items-center justify-center rounded-[26px] ${panelClass}`}>
            <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
            <span className="ml-3 font-black">Cargando pedidos...</span>
          </div>
        ) : (
          <NormalPedidosList
            pedidos={filteredPedidos}
            onEstadoChange={handleEstadoChange}
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
  onEstadoChange,
  onOpenModal,
  pedidos,
  updatingPedidoId
}: {
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onOpenModal: (modal: ActiveModal) => void;
  pedidos: PedidoResponse[];
  updatingPedidoId: number | null;
}) {
  if (pedidos.length === 0) {
    return <EmptyPedidosMessage />;
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase text-slate-400 md:grid md:grid-cols-[170px_180px_150px_minmax(0,1fr)_270px] xl:grid-cols-[180px_180px_160px_minmax(0,1fr)_282px]">
        <span>Fecha</span>
        <span>Estado</span>
        <span>Total</span>
        <span>Pedido</span>
        <span className="text-right">Acciones</span>
      </div>

      <div className="divide-y divide-slate-100">
        {pedidos.map((pedido) => (
          <NormalPedidoRow
            key={pedido.id}
            isUpdating={updatingPedidoId === pedido.id}
            onEstadoChange={onEstadoChange}
            onOpenModal={onOpenModal}
            pedido={pedido}
          />
        ))}
      </div>
    </div>
  );
}

function NormalPedidoRow({
  isUpdating,
  onEstadoChange,
  onOpenModal,
  pedido
}: {
  isUpdating: boolean;
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onOpenModal: (modal: ActiveModal) => void;
  pedido: PedidoResponse;
}) {
  const createdAt = getCreatedDateLabel(pedido.createdAt);
  const delayed = isPedidoDelayed(pedido);
  const nextEstado = getNextEstado(pedido.estado);
  const canCancel = !["cancelado", "entregado"].includes(pedido.estado);
  const canAccept = nextEstado !== null;

  return (
    <article className="grid gap-4 border-l-4 border-[#FECE00] px-4 py-4 transition hover:bg-[#FFFDF3] md:grid-cols-[170px_180px_150px_minmax(0,1fr)_270px] md:items-center xl:grid-cols-[180px_180px_160px_minmax(0,1fr)_282px]">
      <div>
        <p className="flex items-center gap-1.5 font-black text-amber-600">
          #{pedido.id}
          <Store className="h-4 w-4" aria-hidden="true" />
          En el local
        </p>
        <p className={`mt-2 flex items-center gap-1.5 text-sm font-bold ${delayed ? "text-orange-600" : "text-slate-600"}`}>
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          {formatElapsedTime(pedido.createdAt)}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {createdAt}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge estado={pedido.estado} />
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">PDV</span>
        <span className="truncate text-xs font-bold text-slate-500">{formatMetodoPago(pedido.metodoPago)}</span>
      </div>

      <div>
        <p className="text-lg font-black text-slate-950">{formatCurrency(pedido.total)}</p>
        <p className="mt-2 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
          {formatMetodoPago(pedido.metodoPago)}
        </p>
      </div>

      <div>
        <p className="line-clamp-2 font-bold leading-snug text-slate-800">{getPedidoSummary(pedido)}</p>
        <p className="mt-2 text-xs font-bold text-slate-500">{getProductCount(pedido)} productos</p>
      </div>

      <NormalPedidoActions
        canAccept={canAccept}
        canCancel={canCancel}
        isUpdating={isUpdating}
        nextEstado={nextEstado}
        onEstadoChange={onEstadoChange}
        onOpenModal={onOpenModal}
        pedido={pedido}
      />
    </article>
  );
}

function NormalPedidoActions({
  canAccept,
  canCancel,
  isUpdating,
  nextEstado,
  onEstadoChange,
  onOpenModal,
  pedido
}: {
  canAccept: boolean;
  canCancel: boolean;
  isUpdating: boolean;
  nextEstado: EstadoPedido | null;
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onOpenModal: (modal: ActiveModal) => void;
  pedido: PedidoResponse;
}) {
  return (
    <div className="flex flex-wrap gap-2 md:justify-end">
      <BoardActionButton
        disabled={!canCancel || isUpdating}
        icon={<X className="h-5 w-5" aria-hidden="true" />}
        label="Cancelar"
        onClick={() => onOpenModal({ action: "cancel", pedido })}
        tone="danger"
      />
      <BoardActionButton
        icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
        label="Pago"
        onClick={() => onOpenModal({ action: "detail", pedido })}
        tone="info"
      />
      <BoardActionButton
        disabled={!canAccept || isUpdating}
        icon={canAccept ? <Check className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        label={canAccept ? "Aceptar" : "Ver"}
        onClick={() => {
          if (!nextEstado) {
            onOpenModal({ action: "detail", pedido });
            return;
          }

          if (nextEstado === "entregado") {
            onOpenModal({ action: "finish", pedido });
            return;
          }

          onEstadoChange(pedido, nextEstado);
        }}
        tone="success"
      />
    </div>
  );
}

function NormalPedidosToolbar({
  estadoFilter,
  isHighContrast,
  isLoading,
  loadPedidos,
  searchTerm,
  setEstadoFilter,
  setSearchTerm,
  summary
}: {
  estadoFilter: EstadoFilter;
  isHighContrast: boolean;
  isLoading: boolean;
  loadPedidos: () => void;
  searchTerm: string;
  setEstadoFilter: (value: EstadoFilter) => void;
  setSearchTerm: (value: string) => void;
  summary: ReturnType<typeof import("./PedidosShared").getNormalSummary>;
}) {
  const countsByFilter: Record<EstadoFilter, number> = {
    cancelado: summary.total - summary.pendientes - summary.enPreparacion - summary.listos - summary.entregados,
    entregado: summary.entregados,
    en_preparacion: summary.enPreparacion,
    listo: summary.listos,
    pendiente: summary.pendientes,
    todos: summary.total
  };

  return (
    <section className={`overflow-hidden rounded-[10px] ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]"}`}>
      <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-slate-600">
            <Filter className="h-5 w-5" aria-hidden="true" />
          </span>
          {ESTADO_OPTIONS.map((option) => {
            const isActive = estadoFilter === option.value;
            const count = countsByFilter[option.value];

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setEstadoFilter(option.value)}
                aria-pressed={isActive}
                className={`inline-flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-bold transition ${
                  isHighContrast
                    ? isActive
                      ? "contrast-button-primary"
                      : "contrast-button-secondary"
                    : isActive
                      ? "border-[#006BFF] bg-blue-50 text-[#006BFF]"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                } ${FOCUS_VISIBLE_CLASS}`}
              >
                {isActive && <Check className="h-4 w-4" aria-hidden="true" />}
                {option.label}
                {count > 0 && (
                  <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-black ${
                    option.value === "pendiente"
                      ? "bg-orange-500 text-white"
                      : option.value === "en_preparacion" || option.value === "listo"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-700"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 text-sm font-bold text-slate-600">
          <span>Total:</span>
          <span className="text-lg font-black text-blue-700">{formatCurrency(String(summary.totalVendido))}</span>
          <Eye className="h-5 w-5 text-slate-500" aria-hidden="true" />
        </div>
      </div>

      <div className="grid gap-3 px-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar pedido</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar pedido, producto o método de pago"
            className={`min-h-[44px] w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-slate-900 ${FOCUS_VISIBLE_CLASS}`}
          />
        </label>

        <button
          type="button"
          onClick={() => loadPedidos()}
          disabled={isLoading}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isHighContrast
              ? "contrast-button-secondary"
              : "border-amber-300 bg-[#FFF8DC] text-slate-950 hover:bg-[#FFF4BF]"
          } ${FOCUS_VISIBLE_CLASS}`}
        >
          <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>
    </section>
  );
}

function BoardActionButton({
  disabled = false,
  icon,
  label,
  onClick,
  tone
}: {
  disabled?: boolean;
  icon: JSX.Element;
  label: string;
  onClick: () => void;
  tone: "danger" | "info" | "success";
}) {
  const toneClass = {
    danger: "border-red-500 bg-white text-red-600 hover:bg-red-50",
    info: "border-[#006BFF] bg-white text-[#006BFF] hover:bg-blue-50",
    success: "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[52px] min-w-[84px] flex-col items-center justify-center rounded-lg border px-3 text-sm font-black leading-tight transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${FOCUS_VISIBLE_CLASS}`}
    >
      {icon}
      {label}
    </button>
  );
}

function getCreatedDateLabel(value?: string) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "2-digit"
  }).format(new Date(value));
}

function getNextEstado(estado: EstadoPedido): EstadoPedido | null {
  const nextByEstado: Record<EstadoPedido, EstadoPedido | null> = {
    cancelado: null,
    entregado: null,
    en_preparacion: "listo",
    listo: "entregado",
    pendiente: "en_preparacion"
  };

  return nextByEstado[estado];
}

export default PedidosNormalPage;
