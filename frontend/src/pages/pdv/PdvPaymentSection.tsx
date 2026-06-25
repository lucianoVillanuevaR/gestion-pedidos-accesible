import { Check, X } from "lucide-react";
import { formatCurrency } from "../../utils/pdv";
import { PAYMENT_OPTIONS } from "./PdvShared";
import { usePdvViewContext } from "./PdvViewContext";

type PdvPaymentSectionProps = {
  onAccept: () => void;
};

function PdvPaymentSection({ onAccept }: PdvPaymentSectionProps) {
  const {
    isHighContrast,
    metodoPago,
    openResetConfirm,
    pedidoDetalles,
    puedeRegistrar,
    selectMetodoPago,
    sending,
    total,
    totalItems
  } = usePdvViewContext();

  return (
    <>
      <div className="border-b border-dashed border-slate-300 px-3 py-3 no-print print:hidden">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>Subtotal Productos ({totalItems})</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Descuento</span>
          <span>{formatCurrency(0)}</span>
        </div>
      </div>

      <div className="border-b border-slate-200 px-3 py-3 no-print print:hidden">
        <div className="mb-3 flex items-center justify-end">
          <div className="text-right">
            <span className="mr-2 text-xs font-black text-slate-900">Total</span>
            <span className="text-2xl font-black text-slate-950">{formatCurrency(total)}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_OPTIONS.map((option) => {
            const active = metodoPago === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectMetodoPago(option.value)}
                className={`flex min-h-[42px] items-center justify-center gap-1 rounded-md border px-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
                  active
                    ? "border-[#FECE00] bg-[#FECE00] text-slate-950"
                    : "border-slate-300 bg-white text-slate-950 hover:bg-yellow-50"
                }`}
                aria-pressed={active}
              >
                <option.Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-xs">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.1fr] gap-1.5 p-3 no-print print:hidden">
        <button
          type="button"
          onClick={openResetConfirm}
          disabled={pedidoDetalles.length === 0}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-red-500 bg-white px-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Cancelar
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={!puedeRegistrar}
          className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border font-bold transition ${
            puedeRegistrar
              ? "border-slate-700 bg-slate-700 text-white hover:bg-slate-800"
              : "cursor-not-allowed border-slate-300 bg-slate-300 text-white"
          } ${isHighContrast && puedeRegistrar ? "contrast-button-success" : ""}`}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {sending ? "Aceptando..." : "Aceptar"}
        </button>
      </div>
    </>
  );
}

export default PdvPaymentSection;
