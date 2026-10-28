import { Info } from "lucide-react";
import ProductImage from "../../../components/productos/ProductImage";
import type { Producto } from "../../../types";
import { formatCurrency } from "../../../utils/pdv";

type PdvProductTileProps = {
  cantidad: number;
  disabled: boolean;
  onAdd: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  producto: Producto;
};

function PdvProductTile({ cantidad, disabled, onAdd, onDecrease, onIncrease, producto }: PdvProductTileProps) {
  const addProductLabel = disabled
    ? `${producto.nombre} no disponible mientras el turno está cerrado`
    : `Agregar ${producto.nombre}`;

  return (
    <article
      className={`group relative flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm transition ${disabled ? "opacity-60" : "hover:border-yellow-400 hover:shadow-md"}`}
      aria-disabled={disabled || undefined}
    >
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="flex w-full flex-col text-left disabled:cursor-not-allowed"
        aria-label={addProductLabel}
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-white">
          <ProductImage
            src={producto.imagen}
            alt={`Imagen de ${producto.nombre}`}
            className="h-full w-full object-cover object-center transition group-hover:scale-105"
            emptyClassName="flex h-full w-full items-center justify-center bg-slate-300 text-center text-xs font-bold uppercase text-slate-600"
            emptyLabel="Producto"
          />
          {cantidad > 0 && (
            <span className="absolute right-2 top-2 rounded-full bg-[#FECE00] px-2 py-0.5 text-xs font-black text-slate-950">
              {cantidad}
            </span>
          )}
        </div>
        <div className="flex w-full items-start border-t border-slate-200 px-2.5 py-2">
          <h3 className="line-clamp-3 min-h-[3.75em] whitespace-normal break-normal text-sm font-black uppercase leading-tight text-slate-950 [hyphens:none]">
            {producto.nombre}
          </h3>
        </div>
      </button>
      <div className="mt-auto grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-slate-100 px-2.5 py-2">
        <p className="min-w-0 whitespace-nowrap text-base font-black text-slate-800">
          {formatCurrency(producto.precio)}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="rounded-full p-1 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
          aria-label={addProductLabel}
        >
          <Info className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {cantidad > 0 && (
        <div className="grid grid-cols-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onDecrease}
            disabled={disabled}
            className="min-h-[32px] bg-slate-50 text-lg font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
            aria-label={`Disminuir ${producto.nombre}`}
          >
            -
          </button>
          <button
            type="button"
            onClick={onIncrease}
            disabled={disabled}
            className="min-h-[32px] bg-[#FECE00] text-lg font-black text-slate-950 transition hover:bg-[#FFD633] disabled:cursor-not-allowed"
            aria-label={`Aumentar ${producto.nombre}`}
          >
            +
          </button>
        </div>
      )}
    </article>
  );
}

export default PdvProductTile;
