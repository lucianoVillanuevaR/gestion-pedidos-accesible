import { Accessibility, AlertTriangle, ClipboardPlus, LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { formatCurrency, type ProductoConCategoria } from "../../utils/pdv";
import { FOCUS_VISIBLE_CLASS } from "../pedidos/PedidosShared";
import { CATEGORIAS_CATALOGO, type CategoriaCatalogo } from "./ProductosShared";
import { useProductosCatalog } from "./hooks/useProductosCatalog";

type CategoriaFacil = CategoriaCatalogo | "Todos";

const CATEGORIAS_FACIL: Array<{ label: string; value: CategoriaFacil }> = [
  { label: "Todos", value: "Todos" },
  ...CATEGORIAS_CATALOGO.filter((categoria) => categoria.value !== "Otros")
];

function ProductosFacilPage() {
  const navigate = useNavigate();
  const { isHighContrast, isPanelOpen, openAccessibilityPanel } = useAccessibilityContext();
  const [selectedCategory, setSelectedCategory] = useState<CategoriaFacil>("Todos");
  const [selectedProducto, setSelectedProducto] = useState<ProductoConCategoria | null>(null);
  const {
    error,
    isLoading,
    loadProductos,
    productosConCategoria
  } = useProductosCatalog({ includeUnavailable: true });

  const productosFiltrados = selectedCategory === "Todos"
    ? productosConCategoria
    : selectedCategory === "Destacados"
      ? productosConCategoria.filter((producto) => producto.destacado)
      : productosConCategoria.filter((producto) => producto.categoria === selectedCategory);

  const headerBg = isHighContrast
    ? "bg-black text-white border-b-2 border-yellow-400"
    : "bg-slate-900 text-white border-b border-slate-700";
  const pageBg = isHighContrast ? "bg-black" : "bg-white";
  const panelClass = isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white";

  const handleUseProduct = (producto: ProductoConCategoria) => {
    if (producto.disponible === false) {
      return;
    }

    navigate("/pdv/facil", { state: { productoId: producto.id } });
  };

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className={headerBg}>
        <div className="mx-auto flex min-h-[84px] w-full max-w-[1520px] flex-wrap items-center justify-between gap-4 px-3 py-3 sm:px-4 lg:px-5 xl:px-6">
          <h1 className="text-3xl font-black leading-none tracking-tight contrast-important">
            Productos
          </h1>
          <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
            <Link
              to="/pdv/facil"
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-lg font-black no-underline transition ${
                isHighContrast ? "contrast-button-secondary" : "border-white bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <ClipboardPlus className="h-6 w-6" aria-hidden="true" />
              Ir a Nuevo Pedido
            </Link>
            <button
              type="button"
              onClick={openAccessibilityPanel}
              aria-haspopup="dialog"
              aria-expanded={isPanelOpen}
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-lg font-black transition ${
                isHighContrast ? "contrast-button-secondary" : "border-white bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <Accessibility className="h-6 w-6" aria-hidden="true" />
              Accesibilidad
            </button>
            <button
              type="button"
              onClick={loadProductos}
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-lg font-black transition ${
                isHighContrast ? "contrast-button-secondary" : "border-white bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <RefreshCw className="h-6 w-6" aria-hidden="true" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1520px] space-y-5 px-3 py-6 sm:px-4 lg:px-5 xl:px-6">
        <AccessibleIntroCard isHighContrast={isHighContrast} />

        <section className={`rounded-[26px] p-4 sm:p-5 ${panelClass}`} aria-label="Categorías de productos">
          <div className="flex flex-wrap gap-4">
            {CATEGORIAS_FACIL.map((categoria) => {
              const isActive = selectedCategory === categoria.value;

              return (
                <button
                  key={categoria.value}
                  type="button"
                  onClick={() => setSelectedCategory(categoria.value)}
                  aria-pressed={isActive}
                  className={`min-h-[66px] rounded-2xl border-2 px-6 text-xl font-black transition ${
                    isHighContrast
                      ? isActive
                        ? "contrast-button-primary"
                        : "contrast-button-secondary"
                      : isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-900 hover:border-slate-900 hover:bg-slate-50"
                  } ${FOCUS_VISIBLE_CLASS}`}
                >
                  {categoria.label}
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <div className={`flex items-start gap-3 rounded-2xl border p-4 ${isHighContrast ? "contrast-panel" : "border-red-200 bg-red-50 text-red-950"}`} role="alert">
            <AlertTriangle className="mt-1 h-6 w-6" aria-hidden="true" />
            <p className="text-lg font-black">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className={`flex min-h-[260px] items-center justify-center rounded-[26px] ${panelClass}`}>
            <LoaderCircle className="h-9 w-9 animate-spin" aria-hidden="true" />
            <span className="ml-3 text-xl font-black">Cargando productos...</span>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <EmptyProductosFacil onShowAll={() => setSelectedCategory("Todos")} isHighContrast={isHighContrast} />
        ) : (
          <section className="grid gap-5 xl:grid-cols-2" aria-label="Productos del menú">
            {productosFiltrados.map((producto) => (
              <ProductoFacilCard
                key={producto.id}
                isHighContrast={isHighContrast}
                onShowDetail={setSelectedProducto}
                onUseProduct={handleUseProduct}
                producto={producto}
              />
            ))}
          </section>
        )}

        {selectedProducto && (
          <ProductoDetailModal
            isHighContrast={isHighContrast}
            onClose={() => setSelectedProducto(null)}
            onUseProduct={handleUseProduct}
            producto={selectedProducto}
          />
        )}
      </main>
    </div>
  );
}

function AccessibleIntroCard({ isHighContrast }: { isHighContrast: boolean }) {
  return (
    <header className={`rounded-3xl p-6 sm:p-8 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}>
      <p className={`text-sm font-black uppercase tracking-[0.18em] ${isHighContrast ? "contrast-secondary-text" : "text-slate-500"}`}>
        Riquísimo · Modo Fácil
      </p>
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[2.35rem] font-black leading-tight tracking-tight text-slate-950">
            Productos del menú
          </h2>
          <p className={`mt-3 max-w-3xl text-xl font-semibold leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-600"}`}>
            Revisa los productos disponibles usando categorías grandes y botones simples.
          </p>
        </div>
        <p className={`rounded-2xl border-2 px-5 py-4 text-xl font-black ${isHighContrast ? "border-yellow-400 text-white" : "border-slate-900 bg-slate-50 text-slate-950"}`}>
          Catálogo simple
        </p>
      </div>
    </header>
  );
}

function ProductoFacilCard({
  isHighContrast,
  onShowDetail,
  onUseProduct,
  producto
}: {
  isHighContrast: boolean;
  onShowDetail: (producto: ProductoConCategoria) => void;
  onUseProduct: (producto: ProductoConCategoria) => void;
  producto: ProductoConCategoria;
}) {
  const isAvailable = producto.disponible !== false;

  return (
    <article className={`flex h-full flex-col rounded-[26px] p-5 sm:p-6 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}>
      <div className="flex flex-1 flex-col gap-5 sm:flex-row">
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.altText ?? producto.nombre}
            className="h-36 w-full rounded-2xl border-2 border-slate-200 object-cover sm:h-40 sm:w-44"
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center rounded-2xl border-2 border-slate-300 bg-[#FFF8DC] text-xl font-black text-slate-950 sm:h-40 sm:w-44">
            Sin imagen
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black text-slate-600">{producto.categoria}</p>
          <h3 className="mt-1 text-3xl font-black leading-tight text-slate-950">{producto.nombre}</h3>
          {producto.destacado && <p className="mt-3 text-xl font-black text-blue-700">Destacado</p>}
          <p className="mt-3 overflow-hidden text-lg font-semibold leading-relaxed text-slate-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {producto.descripcion || "Producto disponible en el menú."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <p className="text-4xl font-black text-slate-950">{formatCurrency(producto.precio)}</p>
            <p className={`rounded-full border-2 px-4 py-2 text-lg font-black ${
              isAvailable
                ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                : "border-red-700 bg-red-50 text-red-800"
            }`}>
              {isAvailable ? "Disponible" : "No disponible"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onShowDetail(producto)}
          className={`min-h-[66px] rounded-2xl border-2 px-5 text-xl font-black transition ${
            isHighContrast ? "contrast-button-secondary" : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
          } ${FOCUS_VISIBLE_CLASS}`}
        >
          Ver detalle
        </button>
        <button
          type="button"
          onClick={() => onUseProduct(producto)}
          disabled={!isAvailable}
          className={`min-h-[66px] rounded-2xl border-2 px-5 text-xl font-black transition ${
            isHighContrast ? "contrast-button-primary" : "border-slate-900 bg-slate-900 text-white hover:bg-black"
          } disabled:cursor-not-allowed disabled:border-slate-400 disabled:bg-slate-200 disabled:text-slate-600 ${FOCUS_VISIBLE_CLASS}`}
        >
          Usar en pedido
        </button>
      </div>
    </article>
  );
}

function ProductoDetailModal({
  isHighContrast,
  onClose,
  onUseProduct,
  producto
}: {
  isHighContrast: boolean;
  onClose: () => void;
  onUseProduct: (producto: ProductoConCategoria) => void;
  producto: ProductoConCategoria;
}) {
  const isAvailable = producto.disponible !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="producto-facil-title"
        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] p-6 shadow-2xl ${
          isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"
        }`}
      >
        <h2 id="producto-facil-title" className="text-4xl font-black leading-tight text-slate-950">
          {producto.nombre}
        </h2>
        {producto.imagen && (
          <img
            src={producto.imagen}
            alt={producto.altText ?? producto.nombre}
            className="mt-5 h-56 w-full rounded-2xl border-2 border-slate-200 object-cover"
          />
        )}
        <div className="mt-5 rounded-2xl border-2 border-slate-300 bg-slate-50 p-5">
          <p className="text-xl font-black text-slate-700">Categoría: {producto.categoria}</p>
          {producto.destacado && <p className="mt-2 text-xl font-black text-blue-700">Producto destacado</p>}
          <p className="mt-3 text-xl font-semibold leading-relaxed text-slate-700">
            {producto.descripcion || "Sin descripción adicional."}
          </p>
          <p className="mt-5 text-4xl font-black text-slate-950">{formatCurrency(producto.precio)}</p>
          <p className={`mt-3 text-xl font-black ${isAvailable ? "text-emerald-800" : "text-red-800"}`}>
            {isAvailable ? "Disponible" : "No disponible"}
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onUseProduct(producto)}
            disabled={!isAvailable}
            className={`min-h-[66px] rounded-2xl border-2 px-5 text-xl font-black transition ${
              isHighContrast ? "contrast-button-primary" : "border-slate-900 bg-slate-900 text-white hover:bg-black"
            } disabled:cursor-not-allowed disabled:border-slate-400 disabled:bg-slate-200 disabled:text-slate-600 ${FOCUS_VISIBLE_CLASS}`}
          >
            Usar en pedido
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[66px] rounded-2xl border-2 px-5 text-xl font-black transition ${
              isHighContrast ? "contrast-button-secondary" : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            Volver
          </button>
        </div>
      </section>
    </div>
  );
}

function EmptyProductosFacil({
  isHighContrast,
  onShowAll
}: {
  isHighContrast: boolean;
  onShowAll: () => void;
}) {
  return (
    <div className={`rounded-[26px] p-8 text-center ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}>
      <p className="text-3xl font-black text-slate-950">No hay productos en esta categoría</p>
      <p className="mt-3 text-xl font-semibold text-slate-600">Elige otra categoría para seguir revisando el menú.</p>
      <button
        type="button"
        onClick={onShowAll}
        className={`mt-6 min-h-[66px] rounded-2xl border-2 px-8 text-xl font-black transition ${
          isHighContrast ? "contrast-button-primary" : "border-slate-900 bg-slate-900 text-white hover:bg-black"
        } ${FOCUS_VISIBLE_CLASS}`}
      >
        Ver todos
      </button>
    </div>
  );
}

export default ProductosFacilPage;
