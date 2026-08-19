import { ChefHat, ChevronDown, Printer, ReceiptText, Trash2, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePdvViewContext } from "../PdvViewContext";

function PdvReceiptActions() {
  const {
    handlePrint,
    handlePrintKitchen,
    handleReadPedidoSummary,
    hasPrintableKitchenTicket,
    hasPrintableTicket,
    isHighContrast,
    isTurnoOpen,
    openResetConfirm,
    pedidoDetalles,
    printablePedidoNumber,
    quickActionButtonClass,
    quickActionIconButtonClass
  } = usePdvViewContext();

  const canPrintKitchen = isTurnoOpen && hasPrintableKitchenTicket;
  const canPrintCustomer = isTurnoOpen && hasPrintableTicket;
  const canPrint = canPrintKitchen || canPrintCustomer;
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const printMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPrintMenuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (!printMenuRef.current?.contains(event.target as Node)) setIsPrintMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPrintMenuOpen(false);
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isPrintMenuOpen]);

  return (
    <div className="px-3 pt-3 no-print print:hidden">
      <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-2">
        <div className="relative min-w-0" ref={printMenuRef}>
          <button
            type="button"
            onClick={() => setIsPrintMenuOpen((open) => !open)}
            disabled={!canPrint}
            className={`w-full min-w-0 ${quickActionButtonClass} ${!canPrint ? "cursor-not-allowed opacity-40" : ""}`}
            aria-expanded={isPrintMenuOpen}
            aria-controls="pdv-print-options"
          >
            <Printer
              className={`h-4 w-4 shrink-0 ${isHighContrast ? "text-current" : "text-slate-700"}`}
              aria-hidden="true"
            />
            <span>{printablePedidoNumber ? `Imprimir #${printablePedidoNumber}` : "Imprimir"}</span>
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
          {isPrintMenuOpen && (
            <div
              className={`absolute bottom-[calc(100%+8px)] left-0 z-50 min-w-[220px] overflow-hidden rounded-xl border py-1 shadow-xl ${isHighContrast ? "contrast-panel border-yellow-400" : "border-slate-200 bg-white text-slate-900"}`}
              id="pdv-print-options"
              aria-label="Opciones de impresión"
            >
              <button
                type="button"
                disabled={!canPrintKitchen}
                onClick={() => {
                  setIsPrintMenuOpen(false);
                  handlePrintKitchen();
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${isHighContrast ? "hover:bg-yellow-400 hover:text-black focus:bg-yellow-400 focus:text-black" : "hover:bg-slate-100 focus:bg-slate-100"}`}
              >
                <ChefHat className="h-5 w-5" aria-hidden="true" />
                Ticket de cocina
              </button>
              <button
                type="button"
                disabled={!canPrintCustomer}
                onClick={() => {
                  setIsPrintMenuOpen(false);
                  handlePrint();
                }}
                className={`flex w-full items-center gap-3 border-t px-4 py-3 text-left text-sm font-bold focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${isHighContrast ? "border-yellow-400 hover:bg-yellow-400 hover:text-black focus:bg-yellow-400 focus:text-black" : "border-slate-200 hover:bg-slate-100 focus:bg-slate-100"}`}
              >
                <ReceiptText className="h-5 w-5" aria-hidden="true" />
                Ticket de cliente
              </button>
            </div>
          )}
        </div>
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
