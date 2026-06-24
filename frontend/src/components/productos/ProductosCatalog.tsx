import { ChevronDown, Eye, EyeOff, Pencil, Plus, Utensils } from "lucide-react";
import type { ProductoConCategoria } from "../../utils/pdv";
import { formatCurrency } from "../../utils/pdv";
import { PRODUCT_IMAGE_PLACEHOLDER } from "../../utils/productImages";
import { FOCUS_VISIBLE_CLASS } from "../../pages/pedidos/PedidosShared";
import type { CategoriaCatalogo } from "../../pages/productos/ProductosShared";

export type CategoriaGrupo = {
  label: string;
  productos: ProductoConCategoria[];
  value: CategoriaCatalogo;
};

export function CategoriaBlock({
  grupo,
  isExpanded,
  onAddProduct,
  onEditProduct,
  onToggle,
  onToggleAvailability,
  updatingProductoId
}: {
  grupo: CategoriaGrupo;
  isExpanded: boolean;
  onAddProduct: () => void;
  onEditProduct: (producto: ProductoConCategoria) => void;
  onToggle: () => void;
  onToggleAvailability: (producto: ProductoConCategoria) => void;
  updatingProductoId: number | null;
}) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
      <div className="flex min-h-[54px] items-center justify-between gap-3 bg-slate-100 px-3">
        <button
          type="button"
          onClick={onToggle}
          className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg py-2 text-left transition hover:bg-slate-200 ${FOCUS_VISIBLE_CLASS}`}
          aria-expanded={isExpanded}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500">
            <Utensils className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold text-slate-500">Nombre de categoría</span>
            <span className="block truncate text-sm font-black uppercase text-slate-950">{grupo.label}</span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-black text-slate-600 shadow-sm">
            {grupo.productos.length}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddProduct();
            }}
            className={`hidden min-h-[36px] items-center justify-center gap-1 rounded-lg border border-slate-900 bg-slate-900 px-3 text-sm font-black text-white transition hover:bg-black sm:inline-flex ${FOCUS_VISIBLE_CLASS}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Producto
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
            aria-label={isExpanded ? `Cerrar ${grupo.label}` : `Abrir ${grupo.label}`}
          >
            <ChevronDown className={`h-5 w-5 transition ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="divide-y divide-slate-100">
          {grupo.productos.length === 0 ? (
            <div className="px-4 py-6 text-sm font-bold text-slate-500">Esta categoría aún no tiene productos.</div>
          ) : (
            grupo.productos.map((producto) => (
              <ProductoRow
                key={producto.id}
                isUpdating={updatingProductoId === producto.id}
                onEditProduct={onEditProduct}
                onToggleAvailability={onToggleAvailability}
                producto={producto}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}

function ProductoRow({
  isUpdating,
  onEditProduct,
  onToggleAvailability,
  producto
}: {
  isUpdating: boolean;
  onEditProduct: (producto: ProductoConCategoria) => void;
  onToggleAvailability: (producto: ProductoConCategoria) => void;
  producto: ProductoConCategoria;
}) {
  const isAvailable = producto.disponible !== false;

  return (
    <article
      className={`grid gap-3 px-3 py-3 transition hover:bg-[#FFFDF3] sm:grid-cols-[minmax(0,1fr)_120px_96px] sm:items-center ${isAvailable ? "" : "bg-slate-50 opacity-70"}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
          <Utensils className="h-4 w-4" aria-hidden="true" />
        </span>
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.altText ?? producto.nombre}
            onError={(event) => {
              event.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
            }}
            className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-[#FFF8DC] text-slate-700">
            <Utensils className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{producto.nombre}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {isAvailable ? (producto.destacado ? "Destacado" : producto.categoria) : "Oculto"}
            {producto.descripcion ? ` · ${producto.descripcion}` : ""}
          </p>
        </div>
      </div>

      <p className="text-left text-base font-black text-slate-950 sm:text-right">{formatCurrency(producto.precio)}</p>

      <div className="flex items-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => onToggleAvailability(producto)}
          disabled={isUpdating}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isAvailable
              ? "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
          } ${FOCUS_VISIBLE_CLASS}`}
          aria-label={isAvailable ? `Ocultar ${producto.nombre}` : `Mostrar ${producto.nombre}`}
        >
          {isAvailable ? (
            <Eye className="h-5 w-5" aria-hidden="true" />
          ) : (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onEditProduct(producto)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-yellow-200 bg-[#FFF8DC] text-slate-950 transition hover:bg-[#FFF4BF] ${FOCUS_VISIBLE_CLASS}`}
          aria-label={`Editar ${producto.nombre}`}
        >
          <Pencil className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export function EmptyProductos() {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-8 text-center shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-200 bg-[#FFF8DC] text-slate-950">
        <Utensils className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mt-5 text-2xl font-black text-slate-950">No hay productos para mostrar</p>
      <p className="mt-3 font-bold text-slate-600">Prueba con otra búsqueda o actualiza el catálogo.</p>
    </div>
  );
}
