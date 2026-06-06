import { Printer, Search, Volume2 } from "lucide-react";
import { FILTROS, formatCurrency } from "../../utils/pdv";
import { CategoryButton, PAYMENT_OPTIONS, ProductCard, Toast } from "./PdvShared";
import { usePdvViewContext } from "./PdvViewContext";

function PdvNormalView() {
  const {
    addProduct,
    cardBorder,
    decreaseProduct,
    feedback,
    feedbackRef,
    handlePrint,
    handleReadPedidoSummary,
    handleSubmit,
    increaseProduct,
    isAccessible,
    isHighContrast,
    items,
    loadingError,
    loadingProductos,
    metodoPago,
    observacion,
    openResetConfirm,
    panelBg,
    pedidoDetalles,
    puedeRegistrar,
    productosFiltrados,
    quickActionButtonClass,
    quickActionIconButtonClass,
    removeProduct,
    resetPedido,
    searchTerm,
    selectedCategory,
    selectMetodoPago,
    sending,
    setObservacion,
    setSearchTerm,
    setSelectedCategory,
    setShowResetConfirm,
    showResetConfirm,
    total
  } = usePdvViewContext();

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className={`rounded-[22px] ${cardBorder} p-5 ${panelBg} print:hidden no-print`}>
        <div className="mb-5">
          <h2 className="font-black mb-3 text-lg">Filtrar por categoría</h2>
          <div className="flex flex-wrap gap-2">
            {FILTROS.map((filtro) => (
              <CategoryButton
                key={filtro.value}
                filtro={filtro}
                active={selectedCategory === filtro.value}
                isAccessible={isAccessible}
                isHighContrast={isHighContrast}
                onClick={() => setSelectedCategory(filtro.value)}
              />
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="searchProducto" className="block font-bold mb-2 text-sm">
            <span className="inline-flex items-center gap-2 contrast-important">
              <Search className={`h-4 w-4 ${isHighContrast ? "text-current" : "text-black"}`} aria-hidden="true" />
              <span>Buscar producto</span>
            </span>
          </label>
          <input
            id="searchProducto"
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none transition focus:ring-2 focus:ring-blue-400 contrast-input"
          />
        </div>

        <div className="space-y-5">
          {!loadingProductos && productosFiltrados.length === 0 && !loadingError ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-bold text-base">No hay productos en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:[grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
              {productosFiltrados.map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  cantidad={items[producto.id] || 0}
                  isAccessible={isAccessible}
                  isHighContrast={isHighContrast}
                  onIncrease={() => increaseProduct(producto)}
                  onDecrease={() => decreaseProduct(producto)}
                  onAdd={() => addProduct(producto)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className={`rounded-[22px] ${cardBorder} p-6 ${panelBg} h-fit sticky top-6 print:static print:p-0 print:border-0 print:rounded-none print:bg-transparent`}>
        <div className="mb-5 flex flex-col gap-3">
          <h2 className="font-black text-lg">Resumen del pedido</h2>
          <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_48px] items-center gap-3 no-print print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              disabled={pedidoDetalles.length === 0}
              className={`w-full min-w-0 ${quickActionButtonClass} ${pedidoDetalles.length === 0 ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <Printer className={`h-4 w-4 shrink-0 ${isHighContrast ? "text-current" : "text-slate-700"}`} aria-hidden="true" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={handleReadPedidoSummary}
              className={`w-full min-w-0 ${quickActionButtonClass}`}
              aria-label="Leer resumen del pedido"
              title="Leer resumen del pedido"
            >
              <span className="inline-flex items-center gap-2">
                <Volume2 className={`h-4 w-4 ${isHighContrast ? "text-current" : "text-black"}`} aria-hidden="true" />
                <span>Leer</span>
              </span>
            </button>
            <button
              type="button"
              onClick={openResetConfirm}
              disabled={pedidoDetalles.length === 0}
              className={`justify-self-end ${quickActionIconButtonClass} ${pedidoDetalles.length === 0 ? "cursor-not-allowed opacity-40" : ""}`}
              title="Vaciar pedido"
              aria-label="Vaciar pedido"
            >
              🗑
            </button>
          </div>
        </div>

        {showResetConfirm && (
          <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 no-print print:hidden ${isHighContrast ? "contrast-panel-soft" : "border-red-200 bg-red-50"}`}>
            <p className="font-bold text-sm">¿Está seguro de borrar el pedido?</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={resetPedido}
                className={`rounded-lg border px-4 py-2 font-bold transition ${
                  isHighContrast
                    ? "contrast-button-danger"
                    : "border-red-700 bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                Sí, borrar
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className={quickActionButtonClass}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {feedback && (
          <div
            ref={feedbackRef}
            tabIndex={-1}
            role={feedback.type === "success" ? "status" : "alert"}
            aria-live="polite"
            className="mb-6 min-w-0 outline-none"
          >
            <Toast
              feedback={feedback}
              isAccessible={isAccessible}
              isHighContrast={isHighContrast}
              className="w-full"
            />
          </div>
        )}

        <div className="mb-5 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-5">
          {pedidoDetalles.length === 0 ? (
            <p className="text-center font-bold text-slate-500 text-base">
              Sin productos seleccionados
            </p>
          ) : (
            <div className="space-y-3">
              {pedidoDetalles.map((item) => (
                <div
                  key={item.productoId}
                  className="rounded-xl p-4 flex items-start justify-between gap-3 bg-white border border-slate-200"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-950 text-sm">
                      {item.producto.nombre}
                    </p>
                    <p className="text-slate-600 text-xs">
                      {item.cantidad} x {formatCurrency(item.producto.precio)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="font-bold text-sm">
                      {formatCurrency(item.subtotal)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeProduct(item.productoId)}
                      className="text-lg p-1 rounded transition hover:opacity-70 hover:bg-red-50"
                      title={`Eliminar ${item.producto.nombre}`}
                      aria-label={`Eliminar ${item.producto.nombre} del pedido`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-5 rounded-xl bg-[#FFF8DC] border border-[#FFF4BF] p-5">
          <p className={`text-slate-600 font-semibold text-xs uppercase ${isHighContrast ? "contrast-secondary-text" : ""}`}>Total a pagar</p>
          <p className={`mt-2 font-black text-3xl text-amber-700 ${isHighContrast ? "contrast-important" : ""}`}>
            {formatCurrency(total)}
          </p>
        </div>

        <div className="mb-5 space-y-3">
          <h3 className="font-bold text-base">Método de pago</h3>
          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_OPTIONS.map((option) => {
              const active = metodoPago === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectMetodoPago(option.value)}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 font-bold transition focus:outline-none focus:ring-4 focus:ring-slate-900 focus:ring-offset-2 ${
                    active
                      ? "bg-slate-600 text-white border-2 border-slate-600"
                      : "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50"
                  }`}
                  aria-pressed={active}
                >
                  <option.Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  <span className="text-xs">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="observacion" className="block font-bold mb-2 text-sm">
            <span className="contrast-important">Observación</span>
          </label>
          <textarea
            id="observacion"
            rows={3}
            value={observacion}
            onChange={(event) => setObservacion(event.target.value)}
            placeholder="Ej: sin cebolla, extra salsa..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:ring-2 focus:ring-[#2F5FE3] contrast-input min-h-[72px]"
          />
        </div>

        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!puedeRegistrar}
            className={`w-full rounded-lg border-2 font-bold transition py-3 ${
              puedeRegistrar
                ? "border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-800 min-h-[56px]"
                : "border-slate-300 bg-slate-300 text-slate-500 cursor-not-allowed min-h-[56px]"
            } ${isHighContrast && puedeRegistrar ? "contrast-button-success" : ""}`}
          >
            {sending ? "Registrando..." : "Registrar pedido"}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default PdvNormalView;
