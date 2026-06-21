import {
  AlertTriangle,
  Check,
  ChefHat,
  Clock3,
  Eye,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Printer,
  RefreshCw,
  Search,
  Settings,
  UtensilsCrossed,
  Volume2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import { Link } from "react-router-dom";
import EasyModeActions from "../../components/EasyModeActions";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { ESTADOS_PEDIDO_ACTIVOS } from "../../domain/pedidoRules";
import useActionVoice from "../../hooks/useActionVoice";
import { cargarCierresTurno, obtenerCierresTurno } from "../../services/cierresTurno";
import type { CierrePedidoResumen, CierreTurno, EstadoPedido, MetodoPago, PedidoResponse } from "../../types";
import {
  ESTADO_META,
  FOCUS_VISIBLE_CLASS,
  PedidoModal,
  StatusBadge,
  formatCurrency as formatKitchenCurrency,
  formatDateTime as formatKitchenDateTime,
  formatElapsedTime,
  formatMetodoPago as formatMetodoPagoLabel,
  formatTime,
  getPedidoCounts,
  getPedidoDisplayNumber,
  getPedidoSummary,
  getProductCount,
  isPedidoDelayed,
  usePedidosController,
  type ActiveModal
} from "../pedidos/PedidosShared";

const AUTO_REFRESH_MS = 12000;

function useFullscreenToggle(targetRef: RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === targetRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [targetRef]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await (targetRef.current ?? document.documentElement).requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  return { isFullscreen, toggleFullscreen };
}

function CocinaPage() {
  return <CocinaBoard isAccessibleView={false} />;
}

export function CocinaFacilPage() {
  return <CocinaBoard isAccessibleView />;
}

export function CocinaHistorialPage() {
  const { isAccessible, isHighContrast, isVoiceEnabled } = useAccessibilityContext();
  const { speak } = useActionVoice(isVoiceEnabled);
  const [cierres, setCierres] = useState<CierreTurno[]>(() => obtenerCierresTurno());
  const [expandedTurnoIds, setExpandedTurnoIds] = useState<Set<string>>(new Set());
  const [turnoViewById, setTurnoViewById] = useState<Record<string, "pedidos" | "resumen">>({});
  const [selectedPedido, setSelectedPedido] = useState<HistorialPedidoDetalle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<HistorialDateFilter>("all");
  const [estadoFilter, setEstadoFilter] = useState<HistorialEstadoFilter>("todos");
  const [metodoFilter, setMetodoFilter] = useState<HistorialMetodoFilter>("todos");
  const [liveMessage, setLiveMessage] = useState("Historial de turnos listo para consultar.");
  const [printTurnoId, setPrintTurnoId] = useState<string | null>(null);

  useEffect(() => {
    void cargarCierresTurno()
      .then(setCierres)
      .catch(() => undefined);
  }, []);

  const turnosHistorial = useMemo(() => getTurnosHistorial(cierres), [cierres]);
  const filteredTurnos = useMemo(
    () => filterTurnosHistorial(turnosHistorial, { dateFilter, estadoFilter, metodoFilter, searchTerm }),
    [dateFilter, estadoFilter, metodoFilter, searchTerm, turnosHistorial]
  );
  const easyPedidos = useMemo(() => getPedidosRecientes(filteredTurnos), [filteredTurnos]);

  const handleRefresh = () => {
    speak("Actualizando historial de pedidos cerrados.", {
      priority: "normal",
      dedupeKey: "cocina-historial-refresh",
      cooldownMs: 1200
    });
    void cargarCierresTurno()
      .then((nextCierres) => {
        setCierres(nextCierres);
        setLiveMessage("Historial actualizado.");
      })
      .catch((error) => setLiveMessage(error instanceof Error ? error.message : "No fue posible actualizar."));
  };

  const handleToggleTurno = (turnoId: string, view: "pedidos" | "resumen" = "resumen") => {
    setExpandedTurnoIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(turnoId) && turnoViewById[turnoId] === view) {
        nextIds.delete(turnoId);
        return nextIds;
      }

      nextIds.add(turnoId);
      return nextIds;
    });
    setTurnoViewById((currentViews) => ({ ...currentViews, [turnoId]: view }));
  };

  const handleReadEasyHistory = () => {
    const message =
      easyPedidos.length === 0
        ? "No hay pedidos recientes en el historial."
        : easyPedidos
            .slice(0, 6)
            .map(
              (pedido) =>
                `Pedido ${getPedidoDisplayNumber(pedido)}, ${ESTADO_META[pedido.estado].label}, total ${formatKitchenCurrency(String(pedido.total))}.`
            )
            .join(" ");

    setLiveMessage(message);
    speak(message, {
      priority: "high",
      dedupeKey: "historial-facil-leer",
      cooldownMs: 2500,
      interrupt: true
    });
  };

  useEffect(() => {
    const handleAfterPrint = () => setPrintTurnoId(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const handlePrintTurno = (turnoId: string) => {
    setPrintTurnoId(turnoId);
    window.requestAnimationFrame(() => window.print());
  };

  if (isAccessible) {
    return (
      <HistorialFacilView
        dateFilter={dateFilter}
        isHighContrast={isHighContrast}
        liveMessage={liveMessage}
        onDateFilterChange={setDateFilter}
        onOpenPedido={setSelectedPedido}
        onReadHistory={handleReadEasyHistory}
        onRefresh={handleRefresh}
        pedidos={easyPedidos}
        selectedPedido={selectedPedido}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="w-full space-y-3 px-3 py-3 sm:px-4 lg:px-5 xl:px-6">
        <p className="sr-only" aria-live="polite">
          {liveMessage}
        </p>
        <div
          className={`flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${isHighContrast ? "contrast-panel border-yellow-400" : "border border-slate-200 bg-white shadow-sm"}`}
        >
          <div>
            <p className="text-xs font-black uppercase text-slate-500">Historial de pedidos</p>
            <h1 className="mt-0.5 text-2xl font-black text-slate-950">Historial de turnos</h1>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Consulta turnos cerrados, ventas confirmadas y pedidos registrados.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isHighContrast
                ? "contrast-button-secondary"
                : "border-slate-950 bg-slate-950 text-white shadow-sm hover:bg-black"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            Actualizar
          </button>
        </div>

        <HistorialFilters
          dateFilter={dateFilter}
          estadoFilter={estadoFilter}
          isHighContrast={isHighContrast}
          metodoFilter={metodoFilter}
          onDateFilterChange={setDateFilter}
          onEstadoFilterChange={setEstadoFilter}
          onMetodoFilterChange={setMetodoFilter}
          onSearchTermChange={setSearchTerm}
          searchTerm={searchTerm}
        />

        <p className="rounded-xl border border-yellow-200 bg-[#FFF8DC] px-4 py-3 text-sm font-bold text-slate-700">
          Los filtros ajustan los pedidos visibles. Los totales de cada turno se mantienen como resumen histórico del
          cierre.
        </p>

        {filteredTurnos.length === 0 ? (
          <div
            className={`rounded-xl p-6 text-center ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
          >
            <Check className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-xl font-black text-slate-950">No hay turnos para mostrar</p>
            <p className="mt-1 font-bold text-slate-600">
              Cuando cierres un turno, aparecerá aquí con sus ventas confirmadas y pedidos registrados.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredTurnos.map((turno) => (
              <HistorialTurnoCard
                key={turno.id}
                isExpanded={expandedTurnoIds.has(turno.id)}
                isHighContrast={isHighContrast}
                isPrintTarget={printTurnoId === turno.id}
                onOpenModal={setSelectedPedido}
                onPrint={handlePrintTurno}
                onToggle={(view) => handleToggleTurno(turno.id, view)}
                selectedView={turnoViewById[turno.id] ?? "resumen"}
                turno={turno}
              />
            ))}
          </div>
        )}

        {selectedPedido && <HistorialPedidoModal pedido={selectedPedido} onClose={() => setSelectedPedido(null)} />}
      </section>
    </div>
  );
}

const HISTORIAL_DATE_FILTERS: Array<{ label: string; value: HistorialDateFilter }> = [
  { label: "Hoy", value: "today" },
  { label: "Esta semana", value: "week" },
  { label: "Este mes", value: "month" },
  { label: "Todos", value: "all" }
];

const HISTORIAL_ESTADO_FILTERS: Array<{ label: string; value: HistorialEstadoFilter }> = [
  { label: "Todos", value: "todos" },
  { label: "Entregado", value: "entregado" },
  { label: "Pendiente", value: "pendiente" },
  { label: "Cancelado", value: "cancelado" }
];

const HISTORIAL_METODO_FILTERS: Array<{ label: string; value: HistorialMetodoFilter }> = [
  { label: "Todos", value: "todos" },
  { label: "Efectivo", value: "efectivo" },
  { label: "Tarjeta", value: "tarjeta" },
  { label: "Transferencia", value: "transferencia" }
];

function HistorialFilters({
  dateFilter,
  estadoFilter,
  isHighContrast,
  metodoFilter,
  onDateFilterChange,
  onEstadoFilterChange,
  onMetodoFilterChange,
  onSearchTermChange,
  searchTerm
}: {
  dateFilter: HistorialDateFilter;
  estadoFilter: HistorialEstadoFilter;
  isHighContrast: boolean;
  metodoFilter: HistorialMetodoFilter;
  onDateFilterChange: (value: HistorialDateFilter) => void;
  onEstadoFilterChange: (value: HistorialEstadoFilter) => void;
  onMetodoFilterChange: (value: HistorialMetodoFilter) => void;
  onSearchTermChange: (value: string) => void;
  searchTerm: string;
}) {
  const panelClass = isHighContrast ? "contrast-panel border-yellow-400" : "border border-slate-200 bg-white shadow-sm";

  return (
    <section className={`grid gap-3 rounded-xl px-4 py-3 ${panelClass}`} aria-label="Filtros del historial de turnos">
      <label className="relative block">
        <span className="sr-only">Buscar en historial</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Buscar pedido, producto, cajero o método de pago"
          className={`min-h-[48px] w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 font-bold text-slate-950 outline-none placeholder:text-slate-500 ${FOCUS_VISIBLE_CLASS}`}
        />
      </label>

      <div className="grid gap-3 xl:grid-cols-3">
        <HistorialFilterGroup
          label="Fecha"
          options={HISTORIAL_DATE_FILTERS}
          value={dateFilter}
          onChange={onDateFilterChange}
          isHighContrast={isHighContrast}
        />
        <HistorialFilterGroup
          label="Estado"
          options={HISTORIAL_ESTADO_FILTERS}
          value={estadoFilter}
          onChange={onEstadoFilterChange}
          isHighContrast={isHighContrast}
        />
        <HistorialFilterGroup
          label="Método de pago"
          options={HISTORIAL_METODO_FILTERS}
          value={metodoFilter}
          onChange={onMetodoFilterChange}
          isHighContrast={isHighContrast}
        />
      </div>
    </section>
  );
}

function HistorialFilterGroup<TValue extends string>({
  isHighContrast,
  label,
  onChange,
  options,
  value
}: {
  isHighContrast: boolean;
  label: string;
  onChange: (value: TValue) => void;
  options: Array<{ label: string; value: TValue }>;
  value: TValue;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={`min-h-[42px] rounded-xl border px-3 text-sm font-black transition ${
                isHighContrast
                  ? isActive
                    ? "contrast-button-primary"
                    : "contrast-button-secondary"
                  : isActive
                    ? "border-[#FECE00] bg-[#FECE00] text-slate-950"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HistorialFacilView({
  dateFilter,
  isHighContrast,
  liveMessage,
  onDateFilterChange,
  onOpenPedido,
  onReadHistory,
  onRefresh,
  pedidos,
  selectedPedido
}: {
  dateFilter: HistorialDateFilter;
  isHighContrast: boolean;
  liveMessage: string;
  onDateFilterChange: (value: HistorialDateFilter) => void;
  onOpenPedido: (pedido: HistorialPedidoDetalle | null) => void;
  onReadHistory: () => void;
  onRefresh: () => void;
  pedidos: HistorialPedidoDetalle[];
  selectedPedido: HistorialPedidoDetalle | null;
}) {
  const easyFilters = HISTORIAL_DATE_FILTERS.filter((filter) => ["all", "today", "week"].includes(filter.value));

  return (
    <div className={`min-h-screen ${isHighContrast ? "bg-black text-white" : "bg-white text-slate-950"}`}>
      <main className="mx-auto w-full max-w-[1180px] space-y-5 px-3 py-5 sm:px-4 lg:px-5">
        <p className="sr-only" aria-live="polite">
          {liveMessage}
        </p>
        <section
          className={`rounded-[28px] p-5 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-slate-600">Modo fácil</p>
              <h1 className="mt-1 text-4xl font-black text-slate-950">Pedidos recientes</h1>
              <p className="mt-3 text-xl font-bold text-slate-700">Consulta los últimos pedidos registrados.</p>
            </div>
            <div className="grid gap-3 xl:min-w-[760px]">
              <EasyModeActions />
              <button
                type="button"
                onClick={onReadHistory}
                className={`inline-flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border-2 px-5 text-xl font-black transition ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
                } ${FOCUS_VISIBLE_CLASS}`}
              >
                <Volume2 className="h-6 w-6" aria-hidden="true" />
                Leer historial
              </button>
              <button
                type="button"
                onClick={onRefresh}
                className={`inline-flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border-2 px-5 text-xl font-black transition ${
                  isHighContrast ? "contrast-button-primary" : "border-slate-900 bg-slate-900 text-white hover:bg-black"
                } ${FOCUS_VISIBLE_CLASS}`}
              >
                <RefreshCw className="h-6 w-6" aria-hidden="true" />
                Actualizar
              </button>
            </div>
          </div>
        </section>

        <section
          className={`rounded-[28px] p-4 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
          aria-label="Filtros rápidos de historial"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {easyFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => onDateFilterChange(filter.value)}
                aria-pressed={dateFilter === filter.value}
                className={`min-h-[60px] rounded-2xl border-2 px-5 text-xl font-black transition ${
                  dateFilter === filter.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                } ${FOCUS_VISIBLE_CLASS}`}
              >
                {filter.value === "all" ? "Últimos pedidos" : filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4" aria-label="Lista simple de pedidos recientes">
          {pedidos.length === 0 ? (
            <div
              className={`rounded-[28px] p-8 text-center ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
            >
              <p className="text-3xl font-black text-slate-950">No hay pedidos recientes</p>
            </div>
          ) : (
            pedidos.map((pedido) => (
              <article
                key={`${pedido.turnoId}-${pedido.id}`}
                className={`rounded-[28px] p-5 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-3xl font-black text-slate-950">Pedido #{getPedidoDisplayNumber(pedido)}</p>
                    <p className="mt-3 text-sm font-black uppercase text-slate-600">Estado</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <StatusBadge estado={pedido.estado} isLarge />
                      <p className="text-xl font-black text-slate-700">
                        Total {formatKitchenCurrency(String(pedido.total))}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenPedido(pedido)}
                    className={`min-h-[64px] rounded-2xl border-2 px-5 text-xl font-black transition ${
                      isHighContrast
                        ? "contrast-button-secondary"
                        : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
                    } ${FOCUS_VISIBLE_CLASS}`}
                  >
                    Ver detalle
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        {selectedPedido && <HistorialPedidoModal pedido={selectedPedido} onClose={() => onOpenPedido(null)} />}
      </main>
    </div>
  );
}

function CocinaBoard({ isAccessibleView }: { isAccessibleView: boolean }) {
  const { isHighContrast, isVoiceEnabled } = useAccessibilityContext();
  const { speak } = useActionVoice(isVoiceEnabled);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const fullscreenTargetRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreenToggle(fullscreenTargetRef);
  const { activeModal, error, handleEstadoChange, isLoading, loadPedidos, pedidos, setActiveModal, updatingPedidoId } =
    usePedidosController({});

  const cocinaPedidos = useMemo(
    () =>
      pedidos.filter(
        (pedido) => pedido.estado === "pendiente" || pedido.estado === "en_preparacion" || pedido.estado === "listo"
      ),
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
    speak("Actualizando pedidos en preparación.", {
      priority: "normal",
      dedupeKey: "cocina-refresh",
      cooldownMs: 1200
    });
    loadPedidos();
  };

  const handleCocinaEstadoChange = async (pedido: PedidoResponse, estado: EstadoPedido) => {
    await handleEstadoChange(pedido, estado);
    speak(`Pedido ${getPedidoDisplayNumber(pedido)} actualizado a ${ESTADO_META[estado].label}.`, {
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

  const CocinaView = isAccessibleView ? CocinaFacilView : CocinaNormalView;
  const cocinaViewProps: CocinaViewProps = {
    activeModal,
    counts,
    error,
    isAutoRefreshEnabled,
    isFullscreen,
    isHighContrast,
    isLoading,
    onAdvanceVisible: handleAdvanceVisible,
    onAutoRefreshToggle: () => setIsAutoRefreshEnabled((current) => !current),
    onEstadoChange: handleCocinaEstadoChange,
    onFullscreenToggle: toggleFullscreen,
    onOpenModal: setActiveModal,
    onRefresh: handleRefresh,
    pedidos: cocinaPedidos,
    updatingPedidoId,
    urgentCount
  };

  return (
    <div
      ref={fullscreenTargetRef}
      className={`min-h-screen overflow-auto ${isHighContrast ? "bg-black" : isAccessibleView ? "bg-white" : "bg-[#F7F7F7]"}`}
    >
      <CocinaView {...cocinaViewProps} />
    </div>
  );
}

function CocinaNormalView({
  activeModal,
  counts,
  error,
  isAutoRefreshEnabled,
  isFullscreen,
  isHighContrast,
  isLoading,
  onAdvanceVisible,
  onAutoRefreshToggle,
  onEstadoChange,
  onFullscreenToggle,
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
                isHighContrast
                  ? "contrast-button-primary"
                  : "border border-yellow-400 bg-[#FECE00] text-slate-950 shadow-md hover:bg-[#FFD633]"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <Check className="h-5 w-5" aria-hidden="true" />
              Marcar todas
            </button>
            <IconButton
              label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              onClick={onFullscreenToggle}
              icon={isFullscreen ? Minimize2 : Maximize2}
              isHighContrast={isHighContrast}
            />
            <IconButton label="Actualizar" onClick={onRefresh} icon={RefreshCw} isHighContrast={isHighContrast} />
            <IconButton
              label="Cocinas"
              onClick={onRefresh}
              icon={Settings}
              isHighContrast={isHighContrast}
              text="Cocinas"
            />
          </div>
        </div>

        <div
          className={`flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${panelClass}`}
        >
          <button
            type="button"
            onClick={onAutoRefreshToggle}
            aria-pressed={isAutoRefreshEnabled}
            className={`inline-flex min-h-[48px] items-center justify-center rounded-lg px-5 text-sm font-black transition ${
              isAutoRefreshEnabled
                ? isHighContrast
                  ? "contrast-button-primary"
                  : "border border-yellow-400 bg-[#FECE00] text-slate-950 hover:bg-[#FFD633]"
                : isHighContrast
                  ? "contrast-button-secondary"
                  : "border border-yellow-300 bg-white text-slate-950 hover:bg-[#FFF8DC]"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isAutoRefreshEnabled ? "Actualización automática activa" : "Activar actualización automática"}
          </button>
          <p
            className={`flex items-center gap-2 text-sm font-semibold ${isHighContrast ? "contrast-secondary-text" : "text-slate-700"}`}
          >
            <RefreshCw className={`h-5 w-5 ${isAutoRefreshEnabled ? "animate-spin" : ""}`} aria-hidden="true" />
            {isAutoRefreshEnabled
              ? "Los tickets nuevos entran solos a cocina."
              : "Actualiza manualmente para ver nuevos tickets."}
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
  isFullscreen,
  isHighContrast,
  isLoading,
  onAdvanceVisible,
  onAutoRefreshToggle,
  onEstadoChange,
  onFullscreenToggle,
  onOpenModal,
  onRefresh,
  pedidos,
  updatingPedidoId,
  urgentCount
}: CocinaViewProps) {
  const pageBg = isHighContrast ? "bg-black" : "bg-white";
  const panelClass = isHighContrast
    ? "contrast-panel border-2 border-yellow-400"
    : "border-2 border-slate-900 bg-white";
  const secondaryButtonClass = isHighContrast
    ? "contrast-button-secondary"
    : "border-slate-300 bg-white text-slate-950 hover:border-slate-900 hover:bg-slate-50";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <section className="mx-auto w-full max-w-[1520px] space-y-5 px-3 py-6 sm:px-4 lg:px-5 xl:px-6">
        <header className={`rounded-[28px] p-5 sm:p-6 ${panelClass}`}>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(520px,760px)] xl:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Modo fácil</p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-slate-950">Preparación</h1>
              <p className="mt-3 text-xl font-bold text-slate-700">Aquí aparecen los pedidos que deben prepararse.</p>
            </div>
            <EasyModeActions />
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <p className="text-xl font-black text-slate-950">
              {isAutoRefreshEnabled
                ? "La preparación se actualiza sola cada pocos segundos."
                : "La preparación está en actualización manual."}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                to="/cocina"
                className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-black no-underline transition ${secondaryButtonClass} ${FOCUS_VISIBLE_CLASS}`}
              >
                <ChefHat className="h-6 w-6" aria-hidden="true" />
                Modo normal
              </Link>
              <button
                type="button"
                onClick={onFullscreenToggle}
                aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-black transition ${secondaryButtonClass} ${FOCUS_VISIBLE_CLASS}`}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Maximize2 className="h-6 w-6" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Pantalla</span>
              </button>
              <button
                type="button"
                onClick={onRefresh}
                className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-black transition ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : "border-slate-950 bg-slate-950 text-white hover:bg-black"
                } ${FOCUS_VISIBLE_CLASS}`}
              >
                <RefreshCw className="h-6 w-6" aria-hidden="true" />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        <div className={`rounded-[26px] p-5 ${panelClass}`}>
          <div className="flex min-h-[64px] w-fit items-center gap-3 rounded-2xl border-2 border-slate-900 bg-slate-900 px-5 text-xl font-black text-white">
            <ChefHat className="h-7 w-7" aria-hidden="true" />
            Pedidos para preparar
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LargeMetric label="Pendientes" value={counts.pendientes} />
            <LargeMetric label="En preparación" value={counts.enPreparacion} />
            <LargeMetric label="Listos" value={counts.listos} />
            <LargeMetric label="Urgentes (más de 20 min)" value={urgentCount} />
          </div>
        </div>

        <div className={`grid gap-4 rounded-[26px] p-4 ${panelClass} md:grid-cols-[1fr_auto] md:items-center`}>
          <p className="text-xl font-black text-slate-950">Controles de preparación</p>
          <div className="grid gap-3 sm:grid-cols-2 md:min-w-[460px]">
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
          <div
            className={`rounded-[26px] p-8 text-center ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
          >
            <UtensilsCrossed className="mx-auto h-12 w-12 text-slate-400" aria-hidden="true" />
            <p className="mt-4 text-3xl font-black text-slate-950">No hay tickets en esta estación</p>
            <p className="mt-2 text-xl font-bold text-slate-600">
              Cuando entre un pedido aparecerá aquí automáticamente.
            </p>
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
  isFullscreen: boolean;
  isHighContrast: boolean;
  isLoading: boolean;
  onAdvanceVisible: () => void;
  onAutoRefreshToggle: () => void;
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onFullscreenToggle: () => void;
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
    <div
      className={`inline-flex w-fit min-h-[56px] items-center gap-2 rounded-xl border px-5 text-sm font-black ${isHighContrast ? "contrast-panel border-yellow-400" : "border-yellow-300 bg-[#FFF8DC] text-slate-950 shadow-sm"}`}
    >
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
        <div
          key={item.label}
          className={`rounded-xl px-4 py-3 ${isHighContrast ? "contrast-panel border-yellow-400" : "border border-slate-200 bg-white"}`}
        >
          <p className="text-xs font-black uppercase text-slate-500">{item.label}</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function KitchenTicket({ isHighContrast, isUpdating, onEstadoChange, onOpenModal, pedido }: TicketProps) {
  const { delayed, isPending, isPreparing, isReady, numeroPedido } = getKitchenTicketState(pedido);
  const interactionProps = getKitchenTicketInteractionProps(pedido, onOpenModal);

  return (
    <article
      {...interactionProps}
      className={`flex min-h-[246px] cursor-pointer flex-col justify-between rounded-xl border border-dashed p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${
        isHighContrast
          ? "contrast-panel border-yellow-400"
          : delayed
            ? "border-yellow-300 bg-yellow-50"
            : "border-slate-300 bg-white"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-black text-slate-950">Pedido #{numeroPedido}</p>
            <p
              className={`mt-1 flex items-center gap-1.5 text-sm font-bold ${delayed ? "text-yellow-700" : "text-slate-600"}`}
            >
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              {formatElapsedTime(pedido.createdAt)}
            </p>
          </div>
          <StatusBadge estado={pedido.estado} />
        </div>

        <p className="mt-4 text-base font-black leading-snug text-slate-950">{getPedidoSummary(pedido)}</p>
        <p className="mt-2 text-sm font-bold text-slate-500">
          {getProductCount(pedido)} productos · {formatTime(pedido.createdAt)}
        </p>
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
                ? "border-yellow-300 bg-yellow-100 text-yellow-900"
                : isPending
                  ? "border-yellow-600 bg-yellow-500 text-white hover:bg-yellow-600"
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

function AccessibleKitchenTicket({ isHighContrast, isUpdating, onEstadoChange, onOpenModal, pedido }: TicketProps) {
  const { delayed, isPending, isPreparing, isReady, numeroPedido } = getKitchenTicketState(pedido);
  const interactionProps = getKitchenTicketInteractionProps(pedido, onOpenModal);

  return (
    <article
      {...interactionProps}
      className={`cursor-pointer rounded-[26px] p-6 transition hover:-translate-y-0.5 hover:shadow-xl ${
        isHighContrast
          ? "contrast-panel border-2 border-yellow-400"
          : delayed
            ? "border-2 border-yellow-500 bg-yellow-50"
            : "border-2 border-slate-900 bg-white"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-3xl font-black text-slate-950">Pedido #{numeroPedido}</p>
          <p
            className={`mt-3 flex items-center gap-2 text-xl font-bold ${delayed ? "text-yellow-700" : "text-slate-700"}`}
          >
            <Clock3 className="h-6 w-6" aria-hidden="true" />
            {formatElapsedTime(pedido.createdAt)}
          </p>
        </div>
        <StatusBadge estado={pedido.estado} isLarge />
      </div>

      <div
        className={`mt-6 rounded-2xl p-5 ${isHighContrast ? "contrast-panel-soft border-2 border-yellow-400" : "border-2 border-slate-300 bg-slate-50"}`}
      >
        <p className="text-2xl font-black leading-snug text-slate-950">{getPedidoSummary(pedido)}</p>
        <p className="mt-4 text-xl font-bold text-slate-700">
          {getProductCount(pedido)} productos · Hora {formatTime(pedido.createdAt)}
        </p>
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
                ? "border-yellow-400 bg-yellow-100 text-yellow-950"
                : isPending
                  ? "border-yellow-700 bg-yellow-600 text-white hover:bg-yellow-700"
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
            if (isReady && window.confirm("¿Deseas marcar este pedido como entregado?")) {
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

function getKitchenTicketState(pedido: PedidoResponse) {
  return {
    delayed: isPedidoDelayed(pedido),
    isPending: pedido.estado === "pendiente",
    isPreparing: pedido.estado === "en_preparacion",
    isReady: pedido.estado === "listo",
    numeroPedido: getPedidoDisplayNumber(pedido)
  };
}

function getKitchenTicketInteractionProps(pedido: PedidoResponse, onOpenModal: (modal: ActiveModal) => void) {
  const openDetail = () => onOpenModal({ action: "detail", pedido });

  return {
    "aria-label": `Ver detalle del pedido ${getPedidoDisplayNumber(pedido)}`,
    onClick: openDetail,
    onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDetail();
      }
    },
    role: "button" as const,
    tabIndex: 0
  };
}

function HistorialTurnoCard({
  isExpanded,
  isHighContrast,
  isPrintTarget,
  onOpenModal,
  onPrint,
  onToggle,
  selectedView,
  turno
}: {
  isExpanded: boolean;
  isHighContrast: boolean;
  isPrintTarget: boolean;
  onOpenModal: (pedido: HistorialPedidoDetalle) => void;
  onPrint: (turnoId: string) => void;
  onToggle: (view: "pedidos" | "resumen") => void;
  selectedView: "pedidos" | "resumen";
  turno: HistorialTurno;
}) {
  const productosVendidos = getTurnoProductosVendidos(turno);
  const totalProductosVendidos = productosVendidos.reduce((total, producto) => total + producto.cantidad, 0);
  const pedidosEntregados = turno.pedidosEntregados ?? countTurnoPedidosByEstado(turno, "entregado");
  const pedidosPendientes = turno.pedidosPendientes ?? countTurnoPedidosPendientes(turno);
  const pedidosCancelados = turno.pedidosCancelados ?? countTurnoPedidosByEstado(turno, "cancelado");

  return (
    <article
      className={`historial-print-turno overflow-hidden rounded-2xl ${isPrintTarget ? "historial-print-target" : ""} ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]"}`}
    >
      <div className="flex w-full flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-slate-500">Turno cerrado</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{formatKitchenDateTime(turno.fechaCierre)}</h2>
          <p className="mt-2 flex flex-wrap gap-3 text-sm font-bold text-slate-600">
            <span>Cajero: {turno.usuarioId ?? "No identificado"}</span>
            <span>Inicio: {turno.fechaInicio ? formatKitchenDateTime(turno.fechaInicio) : "Sin datos"}</span>
            <span>Cierre: {formatKitchenDateTime(turno.fechaCierre)}</span>
          </p>
          <p className="mt-2 flex flex-wrap gap-2 text-sm font-black text-slate-700">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {turno.pedidos.length} pedidos registrados
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
              {pedidosEntregados} entregados
            </span>
            <span className="rounded-full border border-yellow-200 bg-[#FFF8DC] px-3 py-1">
              {pedidosPendientes} pendientes
            </span>
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1">
              {pedidosCancelados} cancelados
            </span>
            <span>{totalProductosVendidos} productos vendidos</span>
          </p>
        </div>
        <div className="grid gap-3 sm:min-w-[320px]">
          <div className="text-left sm:text-right">
            <p className="text-xs font-black uppercase text-slate-500">Total vendido confirmado</p>
            <p className="text-2xl font-black text-slate-950">{formatKitchenCurrency(String(turno.totalVendido))}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              El total vendido confirmado considera solo pedidos entregados.
            </p>
          </div>
          <div className="no-print grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => onToggle("resumen")}
              aria-expanded={isExpanded && selectedView === "resumen"}
              className={`min-h-[48px] rounded-xl border px-3 text-sm font-black transition ${isHighContrast ? "contrast-button-secondary" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"} ${FOCUS_VISIBLE_CLASS}`}
            >
              Ver resumen
            </button>
            <button
              type="button"
              onClick={() => onToggle("pedidos")}
              aria-expanded={isExpanded && selectedView === "pedidos"}
              className={`min-h-[48px] rounded-xl border px-3 text-sm font-black transition ${isHighContrast ? "contrast-button-secondary" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"} ${FOCUS_VISIBLE_CLASS}`}
            >
              Ver pedidos
            </button>
            <button
              type="button"
              onClick={() => onPrint(turno.id)}
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition ${isHighContrast ? "contrast-button-secondary" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"} ${FOCUS_VISIBLE_CLASS}`}
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-100 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <HistorialMetric
          label="Pendiente no vendido"
          value={formatKitchenCurrency(String(turno.totalPendiente ?? 0))}
        />
        <HistorialMetric label="Pedidos entregados" value={String(pedidosEntregados)} />
        <HistorialMetric label="Pedidos pendientes" value={String(pedidosPendientes)} />
        <HistorialMetric label="Pedidos cancelados" value={String(pedidosCancelados)} />
      </div>
      <p className="border-t border-slate-100 px-5 py-3 text-sm font-bold text-slate-600">
        El pendiente no vendido no se suma al total vendido.
      </p>

      <HistorialTurnoPrintable productosVendidos={productosVendidos} turno={turno} />

      {isExpanded && (
        <div className="grid gap-3 border-t border-slate-200 bg-slate-50 p-3">
          {selectedView === "resumen" ? (
            <HistorialTurnoResumen
              isHighContrast={isHighContrast}
              productosVendidos={productosVendidos}
              turno={turno}
            />
          ) : (
            <HistorialPedidosCompactos
              isHighContrast={isHighContrast}
              onOpenModal={onOpenModal}
              pedidos={turno.pedidos}
            />
          )}
        </div>
      )}
    </article>
  );
}

function HistorialMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function HistorialTurnoPrintable({
  productosVendidos,
  turno
}: {
  productosVendidos: NonNullable<CierreTurno["productosVendidos"]>;
  turno: HistorialTurno;
}) {
  const paymentRows = [
    { label: "Efectivo", value: turno.totalEfectivo ?? 0 },
    { label: "Tarjeta", value: turno.totalTarjeta ?? 0 },
    { label: "Transferencia", value: turno.totalTransferencia ?? 0 }
  ];

  return (
    <section className="historial-print-only">
      <h1>Riquísimo</h1>
      <p>Sistema de Pedidos - Resumen de turno cerrado</p>

      <div className="historial-print-grid">
        <p>
          <strong>Fecha del turno:</strong> {formatKitchenDateTime(turno.fechaCierre)}
        </p>
        <p>
          <strong>Cajero:</strong> {turno.usuarioId ?? "No identificado"}
        </p>
        <p>
          <strong>Inicio:</strong> {turno.fechaInicio ? formatKitchenDateTime(turno.fechaInicio) : "Sin datos"}
        </p>
        <p>
          <strong>Cierre:</strong> {formatKitchenDateTime(turno.fechaCierre)}
        </p>
        <p>
          <strong>Total vendido confirmado:</strong> {formatKitchenCurrency(String(turno.totalVendido ?? 0))}
        </p>
        <p>
          <strong>Pendiente no vendido:</strong> {formatKitchenCurrency(String(turno.totalPendiente ?? 0))}
        </p>
        <p>
          <strong>Pedidos entregados:</strong>{" "}
          {turno.pedidosEntregados ?? countTurnoPedidosByEstado(turno, "entregado")}
        </p>
        <p>
          <strong>Pedidos pendientes:</strong> {turno.pedidosPendientes ?? countTurnoPedidosPendientes(turno)}
        </p>
        <p>
          <strong>Pedidos cancelados:</strong>{" "}
          {turno.pedidosCancelados ?? countTurnoPedidosByEstado(turno, "cancelado")}
        </p>
      </div>

      <h2>Métodos de pago</h2>
      {paymentRows.map((row) => (
        <p key={row.label}>
          <strong>{row.label}:</strong> {formatKitchenCurrency(String(row.value))}
        </p>
      ))}

      <h2>Productos vendidos</h2>
      {productosVendidos.length === 0 ? (
        <p>No hay productos vendidos confirmados.</p>
      ) : (
        productosVendidos.map((producto) => (
          <p key={producto.productoId}>
            {producto.cantidad}x {producto.productoNombre} - {formatKitchenCurrency(String(producto.total))}
          </p>
        ))
      )}

      <h2>Pedidos del turno</h2>
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Estado</th>
            <th>Hora</th>
            <th>Método</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {turno.pedidos.map((pedido) => (
            <tr key={`${turno.id}-${pedido.id}`}>
              <td>#{getPedidoDisplayNumber(pedido)}</td>
              <td>{ESTADO_META[pedido.estado].label}</td>
              <td>{formatTime(pedido.createdAt)}</td>
              <td>{formatMetodoPagoLabel(pedido.metodoPago)}</td>
              <td>{formatKitchenCurrency(String(pedido.total))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function HistorialTurnoResumen({
  isHighContrast,
  productosVendidos,
  turno
}: {
  isHighContrast: boolean;
  productosVendidos: NonNullable<CierreTurno["productosVendidos"]>;
  turno: HistorialTurno;
}) {
  const paymentRows = [
    { label: "Efectivo", value: turno.totalEfectivo ?? 0 },
    { label: "Tarjeta", value: turno.totalTarjeta ?? 0 },
    { label: "Transferencia", value: turno.totalTransferencia ?? 0 }
  ];
  const totalProductosVendidos = productosVendidos.reduce((total, producto) => total + producto.cantidad, 0);

  return (
    <div className="grid gap-3 xl:grid-cols-3">
      <section
        className={`rounded-2xl p-4 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
        aria-labelledby={`general-${turno.id}`}
      >
        <h3 id={`general-${turno.id}`} className="text-lg font-black text-slate-950">
          Resumen general
        </h3>
        <div className="mt-3 grid gap-2">
          <HistorialResumenRow
            label="Total vendido confirmado"
            value={formatKitchenCurrency(String(turno.totalVendido ?? 0))}
          />
          <HistorialResumenRow
            label="Pendiente no vendido"
            value={formatKitchenCurrency(String(turno.totalPendiente ?? 0))}
          />
          <HistorialResumenRow label="Pedidos registrados" value={String(turno.pedidos.length)} />
          <HistorialResumenRow label="Productos vendidos" value={String(totalProductosVendidos)} />
        </div>
      </section>

      <section
        className={`rounded-2xl p-4 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
        aria-labelledby={`metodos-${turno.id}`}
      >
        <h3 id={`metodos-${turno.id}`} className="text-lg font-black text-slate-950">
          Métodos de pago
        </h3>
        <p className="mt-1 text-sm font-bold text-slate-600">Solo pedidos entregados.</p>
        <div className="mt-3 grid gap-2">
          {paymentRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <span className="font-bold text-slate-700">{row.label}</span>
              <span className="font-black text-slate-950">{formatKitchenCurrency(String(row.value))}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        className={`rounded-2xl p-4 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
        aria-labelledby={`productos-${turno.id}`}
      >
        <h3 id={`productos-${turno.id}`} className="text-lg font-black text-slate-950">
          Productos vendidos
        </h3>
        <p className="mt-1 text-sm font-bold text-slate-600">Solo productos de pedidos entregados.</p>
        {productosVendidos.length === 0 ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-600">
            No hay productos vendidos confirmados.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
            {productosVendidos.map((producto) => (
              <div
                key={producto.productoId}
                className="grid gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0 sm:grid-cols-[1fr_90px_120px] sm:items-center"
              >
                <p className="font-black text-slate-950">{producto.productoNombre}</p>
                <p className="font-bold text-slate-700">{producto.cantidad}x</p>
                <p className="font-black text-slate-950 sm:text-right">
                  {formatKitchenCurrency(String(producto.total))}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HistorialResumenRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="font-bold text-slate-700">{label}</span>
      <span className="font-black text-slate-950">{value}</span>
    </div>
  );
}

function HistorialPedidosCompactos({
  isHighContrast,
  onOpenModal,
  pedidos
}: {
  isHighContrast: boolean;
  onOpenModal: (pedido: HistorialPedidoDetalle) => void;
  pedidos: HistorialPedidoDetalle[];
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
      aria-label="Pedidos del turno"
    >
      <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase text-slate-500 md:grid md:grid-cols-[120px_150px_100px_1fr_150px_120px] md:items-center">
        <span>Pedido</span>
        <span>Estado</span>
        <span>Hora</span>
        <span>Cliente</span>
        <span>Pago</span>
        <span className="text-right">Detalle</span>
      </div>
      <div className="divide-y divide-slate-100">
        {pedidos.map((pedido) => (
          <article
            key={`${pedido.turnoId}-${pedido.id}`}
            className="grid gap-3 px-4 py-3 md:grid-cols-[120px_150px_100px_1fr_150px_120px] md:items-center"
          >
            <p className="font-black text-slate-950">#{getPedidoDisplayNumber(pedido)}</p>
            <StatusBadge estado={pedido.estado} />
            <p className="font-bold text-slate-600">{formatTime(pedido.createdAt)}</p>
            <p className="font-bold text-slate-700">{pedido.clienteNombre || pedido.observacion || "Sin referencia"}</p>
            <p className="font-bold text-slate-700">
              {formatMetodoPagoLabel(pedido.metodoPago)} · {formatKitchenCurrency(String(pedido.total))}
            </p>
            <button
              type="button"
              onClick={() => onOpenModal(pedido)}
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 font-black transition ${
                isHighContrast
                  ? "contrast-button-secondary"
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <Eye className="h-5 w-5" aria-hidden="true" />
              Ver detalle
            </button>
          </article>
        ))}
      </div>
    </section>
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
            <h2 id="historial-pedido-title" className="text-2xl font-black text-slate-950">
              Pedido #{getPedidoDisplayNumber(pedido)}
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Turno cerrado: {formatKitchenDateTime(pedido.fechaCierre)}
            </p>
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
            <span className="font-bold text-slate-600">
              {pedido.createdAt ? formatKitchenDateTime(pedido.createdAt) : "Sin fecha"}
            </span>
            <span className="font-bold text-slate-600">{formatMetodoPagoLabel(pedido.metodoPago)}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Cajero</p>
              <p className="mt-1 text-lg font-black text-slate-950">{pedido.cajero ?? "No identificado"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Método de pago</p>
              <p className="mt-1 text-lg font-black text-slate-950">{formatMetodoPagoLabel(pedido.metodoPago)}</p>
            </div>
          </div>
          {pedido.clienteNombre && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Cliente</p>
              <p className="mt-1 text-lg font-black text-slate-950">{pedido.clienteNombre}</p>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200">
            {pedido.detalles.map((detalle) => (
              <div
                key={`${pedido.turnoId}-${pedido.id}-${detalle.productoId}-${detalle.productoNombre}`}
                className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0"
              >
                <div>
                  <p className="font-black text-slate-950">
                    {detalle.cantidad}x {detalle.productoNombre}
                  </p>
                  <p className="text-sm font-bold text-slate-500">
                    {formatKitchenCurrency(String(detalle.precioUnitario))} c/u
                  </p>
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase text-slate-500">Historial de estado</p>
            <p className="mt-1 font-bold text-slate-600">No hay historial de cambios disponible para este pedido.</p>
          </div>
          <p className="text-right text-2xl font-black text-slate-950">
            Total {formatKitchenCurrency(String(pedido.total))}
          </p>
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
  icon: LucideIcon;
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
        isHighContrast
          ? "contrast-button-secondary"
          : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
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
    <div
      className={`flex min-h-[260px] items-center justify-center rounded-[26px] ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
    >
      <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
      <span className="ml-3 text-xl font-black">{label}</span>
    </div>
  );
}

function CocinaError({ error, isHighContrast }: { error: string; isHighContrast: boolean }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${isHighContrast ? "contrast-panel" : "border-red-200 bg-red-50 text-red-950"}`}
      role="alert"
    >
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
  cajero?: string;
  fechaCierre: string;
  turnoId: string;
};

type HistorialTurno = Omit<CierreTurno, "pedidos"> & {
  pedidos: HistorialPedidoDetalle[];
};

type HistorialDateFilter = "all" | "month" | "today" | "week";
type HistorialEstadoFilter = EstadoPedido | "todos";
type HistorialMetodoFilter = MetodoPago | "todos";

function getTurnosHistorial(cierres: CierreTurno[]): HistorialTurno[] {
  return cierres
    .map((cierre) => ({
      ...cierre,
      pedidos: (cierre.pedidos ?? [])
        .map((pedido) => ({
          ...pedido,
          cajero: cierre.usuarioId,
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

function filterTurnosHistorial(
  turnos: HistorialTurno[],
  filters: {
    dateFilter: HistorialDateFilter;
    estadoFilter: HistorialEstadoFilter;
    metodoFilter: HistorialMetodoFilter;
    searchTerm: string;
  }
) {
  const hasActivePedidoFilter =
    filters.searchTerm.trim() || filters.estadoFilter !== "todos" || filters.metodoFilter !== "todos";

  return turnos
    .filter((turno) => matchesDateFilter(turno.fechaCierre, filters.dateFilter))
    .map((turno) => {
      const pedidos = turno.pedidos.filter((pedido) => {
        const matchesEstado = filters.estadoFilter === "todos" || pedido.estado === filters.estadoFilter;
        const matchesMetodo = filters.metodoFilter === "todos" || pedido.metodoPago === filters.metodoFilter;
        const matchesSearch = historialPedidoMatchesSearch(pedido, turno, filters.searchTerm);
        return matchesEstado && matchesMetodo && matchesSearch;
      });

      return { ...turno, pedidos };
    })
    .filter((turno) => turno.pedidos.length > 0 || !hasActivePedidoFilter);
}

function matchesDateFilter(value: string, filter: HistorialDateFilter) {
  if (filter === "all") {
    return true;
  }

  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (filter === "today") {
    return (
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
    );
  }

  if (filter === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - dayOfWeek);

  return date.getTime() >= startOfWeek.getTime();
}

function historialPedidoMatchesSearch(pedido: HistorialPedidoDetalle, turno: HistorialTurno, searchTerm: string) {
  const normalizedSearch = normalizeKitchenSearch(searchTerm.trim());

  if (!normalizedSearch) {
    return true;
  }

  const displayNumber = getPedidoDisplayNumber(pedido);
  const searchableText = [
    `pedido ${displayNumber}`,
    String(displayNumber),
    pedido.clienteNombre ?? "",
    pedido.observacion ?? "",
    pedido.cajero ?? "",
    turno.usuarioId ?? "",
    formatMetodoPagoLabel(pedido.metodoPago),
    ESTADO_META[pedido.estado].label,
    ...pedido.detalles.map((detalle) => detalle.productoNombre)
  ].join(" ");

  return normalizeKitchenSearch(searchableText).includes(normalizedSearch);
}

function normalizeKitchenSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getPedidosRecientes(turnos: HistorialTurno[]) {
  return turnos
    .flatMap((turno) => turno.pedidos)
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 12);
}

function getTurnoProductosVendidos(turno: HistorialTurno) {
  if (turno.productosVendidos?.length) {
    return turno.productosVendidos;
  }

  const productos = new Map<number, NonNullable<CierreTurno["productosVendidos"]>[number]>();

  turno.pedidos
    .filter((pedido) => pedido.estado === "entregado")
    .forEach((pedido) => {
      pedido.detalles.forEach((detalle) => {
        const currentProducto = productos.get(detalle.productoId);

        if (!currentProducto) {
          productos.set(detalle.productoId, {
            cantidad: detalle.cantidad,
            productoId: detalle.productoId,
            productoNombre: detalle.productoNombre,
            total: detalle.subtotal
          });
          return;
        }

        currentProducto.cantidad += detalle.cantidad;
        currentProducto.total += detalle.subtotal;
      });
    });

  return [...productos.values()].sort((left, right) => right.cantidad - left.cantidad);
}

function countTurnoPedidosByEstado(turno: HistorialTurno, estado: EstadoPedido) {
  return turno.pedidos.filter((pedido) => pedido.estado === estado).length;
}

function countTurnoPedidosPendientes(turno: HistorialTurno) {
  return turno.pedidos.filter((pedido) => ESTADOS_PEDIDO_ACTIVOS.includes(pedido.estado)).length;
}

export default CocinaPage;
