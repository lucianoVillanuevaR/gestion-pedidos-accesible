import { Check, Search } from "lucide-react";
import PdvFeedbackMessage from "./PdvFeedbackMessage";
import { usesProductConfigurator } from "../PdvShared";
import PdvProductTile from "./PdvProductTile";
import { usePdvViewContext } from "../PdvViewContext";

function PdvCatalogPanel() {
  const {
    addProduct,
    announceSearchBar,
    categoryFilters,
    decreaseProduct,
    feedback,
    feedbackRef,
    increaseProduct,
    isHighContrast,
    isTurnoOpen,
    items,
    loadingError,
    loadingProductos,
    productosFiltrados,
    searchTerm,
    selectedCategory,
    selectCategory,
    setSearchTerm
  } = usePdvViewContext();

  const selectedCategoryLabel =
    categoryFilters.find((filtro) => filtro.value === selectedCategory)?.label ?? "Productos";
  const isCloseTurnoBlockedFeedback =
    feedback?.type === "error" &&
    feedback.message.startsWith("No puedes cerrar el turno mientras existan pedidos activos");

  return (
    <>
      <nav
        className="hidden min-h-0 min-w-0 overflow-x-hidden overflow-y-auto border-r border-slate-200 bg-slate-50 print:hidden xl:block"
        aria-label="Categorías de productos"
      >
        <div className="sticky top-0">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black uppercase text-slate-950">
            Categorías
          </div>
          <div className="divide-y divide-slate-200">
            {categoryFilters.map((filtro) => {
              const isSelected = selectedCategory === filtro.value;

              return (
                <button
                  key={filtro.value}
                  type="button"
                  onClick={() => selectCategory(filtro.value, filtro.label)}
                  className={`pdv-category-option group flex min-h-[2.75rem] w-full touch-manipulation items-center gap-2.5 px-3 py-2.5 text-left text-sm font-bold uppercase transition-colors duration-200 motion-reduce:transition-none focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-slate-950 ${
                    isHighContrast
                      ? isSelected
                        ? "contrast-button-primary border-l-[6px] border-l-slate-950 shadow-inner"
                        : "contrast-button-secondary"
                      : isSelected
                        ? "border-l-[6px] border-l-slate-950 bg-[#FECE00] text-slate-950 shadow-sm hover:bg-[#FFD633] active:bg-[#FECE00] active:shadow-inner"
                        : "bg-white text-slate-900 hover:bg-[#111827] hover:text-white active:bg-black active:text-white active:shadow-inner"
                  }`}
                  aria-current={isSelected ? "page" : undefined}
                  aria-pressed={isSelected}
                >
                  <span className="min-w-0 flex-1 whitespace-normal break-normal leading-tight [hyphens:none]">
                    {filtro.label}
                  </span>
                  {isSelected && (
                    <span className="flex shrink-0 self-center items-center" aria-hidden="true">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                  {isSelected && <span className="sr-only">Seleccionada</span>}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <section className="flex min-h-0 min-w-0 flex-col bg-slate-100 print:hidden no-print">
        <div className="shrink-0 border-b border-slate-200 bg-slate-100 px-3 py-1.5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="searchProducto" className="relative block w-full lg:max-w-[360px]">
                <span className="sr-only">Buscar producto</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700"
                  aria-hidden="true"
                />
                <input
                  id="searchProducto"
                  type="text"
                  placeholder="Buscar producto"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onClick={announceSearchBar}
                  onFocus={announceSearchBar}
                  aria-label="Barra de búsqueda de productos"
                  className="min-h-[2.75rem] w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 contrast-input"
                />
              </label>
            </div>
          </div>

          <div className="mt-2 flex max-w-full gap-2 overflow-x-auto pb-1 xl:hidden">
            {categoryFilters.map((filtro) => {
              const isSelected = selectedCategory === filtro.value;

              return (
                <button
                  key={filtro.value}
                  type="button"
                  onClick={() => selectCategory(filtro.value, filtro.label)}
                  className={`pdv-category-option min-h-[2.25rem] shrink-0 touch-manipulation whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-black uppercase leading-tight transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-950 focus-visible:ring-offset-2 ${
                    isHighContrast
                      ? isSelected
                        ? "contrast-button-primary"
                        : "contrast-button-secondary"
                      : isSelected
                        ? "border-[#FECE00] bg-[#FECE00] text-slate-950 hover:bg-[#FFD633] active:bg-[#FECE00] active:shadow-inner"
                        : "border-slate-300 bg-white text-slate-700 hover:border-black hover:bg-[#111827] hover:text-white active:border-black active:bg-black active:text-white active:shadow-inner"
                  }`}
                  aria-pressed={isSelected}
                >
                  {filtro.label}
                  {isSelected && <span className="sr-only">, seleccionada</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-visible px-3 py-4 sm:px-4 lg:overflow-y-auto"
          tabIndex={0}
          aria-label="Catálogo de productos desplazable"
        >
          {isCloseTurnoBlockedFeedback && feedback && (
            <div ref={feedbackRef} tabIndex={-1} className="mb-4 outline-none">
              <PdvFeedbackMessage feedback={feedback} isHighContrast={isHighContrast} className="w-full" />
            </div>
          )}
          <h2 className="mb-2 whitespace-normal break-normal text-xl font-black uppercase leading-tight text-slate-800 [hyphens:none]">
            {selectedCategoryLabel}
          </h2>
          {!loadingProductos && productosFiltrados.length === 0 && !loadingError ? (
            <div className="rounded-md border-2 border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-bold text-base">No hay productos en esta categoría</p>
            </div>
          ) : (
            <div className="pdv-product-grid grid min-w-0 items-stretch gap-2">
              {productosFiltrados.map((producto) => (
                <PdvProductTile
                  key={producto.id}
                  producto={producto}
                  cantidad={usesProductConfigurator(producto) ? 0 : items[producto.id] || 0}
                  disabled={!isTurnoOpen}
                  onIncrease={() => increaseProduct(producto)}
                  onDecrease={() => decreaseProduct(producto)}
                  onAdd={() => addProduct(producto)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default PdvCatalogPanel;
