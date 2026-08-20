import { ArrowLeft, ArrowRight } from "lucide-react";
import { FOCUS_VISIBLE_CLASS } from "../../../constants/ui";

export function HistorialPagination({
  end,
  isHighContrast,
  onPageChange,
  page,
  start,
  total,
  totalPages
}: {
  end: number;
  isHighContrast: boolean;
  onPageChange: (page: number) => void;
  page: number;
  start: number;
  total: number;
  totalPages: number;
}) {
  const buttonClass = isHighContrast
    ? "contrast-button-secondary"
    : "border-slate-300 bg-white text-slate-800 hover:border-slate-900 hover:bg-slate-50";

  return (
    <nav
      className={`grid gap-3 rounded-xl border px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center ${
        isHighContrast ? "contrast-panel border-yellow-400" : "border-slate-200 bg-white"
      }`}
      aria-label="Paginación del historial de turnos"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Ir a la página anterior"
        className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonClass} ${FOCUS_VISIBLE_CLASS}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Anterior
      </button>

      <div className="text-center" aria-live="polite" aria-label={`Página ${page} de ${totalPages}`}>
        <p className="font-black text-slate-950">
          Página {page} de {totalPages}
        </p>
        <p className="mt-0.5 text-sm font-bold text-slate-600">
          {total === 0 ? "0 turnos" : `Mostrando ${start}–${end} de ${total} turnos`}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Ir a la página siguiente"
        className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonClass} ${FOCUS_VISIBLE_CLASS}`}
      >
        Siguiente
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
