import { AlertTriangle, CalendarDays, Check, Clock3, Eye, Filter, LoaderCircle, RefreshCw, Search, Store, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
import type { EstadoPedido, PedidoResponse } from "../../types";
import {
  EmptyPedidosMessage,
  ESTADO_META,
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
  const { isHighContrast, isVoiceEnabled } = useAccessibilityContext();
  const { speak, speakAction } = useActionVoice(isVoiceEnabled);
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
    pedidos,
    setActiveModal,
    setEstadoFilter,
    updatingPedidoId
  } = usePedidosController({ searchTerm });
  const entregadosHoy = useMemo(() => getEntregadosHoy(pedidos), [pedidos]);

  const handleRefreshPedidos = () => {
    speak("Actualizando pedidos.", {
      priority: "normal",
      dedupeKey: "pedidos-normal-refresh",
      cooldownMs: 1200
    });
    loadPedidos();
  };

  const handleNormalEstadoChange = async (pedido: PedidoResponse, estado: EstadoPedido) => {
    await handleEstadoChange(pedido, estado);
    speak(`Pedido ${pedido.id} actualizado a ${ESTADO_META[estado].label}.`, {
      priority: "high",
      dedupeKey: `pedido-normal-estado:${pedido.id}:${estado}`,
      cooldownMs: 1800,
      interrupt: true
    });
  };

  const handleEstadoFilterChange = (value: EstadoFilter) => {
    setEstadoFilter(value);
    const label = value === "todos" ? "Todos" : ESTADO_META[value].label;
    speakAction(label, `pedido-filtro:${value}`);
  };

  const panelClass = isHighContrast
    ? "contrast-panel border-yellow-400 bg-black"
    : "border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]";

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <section className="mx-auto w-full max-w-[1640px] space-y-4 px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
        <PedidosActivosHeader
          entregadosHoy={entregadosHoy}
          isHighContrast={isHighContrast}
          summary={normalSummary}
        />

        <NormalPedidosToolbar
          estadoFilter={estadoFilter}
          isHighContrast={isHighContrast}
          isLoading={isLoading}
          loadPedidos={handleRefreshPedidos}
          searchTerm={searchTerm}
          setEstadoFilter={handleEstadoFilterChange}
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
            onOpenModal={setActiveModal}
            updatingPedidoId={updatingPedidoId}
          />
        )}

        {activeModal && (
          <PedidoModal
            activeModal={activeModal}
            isUpdating={updatingPedidoId === activeModal.pedido.id}
            onClose={() => setActiveModal(null)}
            onEstadoChange={handleNormalEstadoChange}
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
    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase text-slate-400 md:grid md:grid-cols-[170px_170px_130px_minmax(0,1fr)_210px] xl:grid-cols-[180px_180px_140px_minmax(0,1fr)_240px]">
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
            onOpenModal={onOpenModal}
            pedido={pedido}
          />
        ))}
      </div>
    </div>
  );
}

