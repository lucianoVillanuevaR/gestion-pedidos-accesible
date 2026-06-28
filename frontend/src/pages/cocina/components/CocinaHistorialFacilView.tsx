import { RefreshCw, Volume2 } from "lucide-react";
import EasyModeActions from "../../../components/EasyModeActions";
import { FOCUS_VISIBLE_CLASS } from "../../../constants/ui";
import {
  StatusBadge,
  formatCurrency as formatKitchenCurrency,
  getPedidoDisplayNumber
} from "../../pedidos/PedidosShared";
import type { HistorialDateFilter, HistorialPedidoDetalle } from "../cocinaHistoryUtils";
import { HISTORIAL_DATE_FILTERS } from "./CocinaHistorialFilters";
import { HistorialPedidoModal } from "./CocinaHistorialPedidoModal";

export function HistorialFacilView({
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
