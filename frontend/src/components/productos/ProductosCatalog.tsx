import { ChevronDown, Ellipsis, Eye, EyeOff, Pencil, Plus, Trash2, Utensils } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductoConCategoria } from "../../utils/pdv";
import { formatCurrency } from "../../utils/pdv";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";
import type { CategoriaCatalogo } from "../../pages/productos/ProductosShared";
import EmptyState from "../ui/EmptyState";
import ProductImage from "./ProductImage";

export type CategoriaGrupo = {
  activa: boolean | null;
  id?: number;
  label: string;
  productos: ProductoConCategoria[];
  value: CategoriaCatalogo;
};

export function CategoriaBlock({
  grupo,
  isExpanded,
  isOptionsOpen: controlledIsOptionsOpen,
  onAddProduct,
  onDeleteCategory,
  deleteCategoryDisabledReason,
  onEditProduct,
  onToggle,
  onToggleCategory,
  onOptionsOpenChange,
  onToggleAvailability,
  updatingProductoId
}: {
  grupo: CategoriaGrupo;
  isExpanded: boolean;
  isOptionsOpen?: boolean;
  onAddProduct: () => void;
  onDeleteCategory?: () => void;
  deleteCategoryDisabledReason?: string;
  onEditProduct: (producto: ProductoConCategoria) => void;
  onToggle: () => void;
  onToggleCategory?: () => void;
  onOptionsOpenChange?: (isOpen: boolean) => void;
  onToggleAvailability: (producto: ProductoConCategoria) => void;
  updatingProductoId: number | null;
}) {
  const [internalIsOptionsOpen, setInternalIsOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const isOptionsOpen = controlledIsOptionsOpen ?? internalIsOptionsOpen;
  const setIsOptionsOpen = useCallback(
    (isOpen: boolean) => {
      if (onOptionsOpenChange) {
        onOptionsOpenChange(isOpen);
        return;
      }
      setInternalIsOptionsOpen(isOpen);
    },
    [onOptionsOpenChange]
  );

  useEffect(() => {
    if (!isOptionsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!optionsRef.current?.contains(event.target as Node)) setIsOptionsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOptionsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOptionsOpen, setIsOptionsOpen]);

  return (
    <section
      className={`${isOptionsOpen ? "overflow-visible" : "overflow-hidden"} rounded-[10px] border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.06)]`}
    >
      <div className="flex min-h-[54px] flex-wrap items-center justify-between gap-2 bg-slate-100 px-3 py-2 sm:flex-nowrap sm:gap-3 sm:py-0">
        <button
          type="button"
          onClick={onToggle}
          className={`flex min-w-0 flex-1 basis-[220px] items-center gap-3 rounded-lg py-2 text-left transition hover:bg-slate-200 ${FOCUS_VISIBLE_CLASS}`}
          aria-expanded={isExpanded}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500">
            <Utensils className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold text-slate-600">Nombre de categoría</span>
            <span className="flex flex-wrap items-center gap-2">
              <span className="block truncate text-sm font-black uppercase text-slate-950">{grupo.label}</span>
              {grupo.activa === false && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-black text-slate-700">
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  Oculta
                </span>
              )}
            </span>
          </span>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-black text-slate-600 shadow-sm">
            {grupo.productos.length}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddProduct();
            }}
            aria-label={`Agregar producto en ${grupo.label}`}
            className={`inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg border border-slate-900 bg-slate-900 px-2 text-sm font-black text-white transition hover:bg-black sm:px-3 ${FOCUS_VISIBLE_CLASS}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Agregar producto</span>
          </button>
          {onToggleCategory && (
            <div ref={optionsRef} className="relative">
              <button
                type="button"
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                aria-expanded={isOptionsOpen}
                aria-label={`Opciones de categoría ${grupo.label}`}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
              >
                <Ellipsis className="h-5 w-5" aria-hidden="true" />
              </button>
              {isOptionsOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsOpen(false);
                      onToggleCategory();
                    }}
                    className={`flex min-h-[42px] w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-black text-slate-700 transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
                    aria-label={`${grupo.activa === false ? "Mostrar" : "Ocultar"} categoría ${grupo.label}`}
                  >
                    {grupo.activa === false ? (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    )}
                    {grupo.activa === false ? "Mostrar categoría" : "Ocultar categoría"}
                  </button>
                  {(onDeleteCategory || deleteCategoryDisabledReason) && (
                    <button
                      type="button"
                      disabled={Boolean(deleteCategoryDisabledReason)}
                      title={deleteCategoryDisabledReason}
                      aria-label={
                        deleteCategoryDisabledReason
                          ? `Eliminar categoría no disponible: ${deleteCategoryDisabledReason}`
                          : "Eliminar categoría"
                      }
                      onClick={() => {
                        setIsOptionsOpen(false);
                        onDeleteCategory?.();
                      }}
                      className={`flex min-h-[42px] w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent ${FOCUS_VISIBLE_CLASS}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Eliminar categoría
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
          {grupo.activa === false && (
            <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
              No visible en PDV mientras la categoría esté oculta.
            </p>
          )}
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
      className={`grid gap-3 px-3 py-3 transition hover:bg-[#FFFDF3] sm:grid-cols-[minmax(0,1fr)_120px_96px] sm:items-center ${isAvailable ? "" : "bg-slate-50"}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
          <Utensils className="h-4 w-4" aria-hidden="true" />
        </span>
        <ProductImage
          src={producto.imagen}
          alt={producto.altText ?? producto.nombre}
          className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover"
          emptyClassName="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-[#FFF8DC] text-slate-700"
          emptyLabel="icon"
        />
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
          aria-label={isAvailable ? `Ocultar producto ${producto.nombre}` : `Mostrar producto ${producto.nombre}`}
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
          aria-label={`Editar producto ${producto.nombre}`}
        >
          <Pencil className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export function EmptyProductos() {
  return (
    <EmptyState
      icon={Utensils}
      title="No hay productos para mostrar"
      message="Prueba con otra búsqueda o actualiza el catálogo."
    />
  );
}