function PedidosActivosHeader({
  entregadosHoy,
  isHighContrast,
  summary
}: {
  entregadosHoy: number;
  isHighContrast: boolean;
  summary: ReturnType<typeof import("./PedidosShared").getNormalSummary>;
}) {
  const cards = [
    { label: "Pendientes", value: summary.pendientes },
    { label: "En preparación", value: summary.enPreparacion },
    { label: "Listos", value: summary.listos },
    { label: "Entregados hoy", value: entregadosHoy }
  ];

  return (
    <header className={`rounded-[10px] border px-4 py-4 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]"}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black leading-tight text-slate-950">Pedidos activos</h1>
          <p className="mt-1 max-w-2xl text-sm font-bold text-slate-600">
            Revisa pedidos pendientes, en preparación, listos y entregados recientemente.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[560px]">
          {cards.map((card) => (
            <article key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-black uppercase text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{card.value}</p>
            </article>
          ))}
        </div>
      </div>
    </header>
  );
}

function NormalPedidoRow({
  isUpdating,
  onOpenModal,
  pedido
}: {
  isUpdating: boolean;
  onOpenModal: (modal: ActiveModal) => void;
  pedido: PedidoResponse;
}) {
  const createdAt = getCreatedDateLabel(pedido.createdAt);
  const delayed = isPedidoDelayed(pedido);
  const isCancelled = pedido.estado === "cancelado";

  return (
    <article className={`grid gap-4 border-l-4 px-4 py-4 transition md:grid-cols-[170px_170px_130px_minmax(0,1fr)_210px] md:items-center xl:grid-cols-[180px_180px_140px_minmax(0,1fr)_240px] ${
      isCancelled ? "border-red-300 bg-slate-50 hover:bg-slate-50" : "border-[#FECE00] hover:bg-[#FFFDF3]"
    }`}>
      <div>
        <p className="flex items-center gap-1.5 font-black text-yellow-600">
          #{pedido.id}
          <Store className="h-4 w-4" aria-hidden="true" />
          En el local
        </p>
        <p className={`mt-2 flex items-center gap-1.5 text-sm font-bold ${delayed ? "text-yellow-600" : "text-slate-600"}`}>
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          {formatElapsedTime(pedido.createdAt)}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {createdAt}
        </p>
        {pedido.clienteNombre && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-black text-slate-950">
            <User className="h-4 w-4" aria-hidden="true" />
            {pedido.clienteNombre}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge estado={pedido.estado} />
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">PDV</span>
        <span className="truncate text-xs font-bold text-slate-500">{formatMetodoPago(pedido.metodoPago)}</span>
      </div>

      <div>
        <p className="text-lg font-black text-slate-950">{formatCurrency(pedido.total)}</p>
        <p className="mt-2 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-700">
          {formatMetodoPago(pedido.metodoPago)}
        </p>
      </div>

      <div>
        <p className="line-clamp-2 font-bold leading-snug text-slate-800">{getPedidoSummary(pedido)}</p>
        <p className="mt-2 text-xs font-bold text-slate-500">{getProductCount(pedido)} productos</p>
      </div>

      <NormalPedidoActions
        isUpdating={isUpdating}
        onOpenModal={onOpenModal}
        pedido={pedido}
      />
    </article>
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
  const actions = getPedidoActionState(pedido.estado);

  return (
    <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-end">
      <BoardActionButton
        icon={<Eye className="h-5 w-5" aria-hidden="true" />}
        label="Ver"
        onClick={() => onOpenModal({ action: "detail", pedido })}
        tone="success"
      />

      {actions.showCancel && (
        <BoardActionButton
          disabled={isUpdating}
          icon={<X className="h-5 w-5" aria-hidden="true" />}
          label="Cancelar"
          onClick={() => onOpenModal({ action: "cancel", pedido })}
          tone="danger"
        />
      )}

      {actions.showState && (
        <BoardActionButton
          disabled={isUpdating}
          icon={<RefreshCw className="h-5 w-5" aria-hidden="true" />}
          label="Cambiar"
          onClick={() => onOpenModal({ action: "state", pedido })}
          tone="info"
        />
      )}

      {actions.showFinish && (
        <BoardActionButton
          disabled={isUpdating}
          icon={<Check className="h-5 w-5" aria-hidden="true" />}
          label="Finalizar"
          onClick={() => onOpenModal({ action: "finish", pedido })}
          tone="success"
        />
      )}

      {actions.statusLabel && (
        <BoardActionStatus
          icon={actions.statusLabel === "Finalizado" ? <Check className="h-5 w-5" aria-hidden="true" /> : <X className="h-5 w-5" aria-hidden="true" />}
          label={actions.statusLabel}
          tone={actions.statusLabel === "Finalizado" ? "success" : "danger"}
        />
      )}
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
                      ? "border-[#FECE00] bg-yellow-50 text-slate-950"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                } ${FOCUS_VISIBLE_CLASS}`}
              >
                {isActive && <Check className="h-4 w-4" aria-hidden="true" />}
                {option.label}
                {count > 0 && (
                  <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-black ${
                    option.value === "pendiente"
                      ? "bg-yellow-500 text-white"
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

        <p className="shrink-0 text-sm font-black text-slate-600">{summary.total} pedidos visibles</p>
      </div>

      <div className="grid gap-3 px-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar pedido</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por número de pedido, producto, cliente o método de pago"
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
              : "border-slate-900 bg-slate-900 text-white hover:bg-black"
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
    info: "border-[#FECE00] bg-white text-yellow-700 hover:bg-yellow-50",
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

function BoardActionStatus({
  icon,
  label,
  tone
}: {
  icon: JSX.Element;
  label: "Cancelado" | "Finalizado";
  tone: "danger" | "success";
}) {
  const toneClass = {
    danger: "border-red-200 bg-red-50 text-red-700",
    success: "border-slate-200 bg-slate-100 text-slate-700"
  }[tone];

  return (
    <span className={`inline-flex min-h-[52px] min-w-[84px] flex-col items-center justify-center rounded-lg border px-3 text-sm font-black leading-tight ${toneClass}`}>
      {icon}
      {label}
    </span>
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

function getPedidoActionState(estado: EstadoPedido) {
  const actionStateByEstado: Record<
    EstadoPedido,
    {
      showCancel: boolean;
      showFinish: boolean;
      showState: boolean;
      statusLabel: "Cancelado" | "Finalizado" | null;
    }
  > = {
    cancelado: {
      showCancel: false,
      showFinish: false,
      showState: false,
      statusLabel: "Cancelado"
    },
    entregado: {
      showCancel: false,
      showFinish: false,
      showState: false,
      statusLabel: "Finalizado"
    },
    en_preparacion: {
      showCancel: true,
      showFinish: false,
      showState: true,
      statusLabel: null
    },
    listo: {
      showCancel: false,
      showFinish: true,
      showState: false,
      statusLabel: null
    },
    pendiente: {
      showCancel: true,
      showFinish: false,
      showState: true,
      statusLabel: null
    }
  };

  return actionStateByEstado[estado];
}

function getEntregadosHoy(pedidos: PedidoResponse[]) {
  const today = new Date();

  return pedidos.filter((pedido) => {
    if (pedido.estado !== "entregado" || !pedido.createdAt) {
      return false;
    }

    const createdAt = new Date(pedido.createdAt);

    return createdAt.getFullYear() === today.getFullYear()
      && createdAt.getMonth() === today.getMonth()
      && createdAt.getDate() === today.getDate();
  }).length;
}

export default PedidosNormalPage;
