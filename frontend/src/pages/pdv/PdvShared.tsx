import { ArrowLeftRight, Banknote, CreditCard } from "lucide-react";
import type { Producto } from "../../types";
import { detectCategoria, formatCurrency, getCategoriaLabel, type ProductoCategoriaCatalogo } from "../../utils/pdv";
import { PRODUCT_IMAGE_PLACEHOLDER } from "../../utils/productImages";

export type FeedbackState = {
  type: "success" | "error" | "info";
  title?: string;
  message: string;
  details?: string;
};

export type SoundCue = "add" | "decrease" | "remove" | "clear" | "success" | "error";

export type ToneStep = {
  delayMs?: number;
  durationMs: number;
  frequency: number;
  type?: OscillatorType;
  volume?: number;
};

export const ACCESSIBLE_STEP_COUNT = 6;

export function usesProductConfigurator(producto: Producto) {
  return Boolean(producto);
}

export const PAYMENT_OPTIONS = [
  { value: "efectivo", label: "Efectivo", Icon: Banknote },
  { value: "tarjeta", label: "Tarjeta", Icon: CreditCard },
  { value: "transferencia", label: "Transferencia", Icon: ArrowLeftRight }
] as const;

export const SOUND_CUES: Record<SoundCue, ToneStep[]> = {
  add: [{ frequency: 880, durationMs: 70, type: "triangle", volume: 0.07 }],
  decrease: [{ frequency: 640, durationMs: 75, type: "sine", volume: 0.062 }],
  remove: [
    { frequency: 620, durationMs: 65, type: "sine", volume: 0.062 },
    { frequency: 520, durationMs: 90, delayMs: 55, type: "sine", volume: 0.07 }
  ],
  clear: [
    { frequency: 660, durationMs: 60, type: "triangle", volume: 0.055 },
    { frequency: 520, durationMs: 75, delayMs: 60, type: "triangle", volume: 0.062 },
    { frequency: 380, durationMs: 110, delayMs: 135, type: "sine", volume: 0.07 }
  ],
  success: [
    { frequency: 880, durationMs: 75, type: "triangle", volume: 0.062 },
    { frequency: 1040, durationMs: 120, delayMs: 70, type: "triangle", volume: 0.075 }
  ],
  error: [
    { frequency: 260, durationMs: 90, type: "sawtooth", volume: 0.055 },
    { frequency: 220, durationMs: 140, delayMs: 75, type: "sawtooth", volume: 0.062 }
  ]
};

