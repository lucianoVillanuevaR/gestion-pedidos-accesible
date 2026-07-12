import { Check, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
import useVoice from "../../hooks/useVoice";
import { cargarCierresTurno, obtenerCierresTurno } from "../../services/cierresTurno";
import type { CierreTurno } from "../../types";
import { formatCurrency as formatKitchenCurrency } from "../pedidos/PedidosShared";
import { HistorialFacilView } from "./components/CocinaHistorialFacilView";
import {
  HISTORIAL_DATE_FILTERS,
  HISTORIAL_ESTADO_FILTERS,
  HISTORIAL_METODO_FILTERS,
  HistorialFilters
} from "./components/CocinaHistorialFilters";
import { HistorialPedidoModal } from "./components/CocinaHistorialPedidoModal";
import { HistorialTurnoCard } from "./components/CocinaHistorialTurnoCard";
import {
  filterTurnosHistorial,
  getPedidosRecientes,
  getTurnosHistorial,
  type HistorialDateFilter,
  type HistorialEstadoFilter,
  type HistorialMetodoFilter,
  type HistorialPedidoDetalle
} from "./cocinaHistoryUtils";

export default function CocinaHistorialPage() {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin/");
  const { isAccessible, isHighContrast, isVoiceEnabled } = useAccessibilityContext();
  const { speak } = useActionVoice(isVoiceEnabled);
  const { speak: speakForced } = useVoice({ enabled: isVoiceEnabled });
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
  const totalVendido = filteredTurnos.reduce((total, turno) => total + turno.totalVendido, 0);
  const pedidosEntregados = filteredTurnos.reduce((total, turno) => total + turno.pedidosEntregados, 0);
  const pedidosCancelados = filteredTurnos.reduce((total, turno) => total + turno.pedidosCancelados, 0);

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

  const announceHistorialControl = (message: string, dedupeKey: string) => {
    speakForced(message, {
      priority: "high",
      dedupeKey,
      cooldownMs: 700,
      interrupt: true,
      force: true
    });
  };

  const handleDateFilterChange = (value: HistorialDateFilter) => {
    const label = HISTORIAL_DATE_FILTERS.find((filter) => filter.value === value)?.label ?? value;
    setDateFilter(value);
    announceHistorialControl(`Filtro de fecha ${label}.`, `historial-fecha:${value}`);
  };

  const handleEstadoFilterChange = (value: HistorialEstadoFilter) => {
    const label = HISTORIAL_ESTADO_FILTERS.find((filter) => filter.value === value)?.label ?? value;
    setEstadoFilter(value);
    announceHistorialControl(`Filtro de estado ${label}.`, `historial-estado:${value}`);
  };

  const handleMetodoFilterChange = (value: HistorialMetodoFilter) => {
    const label = HISTORIAL_METODO_FILTERS.find((filter) => filter.value === value)?.label ?? value;
    setMetodoFilter(value);
    announceHistorialControl(`Filtro de método de pago ${label}.`, `historial-metodo:${value}`);
  };

  const handleSearchFocus = () => {
    announceHistorialControl("Barra de búsqueda.", "historial-barra-busqueda");
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
        onDateFilterChange={handleDateFilterChange}
        onOpenPedido={setSelectedPedido}
        onReadAction={announceHistorialControl}
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
            <h1 className="text-2xl font-black text-slate-950">Historial de turnos</h1>
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
          onDateFilterChange={handleDateFilterChange}
          onEstadoFilterChange={handleEstadoFilterChange}
          onMetodoFilterChange={handleMetodoFilterChange}
          onSearchFocus={handleSearchFocus}
          onSearchTermChange={setSearchTerm}
          searchTerm={searchTerm}
        />

        {isAdminView && (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HistoryStat label="Total vendido" value={formatKitchenCurrency(String(totalVendido))} />
            <HistoryStat label="Turnos cerrados" value={filteredTurnos.length} />
            <HistoryStat label="Pedidos entregados" value={pedidosEntregados} />
            <HistoryStat label="Pedidos cancelados" value={pedidosCancelados} />
          </section>
        )}

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
                onReadAction={announceHistorialControl}
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

function HistoryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </article>
  );
}
