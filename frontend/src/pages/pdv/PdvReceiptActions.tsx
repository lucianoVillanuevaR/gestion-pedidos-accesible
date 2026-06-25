import { Printer, Trash2, Volume2 } from "lucide-react";
import { usePdvViewContext } from "./PdvViewContext";

function PdvReceiptActions() {
  const {
    handlePrint,
    handleReadPedidoSummary,
    isHighContrast,
    isTurnoOpen,
    openResetConfirm,
    pedidoDetalles,
    quickActionButtonClass,
    quickActionIconButtonClass
  } = usePdvViewContext();

  const canPrint = isTurnoOpen && pedidoDetalles.length > 0;

  return (
    <div className="px-3 pt-3 no-print print:hidden">
      <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          disabled={!canPrint}
          className={`w-full min-w-0 ${quickActionButtonClass} ${!canPrint ? "cursor-not-allowed opacity-40" : ""}`}
        >
          <Printer
            className={`h-4 w-4 shrink-0 ${isHighContrast ? "text-current" : "text-slate-700"}`}
            aria-hidden="true"
          />
          <span>Imprimir</span>
        </button>
        <button
          type="button"
          onClick={handleReadPedidoSummary}
          className={`w-full min-w-0 ${quickActionButtonClass}`}
          aria-label="Leer resumen del pedido"
          title="Leer resumen del pedido"
        >
          <span className="inline-flex items-center gap-2">
            <Volume2 className={`h-4 w-4 ${isHighContrast ? "text-current" : "text-black"}`} aria-hidden="true" />
            <span>Leer</span>
          </span>
        </button>
        <button
          type="button"
          onClick={openResetConfirm}
          disabled={pedidoDetalles.length === 0}
          className={`justify-self-end ${quickActionIconButtonClass} ${pedidoDetalles.length === 0 ? "cursor-not-allowed opacity-40" : ""}`}
          title="Vaciar pedido"
          aria-label="Vaciar pedido"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default PdvReceiptActions;
