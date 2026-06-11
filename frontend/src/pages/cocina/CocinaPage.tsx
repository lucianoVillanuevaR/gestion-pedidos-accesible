import {
  Accessibility,
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  ChefHat,
  Clock3,
  Eye,
  LoaderCircle,
  RefreshCw,
  Settings,
  UtensilsCrossed
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
import { obtenerCierresTurno } from "../../services/cierresTurno";
import type { CierrePedidoResumen, CierreTurno, EstadoPedido, PedidoResponse } from "../../types";
import {
  ESTADO_META,
  FOCUS_VISIBLE_CLASS,
  PedidoModal,
  StatusBadge,
  formatElapsedTime,
  formatTime,
  getPedidoCounts,
  getPedidoSummary,
  getProductCount,
  isPedidoDelayed,
  usePedidosController,
  type ActiveModal
} from "../pedidos/PedidosShared";

const AUTO_REFRESH_MS = 12000;

function CocinaPage() {
  return <CocinaBoard isAccessibleView={false} />;
}

export function CocinaFacilPage() {
  return <CocinaBoard isAccessibleView />;
}

export function CocinaHistorialPage() {
  const { isHighContrast, isVoiceEnabled } = useAccessibilityContext();
  const { speak } = useActionVoice(isVoiceEnabled);
  const [cierres, setCierres] = useState<CierreTurno[]>(() => obtenerCierresTurno());
  const [expandedTurnoIds, setExpandedTurnoIds] = useState<Set<string>>(new Set());
  const [selectedPedido, setSelectedPedido] = useState<HistorialPedidoDetalle | null>(null);

  const turnosHistorial = useMemo(() => getTurnosHistorial(cierres), [cierres]);

  const handleRefresh = () => {
    speak("Actualizando historial de pedidos cerrados.", {
      priority: "normal",
      dedupeKey: "cocina-historial-refresh",
      cooldownMs: 1200
    });
    setCierres(obtenerCierresTurno());
  };

  const handleToggleTurno = (turnoId: string) => {
    setExpandedTurnoIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(turnoId)) {
        nextIds.delete(turnoId);
        return nextIds;
      }

      nextIds.add(turnoId);
      return nextIds;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="w-full space-y-3 px-3 py-3 sm:px-4 lg:px-5 xl:px-6">
        <div className={`flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${isHighContrast ? "contrast-panel border-yellow-400" : "border border-slate-200 bg-white shadow-sm"}`}>
          <div>
            <p className="text-xs font-black uppercase text-slate-500">Historial de pedidos</p>
            <h1 className="mt-0.5 text-2xl font-black text-slate-950">Pedidos cerrados</h1>
            <p className="mt-1 text-sm font-bold text-slate-600">Pedidos guardados al cerrar turno, ordenados hacia abajo.</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isHighContrast ? "contrast-button-secondary" : "border-slate-950 bg-slate-950 text-white shadow-sm hover:bg-black"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            Actualizar
          </button>
        </div>

        {turnosHistorial.length === 0 ? (
          <div className={`rounded-xl p-6 text-center ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}>
            <Check className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-xl font-black text-slate-950">No hay pedidos cerrados todavía</p>
            <p className="mt-1 font-bold text-slate-600">Cuando cierres un turno desde Pedidos, todo ese turno aparecerá aquí.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {turnosHistorial.map((turno) => (
              <HistorialTurnoCard
                key={turno.id}
                isExpanded={expandedTurnoIds.has(turno.id)}
                isHighContrast={isHighContrast}
                onOpenModal={setSelectedPedido}
                onToggle={() => handleToggleTurno(turno.id)}
                turno={turno}
              />
            ))}
          </div>
        )}

        {selectedPedido && (
          <HistorialPedidoModal pedido={selectedPedido} onClose={() => setSelectedPedido(null)} />
        )}
      </section>
    </div>
  );
}

function CocinaBoard({ isAccessibleView }: { isAccessibleView: boolean }) {
  const { isHighContrast, isPanelOpen, isVoiceEnabled, openAccessibilityPanel } = useAccessibilityContext();
  const { speak } = useActionVoice(isVoiceEnabled);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const {
    activeModal,
    error,
    handleEstadoChange,
    isLoading,
    loadPedidos,
    pedidos,
    setActiveModal,
    updatingPedidoId
  } = usePedidosController({});

  const cocinaPedidos = useMemo(
    () => pedidos.filter((pedido) => pedido.estado === "pendiente" || pedido.estado === "en_preparacion" || pedido.estado === "listo"),
    [pedidos]
  );
  const counts = useMemo(() => getPedidoCounts(pedidos), [pedidos]);
  const urgentCount = useMemo(() => cocinaPedidos.filter(isPedidoDelayed).length, [cocinaPedidos]);

  useEffect(() => {
    if (!isAutoRefreshEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadPedidos();
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [isAutoRefreshEnabled, loadPedidos]);

  const handleRefresh = () => {
    speak("Actualizando comandas de cocina.", {
      priority: "normal",
      dedupeKey: "cocina-refresh",
      cooldownMs: 1200
    });
    loadPedidos();
  };

  const handleCocinaEstadoChange = async (pedido: PedidoResponse, estado: EstadoPedido) => {
    await handleEstadoChange(pedido, estado);
    speak(`Pedido ${pedido.id} actualizado a ${ESTADO_META[estado].label}.`, {
      priority: "high",
      dedupeKey: `cocina-estado:${pedido.id}:${estado}`,
      cooldownMs: 1600,
      interrupt: true
    });
  };

  const handleAdvancePedido = async (pedido: PedidoResponse) => {
    const nextEstado = getNextCocinaEstado(pedido.estado);

    if (!nextEstado) {
      return;
    }

    await handleCocinaEstadoChange(pedido, nextEstado);
  };

  const handleAdvanceVisible = async () => {
    const pedidosToUpdate = cocinaPedidos.filter((pedido) => getNextCocinaEstado(pedido.estado));

    for (const pedido of pedidosToUpdate) {
      await handleAdvancePedido(pedido);
    }
  };

  if (isAccessibleView) {
    return (
      <CocinaFacilView
        activeModal={activeModal}
        counts={counts}
        error={error}
        isAutoRefreshEnabled={isAutoRefreshEnabled}
        isHighContrast={isHighContrast}
        isLoading={isLoading}
        isPanelOpen={isPanelOpen}
        onAdvanceVisible={handleAdvanceVisible}
        onAutoRefreshToggle={() => setIsAutoRefreshEnabled((current) => !current)}
        onEstadoChange={handleCocinaEstadoChange}
        onOpenAccessibility={openAccessibilityPanel}
        onOpenModal={setActiveModal}
        onRefresh={handleRefresh}
        pedidos={cocinaPedidos}
        updatingPedidoId={updatingPedidoId}
        urgentCount={urgentCount}
      />
    );
  }

  return (
    <CocinaNormalView
      activeModal={activeModal}
      counts={counts}
      error={error}
      isAutoRefreshEnabled={isAutoRefreshEnabled}
      isHighContrast={isHighContrast}
      isLoading={isLoading}
      onAdvanceVisible={handleAdvanceVisible}
      onAutoRefreshToggle={() => setIsAutoRefreshEnabled((current) => !current)}
      onEstadoChange={handleCocinaEstadoChange}
      onOpenModal={setActiveModal}
      onRefresh={handleRefresh}
      pedidos={cocinaPedidos}
      updatingPedidoId={updatingPedidoId}
      urgentCount={urgentCount}
    />
  );
}

function CocinaNormalView({
  activeModal,
  counts,
  error,
  isAutoRefreshEnabled,
  isHighContrast,
  isLoading,
  onAdvanceVisible,
  onAutoRefreshToggle,
  onEstadoChange,
  onOpenModal,
  onRefresh,
  pedidos,
  updatingPedidoId,
  urgentCount
}: CocinaViewProps) {
  const panelClass = isHighContrast
    ? "contrast-panel border-yellow-400"
    : "border border-slate-200 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.08)]";

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <section className="mx-auto w-full max-w-[1640px] space-y-4 px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <KitchenTitlePill counts={counts} isHighContrast={isHighContrast} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onAdvanceVisible}
              disabled={pedidos.length === 0 || updatingPedidoId !== null}
              className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isHighContrast ? "contrast-button-primary" : "border border-amber-400 bg-[#FECE00] text-slate-950 shadow-md hover:bg-[#FFD633]"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <Check className="h-5 w-5" aria-hidden="true" />
              Marcar todas
            </button>
            <IconButton label="Actualizar" onClick={onRefresh} icon={RefreshCw} isHighContrast={isHighContrast} />
            <IconButton label="Cocinas" onClick={onRefresh} icon={Settings} isHighContrast={isHighContrast} text="Cocinas" />
          </div>
        </div>

        <div className={`flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${panelClass}`}>
          <button
            type="button"
            onClick={onAutoRefreshToggle}
            aria-pressed={isAutoRefreshEnabled}
            className={`inline-flex min-h-[48px] items-center justify-center rounded-lg px-5 text-sm font-black transition ${
              isAutoRefreshEnabled
                ? isHighContrast
                  ? "contrast-button-primary"
                  : "border border-amber-400 bg-[#FECE00] text-slate-950 hover:bg-[#FFD633]"
                : isHighContrast
                  ? "contrast-button-secondary"
                  : "border border-amber-300 bg-white text-slate-950 hover:bg-[#FFF8DC]"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isAutoRefreshEnabled ? "Actualización automática activa" : "Activar actualización automática"}
          </button>
          <p className={`flex items-center gap-2 text-sm font-semibold ${isHighContrast ? "contrast-secondary-text" : "text-slate-700"}`}>
            <RefreshCw className={`h-5 w-5 ${isAutoRefreshEnabled ? "animate-spin" : ""}`} aria-hidden="true" />
            {isAutoRefreshEnabled ? "Los tickets nuevos entran solos a cocina." : "Actualiza manualmente para ver nuevos tickets."}
          </p>
        </div>

        <CocinaSummary counts={counts} isHighContrast={isHighContrast} urgentCount={urgentCount} />

        {error && <CocinaError error={error} isHighContrast={isHighContrast} />}

        {isLoading ? (
          <LoadingPanel isHighContrast={isHighContrast} label="Cargando tickets de cocina..." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {pedidos.length === 0 ? (
              <EmptyKitchenSlots isHighContrast={isHighContrast} />
            ) : (
              pedidos.map((pedido) => (
                <KitchenTicket
                  key={pedido.id}
                  isHighContrast={isHighContrast}
                  isUpdating={updatingPedidoId === pedido.id}
                  onEstadoChange={onEstadoChange}
                  onOpenModal={onOpenModal}
                  pedido={pedido}
                />
              ))
            )}
          </div>
        )}

        {activeModal && (
          <PedidoModal
            activeModal={activeModal}
            isUpdating={updatingPedidoId === activeModal.pedido.id}
            onClose={() => onOpenModal(null)}
            onEstadoChange={onEstadoChange}
            onOpenModal={onOpenModal}
          />
        )}
      </section>
    </div>
  );
}

function CocinaFacilView({
  activeModal,
  counts,
  error,
  isAutoRefreshEnabled,
  isHighContrast,
  isLoading,
  isPanelOpen,
  onAdvanceVisible,
  onAutoRefreshToggle,
  onEstadoChange,
  onOpenAccessibility,
  onOpenModal,
  onRefresh,
  pedidos,
  updatingPedidoId,
  urgentCount
}: CocinaViewProps & {
  isPanelOpen: boolean;
  onOpenAccessibility: () => void;
}) {
  const headerBg = isHighContrast
    ? "bg-black text-white border-b-2 border-yellow-400"
    : "bg-slate-900 text-white border-b border-slate-700";
  const pageBg = isHighContrast ? "bg-black" : "bg-white";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className={headerBg}>
        <div className="mx-auto flex min-h-[84px] w-full max-w-[1520px] flex-wrap items-center justify-between gap-4 px-3 py-3 sm:px-4 lg:px-5 xl:px-6">
          <h1 className="text-3xl font-black leading-none tracking-tight contrast-important">Cocina</h1>
          <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
            <Link
              to="/cocina"
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-lg font-black no-underline transition ${
                isHighContrast ? "contrast-button-secondary" : "border-white bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <ChefHat className="h-6 w-6" aria-hidden="true" />
              Vista normal
            </Link>
            <button
              type="button"
              onClick={onOpenAccessibility}
              aria-haspopup="dialog"
              aria-expanded={isPanelOpen}
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-lg font-black transition ${
                isHighContrast ? "contrast-button-secondary" : "border-white bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <Accessibility className="h-6 w-6" aria-hidden="true" />
              Accesibilidad
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-lg font-black transition ${
                isHighContrast ? "contrast-button-secondary" : "border-slate-950 bg-slate-950 text-white hover:bg-black"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <RefreshCw className="h-6 w-6" aria-hidden="true" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <section className="mx-auto w-full max-w-[1520px] space-y-5 px-3 py-6 sm:px-4 lg:px-5 xl:px-6">
        <div className={`rounded-[26px] p-5 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}>
          <p className="text-3xl font-black text-slate-950">Pedidos para preparar</p>
          <p className="mt-3 text-xl font-bold text-slate-700">
            {isAutoRefreshEnabled ? "La cocina se actualiza sola cada pocos segundos." : "La cocina está en actualización manual."}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LargeMetric label="Pendientes" value={counts.pendientes} />
            <LargeMetric label="En preparación" value={counts.enPreparacion} />
            <LargeMetric label="Listos" value={counts.listos} />
            <LargeMetric label="Urgentes" value={urgentCount} />
          </div>
        </div>

        <div className={`grid gap-4 rounded-[26px] p-4 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"} md:grid-cols-[1fr_auto] md:items-center`}>
          <div className="inline-flex min-h-[70px] w-fit items-center gap-3 rounded-2xl border-2 border-slate-900 bg-slate-900 px-5 text-xl font-black text-white">
            <ChefHat className="h-7 w-7" aria-hidden="true" />
            Cocina principal
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onAutoRefreshToggle}
              className={`min-h-[70px] rounded-2xl border-2 px-5 text-xl font-black transition ${
                isAutoRefreshEnabled
                  ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              {isAutoRefreshEnabled ? "Auto activo" : "Activar auto"}
            </button>
            <button
              type="button"
              onClick={onAdvanceVisible}
              disabled={pedidos.length === 0 || updatingPedidoId !== null}
              className={`min-h-[70px] rounded-2xl border-2 border-emerald-700 bg-emerald-600 px-5 text-xl font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
            >
              Marcar todas
            </button>
          </div>
        </div>

        {error && <CocinaError error={error} isHighContrast={isHighContrast} />}

        {isLoading ? (
          <LoadingPanel isHighContrast={isHighContrast} label="Cargando tickets de cocina..." />
        ) : pedidos.length === 0 ? (
          <div className={`rounded-[26px] p-8 text-center ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}>
            <UtensilsCrossed className="mx-auto h-12 w-12 text-slate-400" aria-hidden="true" />
            <p className="mt-4 text-3xl font-black text-slate-950">No hay tickets en esta estación</p>
            <p className="mt-2 text-xl font-bold text-slate-600">Cuando entre un pedido aparecerá aquí automáticamente.</p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {pedidos.map((pedido) => (
              <AccessibleKitchenTicket
                key={pedido.id}
                isHighContrast={isHighContrast}
                isUpdating={updatingPedidoId === pedido.id}
                onEstadoChange={onEstadoChange}
                onOpenModal={onOpenModal}
                pedido={pedido}
              />
            ))}
          </div>
        )}

        {activeModal && (
          <PedidoModal
            activeModal={activeModal}
            isUpdating={updatingPedidoId === activeModal.pedido.id}
            onClose={() => onOpenModal(null)}
            onEstadoChange={onEstadoChange}
            onOpenModal={onOpenModal}
          />
        )}
      </section>
    </div>
  );
}

type CocinaViewProps = {
  activeModal: ActiveModal;
  counts: ReturnType<typeof getPedidoCounts>;
  error: string | null;
  isAutoRefreshEnabled: boolean;
  isHighContrast: boolean;
  isLoading: boolean;
  onAdvanceVisible: () => void;
  onAutoRefreshToggle: () => void;
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onOpenModal: (modal: ActiveModal) => void;
  onRefresh: () => void;
  pedidos: PedidoResponse[];
  updatingPedidoId: number | null;
  urgentCount: number;
};

function KitchenTitlePill({
  counts,
  isHighContrast
}: {
  counts: ReturnType<typeof getPedidoCounts>;
  isHighContrast: boolean;
}) {
  return (
    <div className={`inline-flex w-fit min-h-[56px] items-center gap-2 rounded-xl border px-5 text-sm font-black ${isHighContrast ? "contrast-panel border-yellow-400" : "border-amber-300 bg-[#FFF8DC] text-slate-950 shadow-sm"}`}>
      <ChefHat className="h-5 w-5" aria-hidden="true" />
      Cocina principal
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FECE00] px-1.5 text-xs text-slate-950">
        {counts.pendientes + counts.enPreparacion}
      </span>
    </div>
  );
}

function CocinaSummary({
  counts,
  isHighContrast,
  urgentCount
}: {
  counts: ReturnType<typeof getPedidoCounts>;
  isHighContrast: boolean;
  urgentCount: number;
}) {
  const summaryItems = [
    { label: "Pendientes", value: counts.pendientes },
    { label: "En preparación", value: counts.enPreparacion },
    { label: "Listos", value: counts.listos },
    { label: "Urgentes", value: urgentCount }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {summaryItems.map((item) => (
        <div key={item.label} className={`rounded-xl px-4 py-3 ${isHighContrast ? "contrast-panel border-yellow-400" : "border border-slate-200 bg-white"}`}>
          <p className="text-xs font-black uppercase text-slate-500">{item.label}</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function KitchenTicket({
  isHighContrast,
  isUpdating,
  onEstadoChange,
  onOpenModal,
  pedido
}: TicketProps) {
  const delayed = isPedidoDelayed(pedido);
  const isPending = pedido.estado === "pendiente";
  const isPreparing = pedido.estado === "en_preparacion";
  const isReady = pedido.estado === "listo";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpenModal({ action: "detail", pedido })}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenModal({ action: "detail", pedido });
        }
      }}
      aria-label={`Ver detalle del pedido ${pedido.id}`}
      className={`flex min-h-[246px] cursor-pointer flex-col justify-between rounded-xl border border-dashed p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${
        isHighContrast ? "contrast-panel border-yellow-400" : delayed ? "border-orange-300 bg-orange-50" : "border-slate-300 bg-white"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-black text-slate-950">Pedido #{pedido.id}</p>
            <p className={`mt-1 flex items-center gap-1.5 text-sm font-bold ${delayed ? "text-orange-700" : "text-slate-600"}`}>
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              {formatElapsedTime(pedido.createdAt)}
            </p>
          </div>
          <StatusBadge estado={pedido.estado} />
        </div>

        <p className="mt-4 text-base font-black leading-snug text-slate-950">{getPedidoSummary(pedido)}</p>
        <p className="mt-2 text-sm font-bold text-slate-500">{getProductCount(pedido)} productos · {formatTime(pedido.createdAt)}</p>
        {pedido.observacion && (
          <p className="mt-3 rounded-lg border border-yellow-200 bg-[#FFF8DC] px-3 py-2 text-sm font-bold text-slate-800">
            {pedido.observacion}
          </p>
        )}
        <p className="mt-3 text-xs font-black uppercase text-slate-400">Haz clic para ver todos los detalles</p>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="grid grid-cols-2 gap-2" aria-label="Flujo del pedido">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (isPending) {
                onEstadoChange(pedido, "en_preparacion");
              }
            }}
            disabled={!isPending || isUpdating}
            className={`min-h-[44px] rounded-lg border px-3 text-sm font-black transition disabled:cursor-not-allowed ${
              isPreparing
                ? "border-orange-300 bg-orange-100 text-orange-900"
                : isPending
                  ? "border-orange-600 bg-orange-500 text-white hover:bg-orange-600"
                  : "border-slate-200 bg-slate-100 text-slate-400"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isPreparing ? "En preparación" : isUpdating && isPending ? "Guardando..." : "En preparación"}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (isPreparing) {
                onEstadoChange(pedido, "listo");
              }
            }}
            disabled={!isPreparing || isUpdating}
            className={`min-h-[44px] rounded-lg border px-3 text-sm font-black transition disabled:cursor-not-allowed ${
              isPreparing
                ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                : "border-slate-200 bg-slate-100 text-slate-400"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isUpdating && isPreparing ? "Guardando..." : "Listo"}
          </button>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (isReady) {
              onEstadoChange(pedido, "entregado");
            }
          }}
          disabled={!isReady || isUpdating}
          className={`min-h-[44px] rounded-lg border px-3 text-sm font-black transition disabled:cursor-not-allowed ${
            isReady
              ? "border-slate-900 bg-slate-900 text-white hover:bg-black"
              : "border-slate-200 bg-slate-100 text-slate-400"
          } ${FOCUS_VISIBLE_CLASS}`}
        >
          {isUpdating && isReady ? "Guardando..." : "Entregar"}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenModal({ action: "detail", pedido });
          }}
          className={`min-h-[44px] rounded-lg border px-3 text-sm font-black transition ${isHighContrast ? "contrast-button-secondary" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"} ${FOCUS_VISIBLE_CLASS}`}
        >
          Ver detalle completo
        </button>
      </div>
    </article>
  );
}

function AccessibleKitchenTicket({
  isHighContrast,
  isUpdating,
  onEstadoChange,
  onOpenModal,
  pedido
}: TicketProps) {
  const delayed = isPedidoDelayed(pedido);
  const isPending = pedido.estado === "pendiente";
  const isPreparing = pedido.estado === "en_preparacion";
  const isReady = pedido.estado === "listo";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpenModal({ action: "detail", pedido })}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenModal({ action: "detail", pedido });
        }
      }}
      aria-label={`Ver detalle del pedido ${pedido.id}`}
      className={`cursor-pointer rounded-[26px] p-6 transition hover:-translate-y-0.5 hover:shadow-xl ${
        isHighContrast ? "contrast-panel border-2 border-yellow-400" : delayed ? "border-2 border-orange-500 bg-orange-50" : "border-2 border-slate-900 bg-white"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-3xl font-black text-slate-950">Pedido #{pedido.id}</p>
          <p className={`mt-3 flex items-center gap-2 text-xl font-bold ${delayed ? "text-orange-700" : "text-slate-700"}`}>
            <Clock3 className="h-6 w-6" aria-hidden="true" />
            {formatElapsedTime(pedido.createdAt)}
          </p>
        </div>
        <StatusBadge estado={pedido.estado} isLarge />
      </div>

      <div className={`mt-6 rounded-2xl p-5 ${isHighContrast ? "contrast-panel-soft border-2 border-yellow-400" : "border-2 border-slate-300 bg-slate-50"}`}>
        <p className="text-2xl font-black leading-snug text-slate-950">{getPedidoSummary(pedido)}</p>
        <p className="mt-4 text-xl font-bold text-slate-700">{getProductCount(pedido)} productos · Hora {formatTime(pedido.createdAt)}</p>
        <p className="mt-3 text-lg font-black text-slate-500">Toca la tarjeta para ver todos los productos.</p>
        {pedido.observacion && (
          <p className="mt-4 rounded-2xl border-2 border-yellow-300 bg-[#FFF8DC] p-4 text-xl font-black text-slate-950">
            {pedido.observacion}
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Flujo del pedido">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (isPending) {
                onEstadoChange(pedido, "en_preparacion");
              }
            }}
            disabled={!isPending || isUpdating}
            className={`min-h-[72px] rounded-2xl border-2 px-5 text-xl font-black transition disabled:cursor-not-allowed ${
              isPreparing
                ? "border-orange-400 bg-orange-100 text-orange-950"
                : isPending
                  ? "border-orange-700 bg-orange-600 text-white hover:bg-orange-700"
                  : "border-slate-300 bg-slate-100 text-slate-400"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isUpdating && isPending ? "Guardando..." : "En preparación"}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (isPreparing) {
                onEstadoChange(pedido, "listo");
              }
            }}
            disabled={!isPreparing || isUpdating}
            className={`min-h-[72px] rounded-2xl border-2 px-5 text-xl font-black transition disabled:cursor-not-allowed ${
              isPreparing
                ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                : "border-slate-300 bg-slate-100 text-slate-400"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isUpdating && isPreparing ? "Guardando..." : "Listo"}
          </button>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (isReady) {
              onEstadoChange(pedido, "entregado");
            }
          }}
          disabled={!isReady || isUpdating}
          className={`min-h-[72px] rounded-2xl border-2 px-5 text-xl font-black transition disabled:cursor-not-allowed ${
            isReady
              ? "border-slate-950 bg-slate-950 text-white hover:bg-black"
              : "border-slate-300 bg-slate-100 text-slate-400"
          } ${FOCUS_VISIBLE_CLASS}`}
        >
          {isUpdating && isReady ? "Guardando..." : "Entregar"}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenModal({ action: "detail", pedido });
          }}
          className={`min-h-[72px] rounded-2xl border-2 px-5 text-xl font-black transition ${isHighContrast ? "contrast-button-secondary" : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"} ${FOCUS_VISIBLE_CLASS}`}
        >
          Ver detalle completo
        </button>
      </div>
    </article>
  );
}

function HistorialTurnoCard({
  isExpanded,
  isHighContrast,
  onOpenModal,
  onToggle,
  turno
}: {
  isExpanded: boolean;
  isHighContrast: boolean;
  onOpenModal: (pedido: HistorialPedidoDetalle) => void;
  onToggle: () => void;
  turno: HistorialTurno;
}) {
  const totalProductos = turno.pedidos.reduce((total, pedido) => total + getHistorialProductCount(pedido), 0);

  return (
    <article className={`overflow-hidden rounded-2xl ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]"}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={`flex w-full flex-col gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${FOCUS_VISIBLE_CLASS}`}
      >
        <div>
          <p className="text-xs font-black uppercase text-slate-500">Turno cerrado</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{formatKitchenDateTime(turno.fechaCierre)}</h2>
          <p className="mt-2 flex flex-wrap gap-3 text-sm font-bold text-slate-600">
            <span>Inicio: {turno.fechaInicio ? formatKitchenDateTime(turno.fechaInicio) : "Sin datos"}</span>
            <span>Cierre: {formatKitchenDateTime(turno.fechaCierre)}</span>
            <span>{turno.pedidos.length} pedidos</span>
            <span>{totalProductos} productos</span>
            <span>Pendiente: {formatKitchenCurrency(String(turno.totalPendiente ?? 0))}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-left sm:text-right">
            <p className="text-xs font-black uppercase text-slate-500">Total vendido</p>
            <p className="text-2xl font-black text-slate-950">{formatKitchenCurrency(String(turno.totalVendido))}</p>
          </div>
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${isHighContrast ? "contrast-button-secondary" : "border-slate-200 bg-white text-slate-700"} ${isExpanded ? "rotate-180" : ""}`}>
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="grid gap-3 border-t border-slate-200 bg-slate-50 p-3">
          {turno.pedidos.map((pedido) => (
            <HistorialPedidoCard
              key={`${pedido.turnoId}-${pedido.id}`}
              isHighContrast={isHighContrast}
              onOpenModal={onOpenModal}
              pedido={pedido}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function HistorialPedidoCard({
  isHighContrast,
  onOpenModal,
  pedido
}: {
  isHighContrast: boolean;
  onOpenModal: (pedido: HistorialPedidoDetalle) => void;
  pedido: HistorialPedidoDetalle;
}) {
  return (
    <article className={`rounded-2xl p-5 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-2xl font-black text-slate-950">Pedido #{pedido.id}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm font-bold text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              {formatTime(pedido.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {pedido.createdAt ? formatKitchenDate(pedido.createdAt) : "Sin fecha"}
            </span>
          </div>
          <p className="mt-2 text-xs font-black uppercase text-slate-500">Turno cerrado: {formatKitchenDateTime(pedido.fechaCierre)}</p>
        </div>
        <StatusBadge estado={pedido.estado} />
      </div>

      <div className={`mt-4 rounded-xl p-4 ${isHighContrast ? "contrast-panel-soft border border-yellow-400" : "border border-slate-200 bg-slate-50"}`}>
        <p className="text-lg font-black text-slate-950">{getHistorialPedidoSummary(pedido)}</p>
        <p className="mt-2 text-sm font-bold text-slate-600">{getHistorialProductCount(pedido)} productos en el pedido</p>
        <div className="mt-3 rounded-xl border border-slate-200 bg-white">
          {pedido.detalles.map((detalle) => (
            <div key={`${pedido.turnoId}-${pedido.id}-${detalle.productoId}-${detalle.productoNombre}`} className="grid gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0 sm:grid-cols-[1fr_80px_110px] sm:items-center">
              <p className="font-bold text-slate-900">{detalle.productoNombre}</p>
              <p className="font-bold text-slate-600">{detalle.cantidad} un.</p>
              <p className="font-black text-slate-950 sm:text-right">{formatKitchenCurrency(String(detalle.subtotal))}</p>
            </div>
          ))}
        </div>
        {pedido.observacion && (
          <p className="mt-3 rounded-xl border border-yellow-200 bg-[#FFF8DC] px-3 py-2 text-sm font-bold text-slate-800">
            {pedido.observacion}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3">
        <button
          type="button"
          onClick={() => onOpenModal(pedido)}
          className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 font-black transition ${
            isHighContrast ? "contrast-button-secondary" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
          } ${FOCUS_VISIBLE_CLASS}`}
        >
          <Eye className="h-5 w-5" aria-hidden="true" />
          Ver detalle
        </button>
      </div>
    </article>
  );
}

function HistorialPedidoModal({ onClose, pedido }: { onClose: () => void; pedido: HistorialPedidoDetalle }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="historial-pedido-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[26px] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="historial-pedido-title" className="text-2xl font-black text-slate-950">Pedido #{pedido.id}</h2>
            <p className="mt-1 text-sm font-bold text-slate-600">Turno cerrado: {formatKitchenDateTime(pedido.fechaCierre)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
          >
            Volver
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge estado={pedido.estado} />
            <span className="font-bold text-slate-600">{pedido.createdAt ? formatKitchenDateTime(pedido.createdAt) : "Sin fecha"}</span>
            <span className="font-bold text-slate-600">{pedido.metodoPago}</span>
          </div>
          {pedido.clienteNombre && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Cliente</p>
              <p className="mt-1 text-lg font-black text-slate-950">{pedido.clienteNombre}</p>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200">
            {pedido.detalles.map((detalle) => (
              <div key={`${pedido.turnoId}-${pedido.id}-${detalle.productoId}-${detalle.productoNombre}`} className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0">
                <div>
                  <p className="font-black text-slate-950">{detalle.cantidad}x {detalle.productoNombre}</p>
                  <p className="text-sm font-bold text-slate-500">{formatKitchenCurrency(String(detalle.precioUnitario))} c/u</p>
                </div>
                <p className="font-black text-slate-950">{formatKitchenCurrency(String(detalle.subtotal))}</p>
              </div>
            ))}
          </div>
          {pedido.observacion && (
            <p className="rounded-2xl border border-yellow-100 bg-[#FFF8DC] p-4 font-bold text-slate-700">
              {pedido.observacion}
            </p>
          )}
          <p className="text-right text-2xl font-black text-slate-950">Total {formatKitchenCurrency(String(pedido.total))}</p>
        </div>
      </section>
    </div>
  );
}

type TicketProps = {
  isHighContrast: boolean;
  isUpdating: boolean;
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onOpenModal: (modal: ActiveModal) => void;
  pedido: PedidoResponse;
};

function EmptyKitchenSlots({ isHighContrast }: { isHighContrast: boolean }) {
  return (
    <>
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className={`flex min-h-[214px] items-center justify-center rounded-xl border border-dashed ${
            isHighContrast ? "contrast-panel border-yellow-400" : "border-slate-300 bg-white/50 text-slate-300"
          }`}
          aria-hidden="true"
        >
          <UtensilsCrossed className="h-9 w-9" />
        </div>
      ))}
      <p className="sr-only">No hay tickets de cocina en esta estación.</p>
    </>
  );
}

function IconButton({
  icon: Icon,
  isHighContrast,
  label,
  onClick,
  text
}: {
  icon: typeof RefreshCw;
  isHighContrast: boolean;
  label: string;
  onClick: () => void;
  text?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border px-4 font-black transition ${
        isHighContrast ? "contrast-button-secondary" : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {text && <span>{text}</span>}
    </button>
  );
}

function LargeMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
      <p className="text-lg font-black text-slate-600">{label}</p>
      <p className="mt-2 text-4xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function LoadingPanel({ isHighContrast, label }: { isHighContrast: boolean; label: string }) {
  return (
    <div className={`flex min-h-[260px] items-center justify-center rounded-[26px] ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}>
      <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
      <span className="ml-3 text-xl font-black">{label}</span>
    </div>
  );
}

function CocinaError({ error, isHighContrast }: { error: string; isHighContrast: boolean }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${isHighContrast ? "contrast-panel" : "border-red-200 bg-red-50 text-red-950"}`} role="alert">
      <AlertTriangle className="mt-1 h-5 w-5" aria-hidden="true" />
      <p className="font-bold">{error}</p>
    </div>
  );
}

function getNextCocinaEstado(estado: EstadoPedido) {
  if (estado === "pendiente") {
    return "en_preparacion";
  }

  if (estado === "en_preparacion") {
    return "listo";
  }

  if (estado === "listo") {
    return "entregado";
  }

  return null;
}

type HistorialPedidoDetalle = CierrePedidoResumen & {
  fechaCierre: string;
  turnoId: string;
};

type HistorialTurno = Omit<CierreTurno, "pedidos"> & {
  pedidos: HistorialPedidoDetalle[];
};

function getTurnosHistorial(cierres: CierreTurno[]): HistorialTurno[] {
  return cierres
    .map((cierre) => ({
      ...cierre,
      pedidos: (cierre.pedidos ?? [])
        .map((pedido) => ({
          ...pedido,
          fechaCierre: cierre.fechaCierre,
          turnoId: cierre.id
        }))
        .sort((left, right) => {
          const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
          const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
          return rightTime - leftTime;
        })
    }))
    .filter((cierre) => cierre.pedidos.length > 0)
    .sort((left, right) => {
      const leftTime = new Date(left.fechaCierre).getTime();
      const rightTime = new Date(right.fechaCierre).getTime();
      return rightTime - leftTime;
    });
}

function getHistorialProductCount(pedido: HistorialPedidoDetalle) {
  return pedido.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
}

function getHistorialPedidoSummary(pedido: HistorialPedidoDetalle) {
  if (pedido.detalles.length === 0) {
    return "Sin detalle de productos";
  }

  return pedido.detalles
    .slice(0, 2)
    .map((detalle) => `${detalle.cantidad}x ${detalle.productoNombre}`)
    .join(", ")
    .concat(pedido.detalles.length > 2 ? ` y ${pedido.detalles.length - 2} más` : "");
}

function formatKitchenDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  }).format(new Date(value));
}

function formatKitchenDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatKitchenCurrency(value: string) {
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

export default CocinaPage;
