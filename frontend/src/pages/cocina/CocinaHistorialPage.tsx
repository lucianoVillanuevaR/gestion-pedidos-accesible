import { Check, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
import { cargarCierresTurno, obtenerCierresTurno } from "../../services/cierresTurno";
import type { CierreTurno } from "../../types";
import { ESTADO_META, formatCurrency as formatKitchenCurrency, getPedidoDisplayNumber } from "../pedidos/PedidosShared";
import { HistorialFacilView } from "./components/CocinaHistorialFacilView";
import { HistorialFilters } from "./components/CocinaHistorialFilters";
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
