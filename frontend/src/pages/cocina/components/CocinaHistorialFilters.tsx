import { Search } from "lucide-react";
import { FOCUS_VISIBLE_CLASS } from "../../../constants/ui";
import type { HistorialDateFilter, HistorialEstadoFilter, HistorialMetodoFilter } from "../cocinaHistoryUtils";

export const HISTORIAL_DATE_FILTERS: Array<{ label: string; value: HistorialDateFilter }> = [
  { label: "Hoy", value: "today" },
  { label: "Esta semana", value: "week" },
  { label: "Este mes", value: "month" },
  { label: "Todos", value: "all" }
];

export const HISTORIAL_ESTADO_FILTERS: Array<{ label: string; value: HistorialEstadoFilter }> = [
  { label: "Todos", value: "todos" },
  { label: "Entregado", value: "entregado" },
  { label: "Pendiente", value: "pendiente" },
  { label: "Cancelado", value: "cancelado" }
];

export const HISTORIAL_METODO_FILTERS: Array<{ label: string; value: HistorialMetodoFilter }> = [
  { label: "Todos", value: "todos" },
  { label: "Efectivo", value: "efectivo" },
  { label: "Tarjeta", value: "tarjeta" },
  { label: "Transferencia", value: "transferencia" }
];

export function HistorialFilters({
  dateFilter,
  estadoFilter,
  isHighContrast,
  metodoFilter,
  onDateFilterChange,
  onEstadoFilterChange,
  onMetodoFilterChange,
  onSearchFocus,
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
  onSearchFocus?: () => void;
  onSearchTermChange: (value: string) => void;
  searchTerm: string;
}) {
  const panelClass = isHighContrast ? "contrast-panel border-yellow-400" : "border border-slate-200 bg-white shadow-sm";

  return (
    <section className={`grid gap-3 rounded-xl px-4 py-3 ${panelClass}`} aria-label="Filtros del historial de turnos">
      <label className="relative block">
        <span className="sr-only">Barra de búsqueda</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          onClick={onSearchFocus}
          onFocus={onSearchFocus}
          aria-label="Barra de búsqueda"
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
