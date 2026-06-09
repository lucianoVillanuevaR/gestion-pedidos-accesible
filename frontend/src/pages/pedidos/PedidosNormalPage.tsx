import { AlertTriangle, CalendarDays, Check, Clock3, Eye, Filter, LoaderCircle, RefreshCw, Search, Store, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { useAuthContext } from "../../contexts/AuthContext";
import useActionVoice from "../../hooks/useActionVoice";
import { guardarCierreTurno } from "../../services/cierresTurno";
import type { AuthUser, EstadoPedido, PedidoResponse } from "../../types";
import {
  buildCierreTurno,
  EmptyPedidosMessage,
  ESTADO_META,
  ESTADO_OPTIONS,
  FOCUS_VISIBLE_CLASS,
  formatCurrency,
  formatDateTime,
  formatElapsedTime,
  formatMetodoPago,
  getCierrePedidosResumen,
  getFechaInicioTurno,
  getPedidoSummary,
  getProductosVendidosResumen,
  getProductCount,
  getTurnoSummary,
  isPedidoDelayed,
  PedidoModal,
  readTurnoAbierto,
  setTurnoAbierto,
  setTurnoFechaInicio,
  StatusBadge,
  usePedidosController,
  type ActiveModal,
  type EstadoFilter
} from "./PedidosShared";

function PedidosNormalPage() {
  const { isHighContrast, isVoiceEnabled } = useAccessibilityContext();
  const { user } = useAuthContext();
  const { speak, speakAction } = useActionVoice(isVoiceEnabled);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [isSavingCierre, setIsSavingCierre] = useState(false);
  const [cierreMessage, setCierreMessage] = useState<string | null>(null);
  const [isTurnoOpen, setIsTurnoOpen] = useState(() => readTurnoAbierto());

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
  const turnoSummary = useMemo(() => getTurnoSummary(pedidos), [pedidos]);

  const handleCerrarTurno = async () => {
    try {
      setIsSavingCierre(true);
      const cierre = buildCierreTurno(pedidos, user);
      await guardarCierreTurno(cierre);
      const message = `Turno cerrado: ${formatCurrency(String(cierre.totalVendido))} vendidos.`;
      setCierreMessage(message);
      setIsCierreModalOpen(false);
      setTurnoAbierto(false);
      setIsTurnoOpen(false);
      await loadPedidos();
      speakAction(message, `cierre-turno:${message}`);
    } catch (requestError) {
      setCierreMessage(requestError instanceof Error ? requestError.message : "No fue posible cerrar el turno");
    } finally {
      setIsSavingCierre(false);
    }
  };

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

  const handleOpenCierreModal = () => {
    setIsCierreModalOpen(true);
    speak(
      `Cerrar turno. Total vendido ${formatCurrency(String(turnoSummary.totalVendido))}. Hay ${turnoSummary.pedidosPendientes} pedidos pendientes.`,
      {
        priority: "high",
        dedupeKey: "abrir-cierre-turno",
        cooldownMs: 2500,
        interrupt: true
      }
    );
  };

  const handleAbrirTurno = () => {
    const fechaInicio = new Date().toISOString();
    setTurnoAbierto(true);
    setIsTurnoOpen(true);
    setTurnoFechaInicio(fechaInicio);
    setCierreMessage("Turno abierto. Ya puedes registrar nuevos pedidos.");
    speakAction("Turno abierto.", "abrir-turno");
    loadPedidos();
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
        <NormalPedidosToolbar
          estadoFilter={estadoFilter}
          isHighContrast={isHighContrast}
          isLoading={isLoading}
          isTurnoOpen={isTurnoOpen}
          loadPedidos={handleRefreshPedidos}
          onOpenTurno={handleAbrirTurno}
          onCloseTurno={handleOpenCierreModal}
          searchTerm={searchTerm}
          setEstadoFilter={handleEstadoFilterChange}
          setSearchTerm={setSearchTerm}
          summary={normalSummary}
        />

        {cierreMessage && (
          <div className={`rounded-2xl border px-4 py-3 text-sm font-black ${isHighContrast ? "contrast-panel" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`} role="status">
            {cierreMessage}
          </div>
        )}

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

        {isCierreModalOpen && (
          <CierreTurnoModal
            isSaving={isSavingCierre}
            onClose={() => setIsCierreModalOpen(false)}
            onConfirm={handleCerrarTurno}
            pedidos={pedidos}
            summary={turnoSummary}
            user={user}
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
        <p className="mt-2 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
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
  isTurnoOpen,
  loadPedidos,
  onCloseTurno,
  onOpenTurno,
  searchTerm,
  setEstadoFilter,
  setSearchTerm,
  summary
}: {
  estadoFilter: EstadoFilter;
  isHighContrast: boolean;
  isLoading: boolean;
  isTurnoOpen: boolean;
  loadPedidos: () => void;
  onCloseTurno: () => void;
  onOpenTurno: () => void;
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
                      ? "border-[#FECE00] bg-amber-50 text-slate-950"
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

        <div className="grid shrink-0 gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-xs font-black uppercase text-emerald-700">Vendido entregado</p>
            <p className="text-lg font-black text-slate-950">{formatCurrency(String(summary.totalVendido))}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-[#FFF8DC] px-3 py-2">
            <p className="text-xs font-black uppercase text-amber-700">Pendiente</p>
            <p className="text-lg font-black text-slate-950">{formatCurrency(String(summary.totalPendiente))}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
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
          onClick={isTurnoOpen ? onCloseTurno : onOpenTurno}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition ${
            isHighContrast
              ? "contrast-button-secondary"
              : isTurnoOpen
                ? "border-slate-900 bg-slate-900 text-white hover:bg-black"
                : "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
          } ${FOCUS_VISIBLE_CLASS}`}
        >
          <Check className="h-5 w-5" aria-hidden="true" />
          {isTurnoOpen ? "Cerrar turno" : "Abrir turno"}
        </button>

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

function CierreTurnoModal({
  isSaving,
  onClose,
  onConfirm,
  pedidos,
  summary,
  user
}: {
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pedidos: PedidoResponse[];
  summary: ReturnType<typeof getTurnoSummary>;
  user: AuthUser | null;
}) {
  const fechaCierre = new Date();
  const fechaInicio = getFechaInicioTurno(pedidos);
  const hasPedidosActivos = summary.pedidosPendientes > 0;
  const productosVendidos = useMemo(() => getProductosVendidosResumen(pedidos), [pedidos]);
  const pedidosDetalle = useMemo(() => getCierrePedidosResumen(pedidos), [pedidos]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cierre-turno-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="cierre-turno-title" className="text-2xl font-black text-slate-950">Cerrar turno</h2>
            <p className="mt-2 text-sm font-bold text-slate-600">
              Al cerrar el turno, se guardará el resumen de pedidos del período actual.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
          >
            Volver
          </button>
        </div>

        {hasPedidosActivos && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-[#FFF8DC] p-4 text-amber-950">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="font-black">Aún existen pedidos activos. Revisa antes de cerrar el turno.</p>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <CierreSummaryItem label="Fecha actual" value={formatDateTime(fechaCierre.toISOString())} />
          <CierreSummaryItem label="Inicio del turno" value={fechaInicio ? formatDateTime(fechaInicio) : "Sin datos"} />
          <CierreSummaryItem label="Usuario/cajero" value={user?.label ?? user?.username ?? "No identificado"} />
          <CierreSummaryItem label="Total de pedidos" value={String(summary.totalPedidos)} />
          <CierreSummaryItem label="Pedidos entregados" value={String(summary.pedidosEntregados)} />
          <CierreSummaryItem label="Pedidos cancelados" value={String(summary.pedidosCancelados)} />
          <CierreSummaryItem label="Pedidos pendientes" value={String(summary.pedidosPendientes)} />
          <CierreSummaryItem label="Vendido entregado" value={formatCurrency(String(summary.totalVendido))} isStrong />
          <CierreSummaryItem label="Pendiente no vendido" value={formatCurrency(String(summary.totalPendiente))} />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black uppercase text-slate-500">Total por método de pago</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <CierreSummaryItem label="Efectivo" value={formatCurrency(String(summary.totalEfectivo))} />
            <CierreSummaryItem label="Tarjeta" value={formatCurrency(String(summary.totalTarjeta))} />
            <CierreSummaryItem label="Transferencia" value={formatCurrency(String(summary.totalTransferencia))} />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black uppercase text-slate-500">Recuento de productos vendidos</p>
            <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              {productosVendidos.reduce((total, producto) => total + producto.cantidad, 0)} unidades
            </p>
          </div>
          {productosVendidos.length === 0 ? (
            <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
              No hay productos vendidos en pedidos entregados.
            </p>
          ) : (
            <div className="mt-3 max-h-[220px] overflow-y-auto rounded-xl border border-slate-200">
              {productosVendidos.map((producto) => (
                <div key={producto.productoId} className="grid gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_90px_120px] sm:items-center">
                  <p className="font-black text-slate-950">{producto.productoNombre}</p>
                  <p className="font-black text-slate-700">{producto.cantidad} un.</p>
                  <p className="font-black text-slate-950 sm:text-right">{formatCurrency(String(producto.total))}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black uppercase text-slate-500">Detalle de pedidos guardados</p>
            <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
              {pedidosDetalle.length} pedidos
            </p>
          </div>
          <div className="mt-3 max-h-[340px] space-y-3 overflow-y-auto pr-1">
            {pedidosDetalle.map((pedido) => (
              <article key={pedido.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-950">Pedido #{pedido.id}</p>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {pedido.createdAt ? formatDateTime(pedido.createdAt) : "Sin fecha"} · {formatMetodoPago(pedido.metodoPago)}
                    </p>
                    {pedido.clienteNombre && <p className="mt-1 text-sm font-black text-slate-800">Cliente: {pedido.clienteNombre}</p>}
                  </div>
                  <div className="text-right">
                    <StatusBadge estado={pedido.estado} />
                    <p className="mt-2 text-lg font-black text-slate-950">{formatCurrency(String(pedido.total))}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-slate-200 bg-white">
                  {pedido.detalles.map((detalle) => (
                    <div key={`${pedido.id}-${detalle.productoId}-${detalle.productoNombre}`} className="grid gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0 sm:grid-cols-[1fr_80px_110px] sm:items-center">
                      <p className="font-bold text-slate-900">{detalle.productoNombre}</p>
                      <p className="font-bold text-slate-600">{detalle.cantidad} un.</p>
                      <p className="font-black text-slate-950 sm:text-right">{formatCurrency(String(detalle.subtotal))}</p>
                    </div>
                  ))}
                </div>
                {pedido.observacion && (
                  <p className="mt-3 rounded-xl border border-yellow-200 bg-[#FFF8DC] px-3 py-2 text-sm font-bold text-slate-800">
                    {pedido.observacion}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[50px] rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className={`min-h-[50px] rounded-xl border border-slate-900 bg-slate-900 px-4 font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
          >
            {isSaving ? "Guardando..." : "Sí, cerrar turno"}
          </button>
        </div>
      </section>
    </div>
  );
}

function CierreSummaryItem({ isStrong = false, label, value }: { isStrong?: boolean; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-slate-950 ${isStrong ? "text-2xl font-black" : "text-base font-black"}`}>{value}</p>
    </div>
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
    info: "border-[#FECE00] bg-white text-amber-700 hover:bg-amber-50",
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
      statusLabel: "Cancelado" | "Finalizado" | null;
    }
  > = {
    cancelado: {
      showCancel: false,
      showFinish: false,
      statusLabel: "Cancelado"
    },
    entregado: {
      showCancel: false,
      showFinish: false,
      statusLabel: "Finalizado"
    },
    en_preparacion: {
      showCancel: true,
      showFinish: false,
      statusLabel: null
    },
    listo: {
      showCancel: false,
      showFinish: true,
      statusLabel: null
    },
    pendiente: {
      showCancel: true,
      showFinish: false,
      statusLabel: null
    }
  };

  return actionStateByEstado[estado];
}

export default PedidosNormalPage;
