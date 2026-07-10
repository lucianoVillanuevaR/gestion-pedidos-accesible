import { Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";
import type { CategoriaCatalogo } from "../../pages/productos/ProductosShared";
import type { CategoriaGrupo } from "./ProductosCatalog";

type ProductosToolbarProps = {
  activeCategory: CategoriaCatalogo;
  grupos: CategoriaGrupo[];
  isLoading: boolean;
  onCreateCategory: () => void;
  onCreateProduct: () => void;
  onDeleteCategory: () => void;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  onSearchFocus?: () => void;
  onSelectCategory: (grupo: CategoriaGrupo) => void;
  searchTerm: string;
};

export function ProductosToolbar({
  activeCategory,
  grupos,
  isLoading,
  onCreateCategory,
  onCreateProduct,
  onDeleteCategory,
  onRefresh,
  onSearchChange,
  onSearchFocus,
  onSelectCategory,
  searchTerm
}: ProductosToolbarProps) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-3 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <ToolbarButton icon={Plus} label="Producto" onClick={onCreateProduct} />
          <ToolbarButton icon={Plus} label="Crear categoría" onClick={onCreateCategory} />
          <ToolbarButton danger icon={Trash2} label="Eliminar categoría" onClick={onDeleteCategory} />
          <ToolbarButton
            disabled={isLoading}
            icon={RefreshCw}
            iconClassName={isLoading ? "animate-spin" : ""}
            label="Actualizar"
            onClick={onRefresh}
          />
        </div>
      </div>

      <div className="grid gap-3 px-3 py-3">
        <label className="relative block">
          <span className="sr-only">Buscar producto</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            onClick={onSearchFocus}
            onFocus={onSearchFocus}
            aria-label="Barra de búsqueda de productos"
            placeholder="Buscar producto, categoría o precio"
            className={`min-h-[44px] w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-slate-900 ${FOCUS_VISIBLE_CLASS}`}
          />
        </label>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categorías del menú">
          {grupos.map((grupo) => {
            const isActive = activeCategory === grupo.value;

            return (
              <button
                key={grupo.value}
                type="button"
                onClick={() => onSelectCategory(grupo)}
                aria-selected={isActive}
                role="tab"
                title={grupo.label}
                className={`inline-flex min-h-[42px] max-w-full items-center gap-2 rounded-xl border px-3 text-sm font-black transition ${
                  isActive
                    ? "border-[#FECE00] bg-yellow-50 text-slate-950"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                } ${FOCUS_VISIBLE_CLASS}`}
              >
                <span className="max-w-[220px] truncate">{grupo.label}</span>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1 text-xs text-slate-700">
                  {grupo.productos.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ToolbarButton({
  danger = false,
  disabled = false,
  icon: Icon,
  iconClassName = "",
  label,
  onClick
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: typeof Plus;
  iconClassName?: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
        danger ? "border-red-800 bg-red-700 hover:bg-red-800" : "border-slate-900 bg-slate-900 hover:bg-black"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      <Icon className={`h-5 w-5 ${iconClassName}`} aria-hidden="true" />
      {label}
    </button>
  );
}
