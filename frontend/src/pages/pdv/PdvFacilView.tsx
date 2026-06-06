import { Accessibility, CheckCircle2, XCircle } from "lucide-react";
import { FILTROS, formatCurrency } from "../../utils/pdv";
import { ACCESSIBLE_STEP_COUNT, PAYMENT_OPTIONS, ProductCard } from "./PdvShared";
import { usePdvViewContext } from "./PdvViewContext";

function PdvFacilView() {
  const {
    accessibleObservationPlaceholder,
    accessibleObservationType,
    accessibleProductos,
    accessibleStep,
    addProduct,
    cardBorder,
    decreaseProduct,
    feedback,
    goNextAccessibleStep,
    goPrevAccessibleStep,
    handlePrint,
    handleSubmit,
    increaseProduct,
    isHighContrast,
    isPanelOpen,
    items,
    metodoPago,
    navigate,
    observacion,
    openAccessibilityPanel,
    panelBg,
    pedidoDetalles,
    puedeRegistrar,
    removeProduct,
    selectedCategory,
    selectMetodoPago,
    sending,
    setAccessibleObservationType,
    setAccessibleStep,
    setObservacion,
    setSelectedCategory,
    total
  } = usePdvViewContext();

  const stepGuidance = [
    {
      title: "Elige una categoría",
      description: "Toca una sola categoría para ver solo lo necesario y seguir sin perderte."
    },
    {
      title: "Elige un producto",
      description: "Selecciona un producto y usa los botones grandes para indicar la cantidad."
    },
    {
      title: "Revisa tu pedido",
      description: "Confirma lo que elegiste antes de seguir al siguiente paso."
    },
    {
      title: "Agrega un comentario",
      description: "Este paso es opcional. Solo úsalo si realmente necesitas dejar una nota."
    },
    {
      title: "Selecciona el pago",
      description: "Escoge un método de pago con una sola pulsación."
    },
    {
      title: "Registrar pedido",
      description: "Revisa todo y presiona el botón principal para finalizar."
    }
  ][accessibleStep - 1];

  return (
    <div className="space-y-5">
      <header className={`rounded-3xl ${cardBorder} p-6 sm:p-8 ${panelBg}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className={`text-sm font-black uppercase tracking-[0.18em] ${isHighContrast ? "contrast-secondary-text" : "text-slate-500"}`}>
              Riquísimo · Modo Fácil
            </p>
            <h1 className="mt-3 font-black tracking-tight text-[2rem] sm:text-[2.35rem]">
              {stepGuidance.title}
            </h1>
            <p className={`mt-3 max-w-2xl text-lg leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-600"}`}>
              {stepGuidance.description}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3">
            <div className={`inline-flex min-h-[56px] items-center rounded-2xl border px-4 py-3 ${isHighContrast ? "contrast-panel-soft border-yellow-400" : "border-slate-900 bg-slate-900 text-white"}`}>
              <p className="font-black">
                Paso {accessibleStep} de {ACCESSIBLE_STEP_COUNT}
              </p>
            </div>

            <button
              type="button"
              onClick={openAccessibilityPanel}
              aria-haspopup="dialog"
              aria-expanded={isPanelOpen}
              className={`inline-flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border px-4 py-3 font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
                isHighContrast
                  ? "contrast-button-secondary"
                  : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-slate-900"
              }`}
            >
              <Accessibility aria-hidden="true" className="h-6 w-6" />
              <span>Accesibilidad</span>
            </button>
          </div>
        </div>
      </header>

      {feedback && (
        <div className={`rounded-2xl ${cardBorder} p-4 ${feedback.type === "success" ? "bg-emerald-50 border-emerald-300" : "bg-red-50 border-red-300"}`} role={feedback.type === "success" ? "status" : "alert"} aria-live="polite">
          <div className="flex items-center justify-center gap-3">
            <span className={`shrink-0 ${feedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              ) : (
                <XCircle className="h-6 w-6" aria-hidden="true" />
              )}
            </span>
            <p className="font-bold text-lg">{feedback.message}</p>
          </div>
        </div>
      )}

      {accessibleStep === 1 && (
        <section aria-labelledby="step1" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step1" className="font-black text-2xl mb-4">Paso 1: Elige categoría</h2>
          <div className="grid grid-cols-2 gap-4">
            {FILTROS.map((filtro) => (
              <button
                key={filtro.value}
                type="button"
                onClick={() => {
                  setSelectedCategory(filtro.value);
                  setAccessibleStep(2);
                }}
                className={`min-h-[56px] rounded-xl font-bold text-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-4 ${
                  selectedCategory === filtro.value ? "bg-slate-900 text-white border-2 border-slate-900" : "bg-white text-slate-900 border-2 border-slate-300"
                } ${isHighContrast ? (selectedCategory === filtro.value ? "contrast-button-primary" : "contrast-button-secondary") : ""}`}
                aria-pressed={selectedCategory === filtro.value}
              >
                <span>{filtro.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="mb-3 text-base font-semibold text-slate-600">Accesos rápidos</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate("/pedidos/facil")}
                className={`min-h-[56px] rounded-xl border-2 px-4 py-3 text-lg font-bold transition ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-900"
                }`}
              >
                Ir a Pedidos
              </button>

              <button
                type="button"
                onClick={() => navigate("/productos")}
                className={`min-h-[56px] rounded-xl border-2 px-4 py-3 text-lg font-bold transition ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-900"
                }`}
              >
                Ir a Productos
              </button>
            </div>
          </div>
        </section>
      )}

      {accessibleStep === 2 && (
        <section aria-labelledby="step2" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step2" className="font-black text-2xl mb-4">Paso 2: Elige productos</h2>
          <p className="mb-3 text-lg font-semibold">Elige el producto y responde: ¿cuánto quieres?</p>
          <p className="mb-4 text-base text-slate-600">Usa los botones de menos y más para ajustar la cantidad.</p>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {accessibleProductos.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed p-8 text-center col-span-2">
                <p className="font-bold text-lg">No hay productos en esta categoría.</p>
                <p className="mt-2">Prueba otra categoría o selecciona "Todos".</p>
                <div className="mt-4 flex justify-center">
                  <button type="button" onClick={() => setAccessibleStep(1)} className={`rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Volver a categorías</button>
                </div>
              </div>
            ) : (
              accessibleProductos.map((producto) => (
                <div key={producto.id}>
                  <ProductCard
                    producto={producto}
                    cantidad={items[producto.id] || 0}
                    isAccessible
                    isHighContrast={isHighContrast}
                    onIncrease={() => increaseProduct(producto)}
                    onDecrease={() => decreaseProduct(producto)}
                    onAdd={() => addProduct(producto)}
                  />
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={goPrevAccessibleStep} className={`rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Atrás</button>
            <button type="button" onClick={goNextAccessibleStep} className={`ml-auto rounded-lg bg-slate-900 py-3 px-4 font-bold text-white ${isHighContrast ? "contrast-button-primary" : ""}`}>Continuar</button>
          </div>
        </section>
      )}

      {accessibleStep === 3 && (
        <section aria-labelledby="step3" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step3" className="font-black text-2xl mb-4">Paso 3: Revisa tu pedido</h2>
          {pedidoDetalles.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-8 text-center">
              <p className="font-bold text-lg">Todavía no hay productos agregados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidoDetalles.map((item) => (
                <div key={item.productoId} className="rounded-lg p-4 bg-white border-2 border-slate-300 flex items-center justify-between">
                  <div>
                    <p className="font-black text-lg">{item.producto.nombre}</p>
                    <p className="text-slate-600">{item.cantidad} x {formatCurrency(item.producto.precio)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-black text-lg">{formatCurrency(item.subtotal)}</p>
                    <button type="button" onClick={() => { removeProduct(item.productoId); }} className="rounded-lg bg-red-50 p-3 text-xl">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <p className="font-semibold">Subtotal: {formatCurrency(total)}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={goPrevAccessibleStep} className={`rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Atrás</button>
            <button type="button" onClick={goNextAccessibleStep} disabled={pedidoDetalles.length === 0} className={`ml-auto rounded-lg py-3 px-4 font-bold ${pedidoDetalles.length === 0 ? "bg-slate-300 text-slate-500" : "bg-slate-900 text-white"} ${isHighContrast && pedidoDetalles.length > 0 ? "contrast-button-primary" : ""}`}>Continuar</button>
          </div>
        </section>
      )}

      {accessibleStep === 4 && (
        <section aria-labelledby="step4" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step4" className="font-black text-2xl mb-4">Paso 4: Agrega comentario</h2>
          <p className="mb-3 text-lg font-semibold">Puedes dejar una nota para cocina o para el cliente.</p>
          <p className="mb-4 text-base text-slate-600">Este paso es opcional. Si no necesitas comentario, puedes continuar igual.</p>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAccessibleObservationType("cocina")}
              className={`rounded-xl border-2 px-4 py-4 text-left font-bold transition ${
                accessibleObservationType === "cocina"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              }`}
              aria-pressed={accessibleObservationType === "cocina"}
            >
              <span className="block text-lg">Para cocina</span>
              <span className={`mt-1 block text-sm ${accessibleObservationType === "cocina" ? "text-white/80" : "text-slate-500"}`}>
                Instrucciones de preparacion
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAccessibleObservationType("cliente")}
              className={`rounded-xl border-2 px-4 py-4 text-left font-bold transition ${
                accessibleObservationType === "cliente"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              }`}
              aria-pressed={accessibleObservationType === "cliente"}
            >
              <span className="block text-lg">Para cliente</span>
              <span className={`mt-1 block text-sm ${accessibleObservationType === "cliente" ? "text-white/80" : "text-slate-500"}`}>
                Indicaciones de entrega o retiro
              </span>
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="accessibleObservacion" className="mb-2 block font-bold text-base">
              Comentario
            </label>
            <textarea
              id="accessibleObservacion"
              rows={4}
              value={observacion}
              onChange={(event) => setObservacion(event.target.value)}
              placeholder={accessibleObservationPlaceholder}
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900 focus:ring-offset-2"
            />
          </div>

          {observacion.trim() && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {accessibleObservationType === "cocina" ? "Comentario para cocina" : "Comentario para cliente"}
              </p>
              <p className="mt-2 font-medium text-slate-900">{observacion}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={goPrevAccessibleStep} className={`rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Atrás</button>
            <button type="button" onClick={goNextAccessibleStep} className={`ml-auto rounded-lg bg-slate-900 py-3 px-4 font-bold text-white ${isHighContrast ? "contrast-button-primary" : ""}`}>Continuar</button>
          </div>
        </section>
      )}

      {accessibleStep === 5 && (
        <section aria-labelledby="step5" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step5" className="font-black text-2xl mb-4">Paso 5: Método de pago</h2>
          <div className="space-y-3">
            {PAYMENT_OPTIONS.map((option) => {
              const active = metodoPago === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectMetodoPago(option.value)}
                  className={`w-full flex items-center justify-between rounded-xl py-4 px-4 font-bold ${active ? "bg-slate-900 text-white" : "bg-white text-slate-900 border-2 border-slate-300"}`}
                  aria-pressed={active}
                >
                  <option.Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  <span>{option.label}</span>
                  {active && <span className="text-sm">Seleccionado</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={goPrevAccessibleStep} className={`rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Atrás</button>
            <button type="button" onClick={goNextAccessibleStep} disabled={metodoPago === ""} className={`ml-auto rounded-lg py-3 px-4 font-bold ${metodoPago === "" ? "bg-slate-300 text-slate-500" : "bg-slate-900 text-white"} ${isHighContrast && metodoPago !== "" ? "contrast-button-primary" : ""}`}>Continuar</button>
          </div>
        </section>
      )}

      {accessibleStep === 6 && (
        <section aria-labelledby="step6" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step6" className="font-black text-2xl mb-4">Paso 6: Registrar pedido</h2>
          <p className="mb-4">Verifica y confirma. Luego presiona Registrar pedido.</p>

          <div className="rounded-xl bg-white border-2 border-slate-300 p-4 mb-4">
            <p className="font-bold">Total a pagar</p>
            <p className="font-black text-3xl">{formatCurrency(total)}</p>
          </div>

          {observacion.trim() && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-4">
              <p className="font-bold text-slate-900">
                {accessibleObservationType === "cocina" ? "Comentario para cocina" : "Comentario para cliente"}
              </p>
              <p className="mt-2 text-slate-700">{observacion}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={goPrevAccessibleStep} className={`rounded-lg bg-white border-2 border-slate-900 py-4 px-6 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Atrás</button>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                disabled={pedidoDetalles.length === 0}
                className={`rounded-lg border-2 py-4 px-6 font-bold text-lg transition ${
                  pedidoDetalles.length === 0
                    ? "border-slate-300 bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "border-slate-900 bg-white text-slate-900 hover:bg-slate-100"
                } ${isHighContrast && pedidoDetalles.length > 0 ? "contrast-button-secondary" : ""}`}
                style={{ minHeight: 64 }}
              >
                🖨 Imprimir comanda
              </button>
              <button type="button" onClick={handleSubmit} disabled={!puedeRegistrar} className={`rounded-lg border-2 py-4 px-6 font-black text-lg ${puedeRegistrar ? "border-emerald-900 bg-emerald-700 text-white hover:bg-emerald-800" : "border-slate-300 bg-slate-300 text-slate-500"} ${isHighContrast && puedeRegistrar ? "contrast-button-success" : ""}`} style={{ minHeight: 64 }}>
                {sending ? "Registrando..." : "Registrar pedido"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default PdvFacilView;
