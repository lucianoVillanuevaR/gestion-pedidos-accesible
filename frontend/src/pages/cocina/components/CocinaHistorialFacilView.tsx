import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import EasyModeActions from "../../../components/EasyModeActions";
import { FOCUS_VISIBLE_CLASS } from "../../../constants/ui";
import {
  StatusBadge,
  formatCurrency as formatKitchenCurrency,
  getPedidoDisplayNumber
} from "../../pedidos/PedidosShared";
import {
  formatHistorialPedidoTime,
  groupHistorialPedidosByDate,
  type HistorialDateFilter,
  type HistorialPedidoDetalle
} from "../cocinaHistoryUtils";
import { HISTORIAL_DATE_FILTERS } from "./CocinaHistorialFilters";
import { HistorialPedidoModal } from "./CocinaHistorialPedidoModal";

export function HistorialFacilView({
  dateFilter,
  isHighContrast,
  liveMessage,
  onDateFilterChange,
  onOpenPedido,
  onReadAction,
  onRefresh,
  pedidos,
  selectedPedido
}: {
  dateFilter: HistorialDateFilter;
  isHighContrast: boolean;
  liveMessage: string;
  onDateFilterChange: (value: HistorialDateFilter) => void;
  onOpenPedido: (pedido: HistorialPedidoDetalle | null) => void;
  onReadAction: (message: string, dedupeKey: string) => void;
  onRefresh: () => void;
  pedidos: HistorialPedidoDetalle[];
  selectedPedido: HistorialPedidoDetalle | null;
}) {
  const PAGE_SIZE = 10;
  const easyFilters = HISTORIAL_DATE_FILTERS.filter((filter) => ["all", "today", "week"].includes(filter.value));
  const [visibleCountByFilter, setVisibleCountByFilter] = useState<Partial<Record<HistorialDateFilter, number>>>({});
  const visibleCount = visibleCountByFilter[dateFilter] ?? PAGE_SIZE;
  const visiblePedidos = useMemo(() => pedidos.slice(0, visibleCount), [pedidos, visibleCount]);
  const groupedPedidos = useMemo(() => groupHistorialPedidosByDate(visiblePedidos), [visiblePedidos]);
  const emptyMessage =
    dateFilter === "today"
      ? "No hay pedidos de hoy."
      : dateFilter === "week"
        ? "No hay pedidos registrados esta semana."
        : "No hay pedidos recientes.";

  return (
    <div className={`min-h-screen ${isHighContrast ? "bg-black text-white" : "bg-white text-slate-950"}`}>
      <main className="mx-auto w-full max-w-[1440px] space-y-4 px-3 pb-5 pt-4 sm:px-4 sm:pt-5 lg:px-5 lg:pt-6 xl:px-6">
        <p className="sr-only" aria-live="polite">
          {liveMessage}
        </p>
        <section
          className={`rounded-[28px] p-5 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-950">Pedidos recientes</h1>
              <p className="mt-2 text-xl font-bold text-slate-700">Consulta los últimos pedidos registrados.</p>
            </div>
            <EasyModeActions compact className="lg:min-w-[610px]" />
          </div>
        </section>

        <section
          className={`rounded-[28px] p-4 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
          aria-label="Filtros rápidos de historial"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid gap-3 sm:grid-cols-3">
              {easyFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => onDateFilterChange(filter.value)}
                  aria-pressed={dateFilter === filter.value}
                  className={`min-h-[52px] rounded-xl border-2 px-5 text-lg font-black transition ${
                    dateFilter === filter.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                  } ${FOCUS_VISIBLE_CLASS}`}
                >
                  {filter.value === "all" ? "Recientes" : filter.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Actualizar pedidos recientes"
              className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 px-5 text-lg font-black transition ${
                isHighContrast
                  ? "contrast-button-secondary"
                  : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <RefreshCw className="h-5 w-5" aria-hidden="true" />
              Actualizar
            </button>
          </div>
        </section>

        <section className="grid gap-4" aria-label="Lista simple de pedidos recientes">
          {pedidos.length === 0 ? (
            <div
              className={`rounded-2xl px-5 py-6 text-center ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
            >
              <p className="text-2xl font-black text-slate-950">{emptyMessage}</p>
            </div>
          ) : (
            groupedPedidos.map((group) => (
              <section key={group.dateKey} aria-labelledby={`historial-fecha-${group.dateKey}`}>
                <div className="mb-2 flex items-center gap-3">
                  <h2 id={`historial-fecha-${group.dateKey}`} className="shrink-0 text-lg font-black text-slate-800">
                    {group.label}
                  </h2>
                  <span className="h-px w-full bg-slate-300" aria-hidden="true" />
                </div>
                <div className="grid gap-2">
                  {group.pedidos.map((pedido) => (
                    <article
                      key={`${pedido.turnoId}-${pedido.id}`}
                      className={`rounded-2xl px-4 py-3 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
                    >
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:grid-cols-[minmax(210px,1fr)_minmax(150px,auto)_minmax(130px,auto)_auto]">
                        <div>
                          <p className="text-2xl font-black text-slate-950">Pedido #{getPedidoDisplayNumber(pedido)}</p>
                          <p className="mt-1 font-bold text-slate-600">{formatHistorialPedidoTime(pedido)}</p>
                        </div>
                        <StatusBadge estado={pedido.estado} />
                        <p
                          className="text-xl font-black text-slate-800"
                          aria-label={`Total ${formatKitchenCurrency(String(pedido.total))}`}
                        >
                          {formatKitchenCurrency(String(pedido.total))}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            onReadAction(
                              `Ver detalle del pedido ${getPedidoDisplayNumber(pedido)}, ${formatHistorialPedidoTime(pedido)}.`,
                              `historial-facil-pedido-detalle:${pedido.turnoId}:${pedido.id}`
                            );
                            onOpenPedido(pedido);
                          }}
                          className={`min-h-[52px] rounded-xl border-2 px-4 text-lg font-black transition ${
                            isHighContrast
                              ? "contrast-button-secondary"
                              : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
                          } ${FOCUS_VISIBLE_CLASS}`}
                        >
                          Ver detalle
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </section>

        {visibleCount < pedidos.length && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() =>
                setVisibleCountByFilter((currentCounts) => ({
                  ...currentCounts,
                  [dateFilter]: visibleCount + PAGE_SIZE
                }))
              }
              className={`min-h-[52px] rounded-xl border-2 px-6 text-lg font-black transition ${
                isHighContrast
                  ? "contrast-button-secondary"
                  : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              Ver más pedidos
            </button>
          </div>
        )}

        {selectedPedido && <HistorialPedidoModal pedido={selectedPedido} onClose={() => onOpenPedido(null)} />}
      </main>
    </div>
  );
}
