import { Info } from "lucide-react";
import ProductImage from "../../components/productos/ProductImage";
import type { Producto } from "../../types";
import { formatCurrency } from "../../utils/pdv";

type PdvProductTileProps = {
  cantidad: number;
  disabled: boolean;
  onAdd: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  producto: Producto;
};

function PdvProductTile({ cantidad, disabled, onAdd, onDecrease, onIncrease, producto }: PdvProductTileProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm transition ${disabled ? "opacity-60" : "hover:border-yellow-400 hover:shadow-md"}`}
    >
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="block w-full text-left disabled:cursor-not-allowed"
        aria-label={`Agregar ${producto.nombre}`}
      >
        <div className="relative h-[120px] overflow-hidden bg-slate-300">
          <ProductImage
            src={producto.imagen}
            alt={`Imagen de ${producto.nombre}`}
            className="h-full w-full object-cover transition group-hover:scale-105"
            emptyClassName="flex h-full w-full items-center justify-center bg-slate-300 text-center text-xs font-bold uppercase text-slate-600"
            emptyLabel="Producto"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-2 pb-1.5 pt-8">
            <h3 className="line-clamp-2 min-h-[34px] text-sm font-black uppercase leading-tight text-white">
              {producto.nombre}
            </h3>
          </div>
          {cantidad > 0 && (
            <span className="absolute right-2 top-2 rounded-full bg-[#FECE00] px-2 py-0.5 text-xs font-black text-slate-950">
              {cantidad}
            </span>
          )}
        </div>
      </button>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-2 py-1.5">
        <p className="truncate text-base font-black text-slate-800">{formatCurrency(producto.precio)}</p>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="rounded-full p-1 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
          aria-label={`Agregar ${producto.nombre}`}
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
      {disabled && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/45 px-2 text-center text-xs font-black text-slate-700">
          Abrir turno
        </div>
      )}
    </article>
  );
}

export default PdvProductTile;
