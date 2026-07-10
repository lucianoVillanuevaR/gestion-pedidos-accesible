import { Search } from "lucide-react";
import PdvFeedbackMessage from "./PdvFeedbackMessage";
import { usesProductConfigurator } from "./PdvShared";
import PdvProductTile from "./PdvProductTile";
import { usePdvViewContext } from "./PdvViewContext";

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
        className="hidden min-h-0 border-r border-slate-200 bg-slate-50 print:hidden md:block"
        aria-label="Categorías de productos"
      >
        <div className="sticky top-0">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black uppercase text-slate-950">
            Categorías
          </div>
          <div className="divide-y divide-slate-200">
            {categoryFilters.map((filtro) => (
              <button
                key={filtro.value}
                type="button"
                onClick={() => selectCategory(filtro.value, filtro.label)}
                className={`flex min-h-[44px] w-full items-center justify-between px-3 text-left text-sm font-bold uppercase transition ${
                  selectedCategory === filtro.value
                    ? "bg-yellow-50 text-slate-950"
                    : "bg-slate-50 text-slate-800 hover:bg-white"
                } ${isHighContrast ? "contrast-button-secondary" : ""}`}
                aria-current={selectedCategory === filtro.value ? "page" : undefined}
              >
                <span className="truncate">{filtro.label}</span>
                {selectedCategory === filtro.value && <span className="text-lg leading-none">›</span>}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <section className="flex min-h-0 min-w-0 flex-col bg-slate-100 print:hidden no-print">
        <div className="shrink-0 border-b border-slate-200 bg-slate-100 px-3 py-1.5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="searchProducto" className="relative block w-full sm:max-w-[250px]">
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
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 contrast-input"
                />
              </label>
            </div>
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {categoryFilters.map((filtro) => (
              <button
                key={filtro.value}
                type="button"
                onClick={() => selectCategory(filtro.value, filtro.label)}
                className={`h-9 shrink-0 rounded-full border px-3 text-xs font-black uppercase ${
                  selectedCategory === filtro.value
                    ? "border-[#FECE00] bg-[#FECE00] text-slate-950"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {filtro.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {!isTurnoOpen && (
            <PdvFeedbackMessage
              className="mb-4"
              feedback={{
                type: "error",
                title: "Turno cerrado",
                message: "Abre turno para registrar pedidos."
              }}
              isHighContrast={isHighContrast}
            />
          )}
          {isCloseTurnoBlockedFeedback && feedback && (
            <div ref={feedbackRef} tabIndex={-1} className="mb-4 outline-none">
              <PdvFeedbackMessage feedback={feedback} isHighContrast={isHighContrast} className="w-full" />
            </div>
          )}
          <h2 className="mb-2 text-xl font-black uppercase text-slate-800">{selectedCategoryLabel}</h2>
          {!loadingProductos && productosFiltrados.length === 0 && !loadingError ? (
            <div className="rounded-md border-2 border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-bold text-base">No hay productos en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-7">
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