export function ProductCard({
  producto,
  cantidad,
  isAccessible,
  isHighContrast,
  onIncrease,
  onDecrease,
  onAdd
}: {
  producto: Producto;
  cantidad: number;
  isAccessible: boolean;
  isHighContrast: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onAdd: () => void;
}) {
  const categoria = (producto.categoria?.trim() || detectCategoria(producto)) as ProductoCategoriaCatalogo;

  return (
    <article
      className={`flex h-full flex-col rounded-2xl overflow-hidden border transition ${
        isAccessible
          ? "bg-white border-2 border-slate-900"
          : "bg-white border border-slate-200 hover:shadow-md hover:border-yellow-200"
      } ${isHighContrast ? "contrast-panel" : ""}`}
    >
      <div
        className={`h-32 overflow-hidden ${isAccessible ? "bg-slate-100 border-b-2 border-slate-900" : "bg-[#FECE00]"}`}
      >
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.altText || producto.nombre}
            onError={(event) => {
              event.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
            }}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-end justify-center bg-gradient-to-br from-[#FFF8DC] via-[#FFFBF0] to-[#F7F7F7] pb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
            aria-hidden="true"
          >
            {categoria}
          </div>
        )}
      </div>

      <div className={`flex-1 p-4 ${isAccessible ? "space-y-2" : "space-y-3"}`}>
        <span
          className={`inline-block px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wide ${
            isAccessible
              ? "bg-slate-100 text-slate-900 border border-slate-300"
              : "bg-[#FFF4BF] text-yellow-800 border border-[#FECE00]"
          } ${isHighContrast ? "contrast-badge" : ""}`}
        >
          {getCategoriaLabel(categoria)}
        </span>

        <div>
          <h3
            className={`font-black leading-tight text-slate-950 ${isAccessible ? "text-2xl" : "text-lg"} ${isHighContrast ? "contrast-important" : ""}`}
          >
            {producto.nombre}
          </h3>
          {producto.descripcion && (
            <p
              className={`mt-1 text-slate-600 ${isAccessible ? "text-base" : "text-sm"} ${isHighContrast ? "contrast-body-text" : ""}`}
            >
              {producto.descripcion}
            </p>
          )}
        </div>

        <div className={`pt-2 border-t ${isAccessible ? "border-slate-300" : "border-yellow-100"}`}>
          <p
            className={`font-black ${isAccessible ? "text-2xl" : "text-xl"} ${isAccessible ? "text-slate-900" : "text-yellow-700"} ${isHighContrast ? "contrast-important" : ""}`}
          >
            {formatCurrency(producto.precio)}
          </p>
        </div>
      </div>

      <div className={`px-4 ${isAccessible ? "pb-3" : "pb-4"} space-y-2`}>
        {isAccessible ? (
          <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
            <p className="mb-4 text-center text-xl font-black text-slate-900">¿Cuánto?</p>
            <div className="grid grid-cols-[minmax(76px,1fr)_auto_minmax(76px,1fr)] items-center gap-4">
              <button
                type="button"
                onClick={onDecrease}
                disabled={cantidad === 0}
                className={`min-h-[76px] rounded-xl border-4 border-slate-900 bg-white text-5xl font-black leading-none text-slate-900 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 ${
                  cantidad === 0 ? "cursor-not-allowed opacity-40" : "hover:bg-slate-100"
                }`}
                aria-label={`Disminuir ${producto.nombre}`}
              >
                −
              </button>

              <div className="min-w-[104px] rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-center">
                <p className="text-sm font-black uppercase tracking-wide text-slate-600">Cantidad</p>
                <p className="text-5xl font-black leading-none text-slate-950">{cantidad}</p>
              </div>

              <button
                type="button"
                onClick={cantidad > 0 ? onIncrease : onAdd}
                className="min-h-[76px] rounded-xl border-4 border-slate-900 bg-[#FECE00] text-5xl font-black leading-none text-slate-950 transition hover:bg-[#FFD633] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:ring-offset-2"
                aria-label={`Aumentar ${producto.nombre}`}
              >
                +
              </button>
            </div>

            <p className="mt-4 text-center text-base font-bold text-slate-700">
              {cantidad === 0 ? "Usa + para agregar este producto" : `Seleccionaste ${cantidad}`}
            </p>
          </div>
        ) : (
          <>
            {cantidad > 0 && (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-[#FFF4BF] bg-[#FFFBF0] p-2">
                <button
                  type="button"
                  onClick={onDecrease}
                  className="rounded-lg border border-slate-300 bg-white py-2 font-bold text-slate-900 transition hover:bg-slate-100"
                  aria-label={`Disminuir ${producto.nombre}`}
                >
                  −
                </button>

                <div className="text-center text-xl font-black">{cantidad}</div>

                <button
                  type="button"
                  onClick={onIncrease}
                  className="rounded-lg border border-slate-500 bg-slate-600 py-2 font-bold text-white transition hover:bg-slate-700"
                  aria-label={`Aumentar ${producto.nombre}`}
                >
                  +
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onAdd}
              className="min-h-[48px] w-full rounded-xl border border-slate-500 bg-slate-600 py-3 font-bold text-white transition hover:bg-slate-700"
              aria-label={`Agregar ${producto.nombre}`}
            >
              {cantidad > 0 ? "Agregar más" : "Agregar"}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
