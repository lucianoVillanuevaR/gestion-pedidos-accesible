import { AlertTriangle, CheckCircle2, ChefHat, ClipboardList, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { useState } from "react";
import EasyModeActions from "../../components/EasyModeActions";
import { PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH, sanitizeClienteNombreInput } from "../../validations/pedido.validation";
import { formatCurrency } from "../../utils/pdv";
import { ACCESSIBLE_STEP_COUNT, PAYMENT_OPTIONS, ProductCard, usesProductConfigurator } from "./PdvShared";
import PdvFeedbackMessage from "./PdvFeedbackMessage";
import { usePdvViewContext } from "./PdvViewContext";

function PdvFacilView() {
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isCloseTurnoConfirmOpen, setIsCloseTurnoConfirmOpen] = useState(false);
  const {
    accessibleProductos,
    accessibleStep,
    accessibleStepValidation,
    addProduct,
    cardBorder,
    categoryFilters,
    clienteNombre,
    decreaseProduct,
    feedback,
    goNextAccessibleStep,
    goPrevAccessibleStep,
    handlePrint,
    handleSubmit,
    handleToggleTurno,
    increaseProduct,
    isHighContrast,
    isTurnoOpen,
    items,
    metodoPago,
    navigate,
    panelBg,
    pedidoDetalles,
    puedeRegistrar,
    removeProduct,
    selectedCategory,
    selectMetodoPago,
    sending,
    setAccessibleStep,
    setClienteNombre,
    setSelectedCategory,
    total
  } = usePdvViewContext();

  const stepGuidance = !isTurnoOpen
    ? {
        title: "Abre turno",
        description: "Turno cerrado. Abre turno para registrar pedidos."
      }
    : [
        {
          title: "Elige una categoría",
          description: ""
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
          title: "Datos del comprador",
          description: "Ingresa el nombre del comprador."
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
  const visibleStepNumber = isTurnoOpen ? accessibleStep : 1;

  return (
    <div className="space-y-5">
      <header className={`rounded-3xl ${cardBorder} p-6 sm:p-8 ${panelBg}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p
              className={`text-sm font-black uppercase tracking-[0.18em] ${isHighContrast ? "contrast-secondary-text" : "text-slate-500"}`}
            >
              Riquísimo · Modo fácil
            </p>
            <h1 className="mt-3 font-black tracking-tight text-[2rem] sm:text-[2.35rem]">
              Paso {visibleStepNumber}: {stepGuidance.title}
            </h1>
            {stepGuidance.description && (
              <p
                className={`mt-3 max-w-2xl text-lg leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-600"}`}
              >
                {stepGuidance.description}
              </p>
            )}
            <p
              className={`mt-2 max-w-2xl text-lg font-bold ${isHighContrast ? "contrast-body-text" : "text-slate-700"}`}
            >
              Sigue los pasos para registrar un pedido.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3">
            <button
              type="button"
              onClick={() => {
                if (isTurnoOpen) {
                  setIsCloseTurnoConfirmOpen(true);
                  return;
                }

                handleToggleTurno();
              }}
              className={`inline-flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border px-4 py-3 font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
                isHighContrast
                  ? isTurnoOpen
                    ? "contrast-button-danger"
                    : "contrast-button-primary"
                  : isTurnoOpen
                    ? "border-red-800 bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700"
                    : "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-700"
              }`}
              aria-pressed={isTurnoOpen}
            >
              {isTurnoOpen ? (
                <LockKeyhole aria-hidden="true" className="h-6 w-6" />
              ) : (
                <UnlockKeyhole aria-hidden="true" className="h-6 w-6" />
              )}
              <span>{isTurnoOpen ? "Cerrar turno" : "Abrir turno"}</span>
            </button>

            <div
              className={`inline-flex min-h-[56px] items-center rounded-2xl border px-4 py-3 ${isHighContrast ? "contrast-panel-soft border-yellow-400" : "border-slate-900 bg-slate-900 text-white"}`}
            >
              <p className="font-black">
                Paso {visibleStepNumber} de {ACCESSIBLE_STEP_COUNT}
              </p>
            </div>

            <EasyModeActions confirmExit={pedidoDetalles.length > 0} confirmHome={pedidoDetalles.length > 0} />
          </div>
        </div>
      </header>

      {feedback && (
        <PdvFeedbackMessage feedback={feedback} isAccessible isHighContrast={isHighContrast} className={cardBorder} />
      )}

      {!isTurnoOpen && (
        <section
          aria-labelledby="turno-cerrado-title"
          className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}
          role="alert"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="turno-cerrado-title" className="text-3xl font-black text-slate-950">
              Paso 1: Abre turno
            </h2>
            <p
              className={`mt-3 text-xl font-bold leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-red-800"}`}
            >
              Turno cerrado. Abre turno para registrar pedidos.
            </p>
            <button
              type="button"
              onClick={handleToggleTurno}
              className={`mt-6 inline-flex min-h-[72px] min-w-[240px] items-center justify-center gap-3 rounded-2xl border px-6 text-xl font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
                isHighContrast
                  ? "contrast-button-primary"
                  : "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-700"
              }`}
            >
              <UnlockKeyhole aria-hidden="true" className="h-7 w-7" />
              Abrir turno
            </button>
            <p
              className={`mt-5 rounded-2xl border px-4 py-3 text-lg font-black ${
                isHighContrast ? "border-yellow-400 text-yellow-200" : "border-slate-300 bg-slate-50 text-slate-800"
              }`}
            >
              Las categorias y productos quedan bloqueados hasta abrir turno.
            </p>
          </div>
        </section>
      )}

      {isTurnoOpen && accessibleStepValidation && (
        <div
          id="facil-step-validation"
          className={`rounded-2xl ${cardBorder} p-4 ${isHighContrast ? "contrast-panel-soft" : "border-yellow-300 bg-yellow-50 text-slate-950"}`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center justify-center gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0" aria-hidden="true" />
            <p className="text-center text-lg font-black">{accessibleStepValidation}</p>
          </div>
        </div>
      )}

      {isTurnoOpen && accessibleStep === 1 && (
        <section aria-labelledby="step1" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step1" className="font-black text-2xl mb-4">
            Paso 1: Elige categoría
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {categoryFilters.map((filtro) => (
              <button
                key={filtro.value}
                type="button"
                onClick={() => {
                  setSelectedCategory(filtro.value);
                  setAccessibleStep(2);
                }}
                className={`min-h-[56px] rounded-xl font-bold text-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-4 ${
                  selectedCategory === filtro.value
                    ? "bg-slate-900 text-white border-2 border-slate-900"
                    : "bg-white text-slate-900 border-2 border-slate-300"
                } ${isHighContrast ? (selectedCategory === filtro.value ? "contrast-button-primary" : "contrast-button-secondary") : ""}`}
                aria-pressed={selectedCategory === filtro.value}
              >
                <span>{filtro.label}</span>
                {selectedCategory === filtro.value && (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-base font-black ${isHighContrast ? "border-yellow-300 bg-yellow-300 text-black" : "border-white bg-white text-slate-950"}`}
                  >
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    Seleccionado
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="mb-3 text-base font-semibold text-slate-600">Accesos rápidos</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate("/pedidos/facil")}
                className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-lg font-bold transition ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-900"
                }`}
              >
                <ClipboardList className="h-6 w-6" aria-hidden="true" />
                Ver pedidos activos
              </button>

              <button
                type="button"
                onClick={() => navigate("/preparacion/facil")}
                className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-lg font-bold transition ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-900"
                }`}
              >
                <ChefHat className="h-6 w-6" aria-hidden="true" />
                Ir a preparación
              </button>
            </div>
          </div>
        </section>
      )}

      {isTurnoOpen && accessibleStep === 2 && (
        <section aria-labelledby="step2" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step2" className="font-black text-2xl mb-4">
            Paso 2: Elige producto
          </h2>
          <p className="mb-3 text-lg font-semibold">Elige el producto y responde: ¿cuánto quieres?</p>
          <p className="mb-4 text-base text-slate-600">Usa los botones de menos y más para ajustar la cantidad.</p>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {accessibleProductos.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed p-8 text-center col-span-2">
                <p className="font-bold text-lg">No hay productos en esta categoría.</p>
                <p className="mt-2">Prueba otra categoría o selecciona "Ver todos".</p>
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAccessibleStep(1)}
                    className={`rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}
                  >
                    Volver a categorías
                  </button>
                </div>
              </div>
            ) : (
              accessibleProductos.map((producto) => (
                <div key={producto.id}>
                  <ProductCard
                    producto={producto}
                    cantidad={usesProductConfigurator(producto) ? 0 : items[producto.id] || 0}
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
          <AccessibleStepNavigation
            validationError={accessibleStepValidation}
            isHighContrast={isHighContrast}
            onNext={goNextAccessibleStep}
            onPrevious={goPrevAccessibleStep}
          />
        </section>
      )}

      {isTurnoOpen && accessibleStep === 3 && (
        <section aria-labelledby="step3" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step3" className="font-black text-2xl mb-4">
            Paso 3: Revisa tu pedido
          </h2>
          {pedidoDetalles.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-8 text-center">
              <p className="font-bold text-lg">Todavía no hay productos agregados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidoDetalles.map((item) => (
                <div
                  key={item.itemKey}
                  className="rounded-lg p-4 bg-white border-2 border-slate-300 flex items-center justify-between"
                >
                  <div>
                    <p className="font-black text-lg">{item.producto.nombre}</p>
                    {item.variante && (
                      <p className="text-base font-black text-yellow-700">Opción: {item.variante.nombre}</p>
                    )}
                    {item.personalizacion?.combinacion && (
                      <p className="text-base font-black text-yellow-700">
                        Combinación: {item.personalizacion.combinacion.nombre}
                      </p>
                    )}
                    {item.personalizacion?.aderezos.length ? (
                      <p className="text-base text-slate-600">Aderezos: {item.personalizacion.aderezos.join(", ")}</p>
                    ) : null}
                    {item.personalizacion?.comentario && (
                      <p className="text-base italic text-slate-600">“{item.personalizacion.comentario}”</p>
                    )}
                    <p className="text-slate-600">
                      {item.cantidad} x {formatCurrency(item.producto.precio)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-black text-lg">{formatCurrency(item.subtotal)}</p>
                    <button
                      type="button"
                      onClick={() => {
                        removeProduct(item.itemKey);
                      }}
                      className="rounded-lg bg-red-50 p-3 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <p className="font-semibold">Subtotal: {formatCurrency(total)}</p>
          </div>

          <AccessibleStepNavigation
            validationError={accessibleStepValidation}
            isHighContrast={isHighContrast}
            onNext={goNextAccessibleStep}
            onPrevious={goPrevAccessibleStep}
          />
        </section>
      )}

      {isTurnoOpen && accessibleStep === 4 && (
        <section aria-labelledby="step4" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step4" className="font-black text-2xl mb-4">
            Paso 4: Datos del comprador
          </h2>

          <div className="mb-5">
            <label htmlFor="accessibleClienteNombre" className="mb-2 block font-bold text-base">
              Nombre del comprador <span aria-hidden="true">*</span>
            </label>
            <input
              id="accessibleClienteNombre"
              type="text"
              aria-required="true"
              required
              value={clienteNombre}
              maxLength={PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH}
              onChange={(event) => setClienteNombre(sanitizeClienteNombreInput(event.target.value))}
              placeholder="Ej: Juan Pérez"
              className="min-h-[58px] w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-lg font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900 focus:ring-offset-2"
            />
          </div>

          <AccessibleStepNavigation
            validationError={accessibleStepValidation}
            isHighContrast={isHighContrast}
            onNext={goNextAccessibleStep}
            onPrevious={goPrevAccessibleStep}
          />
        </section>
      )}

      {isTurnoOpen && accessibleStep === 5 && (
        <section aria-labelledby="step5" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step5" className="font-black text-2xl mb-4">
            Paso 5: Método de pago
          </h2>
          <div className="space-y-3">
            {PAYMENT_OPTIONS.map((option) => {
              const active = metodoPago === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectMetodoPago(option.value)}
                  className={`flex min-h-[72px] w-full items-center justify-between rounded-xl border-4 px-5 py-4 text-xl font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${
                    active
                      ? isHighContrast
                        ? "contrast-button-primary"
                        : "border-slate-950 bg-slate-900 text-white shadow-md"
                      : isHighContrast
                        ? "contrast-button-secondary"
                        : "border-slate-300 bg-white text-slate-900 hover:border-slate-900"
                  }`}
                  aria-pressed={active}
                >
                  <option.Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  <span>{option.label}</span>
                  {active ? (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-base font-black ${isHighContrast ? "border-yellow-300 bg-yellow-300 text-black" : "border-white bg-white text-slate-950"}`}
                    >
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      Seleccionado
                    </span>
                  ) : (
                    <span className="h-7 w-7 rounded-full border-2 border-slate-400 bg-white" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <AccessibleStepNavigation
            validationError={accessibleStepValidation}
            isHighContrast={isHighContrast}
            onNext={goNextAccessibleStep}
            onPrevious={goPrevAccessibleStep}
          />
        </section>
      )}

      {isTurnoOpen && accessibleStep === 6 && (
        <section aria-labelledby="step6" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h2 id="step6" className="font-black text-2xl mb-4">
            Paso 6: Confirmar pedido
          </h2>
          <p className="mb-4">Verifica y confirma. Luego presiona Registrar pedido.</p>

          <div className="rounded-xl bg-white border-2 border-slate-300 p-4 mb-4">
            <p className="font-bold">Total a pagar</p>
            <p className="font-black text-3xl">{formatCurrency(total)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={goPrevAccessibleStep}
              className={`rounded-lg bg-white border-2 border-slate-900 py-4 px-6 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}
            >
              Atrás
            </button>
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
              <button
                type="button"
                onClick={() => setIsSubmitConfirmOpen(true)}
                disabled={!puedeRegistrar}
                aria-describedby={accessibleStepValidation ? "facil-step-validation" : undefined}
                className={`rounded-lg border-2 py-4 px-6 font-black text-lg ${puedeRegistrar ? "border-emerald-900 bg-emerald-700 text-white hover:bg-emerald-800" : "border-slate-300 bg-slate-300 text-slate-500"} ${isHighContrast && puedeRegistrar ? "contrast-button-success" : ""}`}
                style={{ minHeight: 64 }}
              >
                {sending ? "Registrando..." : "Registrar pedido"}
              </button>
            </div>
          </div>
        </section>
      )}

      {isSubmitConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-pedido-title"
            className={`w-full max-w-xl rounded-[28px] p-6 shadow-2xl ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
          >
            <h2 id="confirmar-pedido-title" className="text-3xl font-black text-slate-950">
              ¿Deseas registrar este pedido?
            </h2>
            <p className="mt-3 text-xl font-bold text-slate-700">Total a pagar: {formatCurrency(total)}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsSubmitConfirmOpen(false)}
                className={`min-h-[56px] rounded-2xl border-2 px-5 text-lg font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${isHighContrast ? "contrast-button-secondary" : "border-slate-300 bg-white text-slate-950 hover:bg-slate-50"}`}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitConfirmOpen(false);
                  handleSubmit();
                }}
                disabled={!puedeRegistrar}
                className={`min-h-[56px] rounded-2xl border-2 px-5 text-lg font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${isHighContrast ? "contrast-button-success" : "border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-800"}`}
              >
                Registrar pedido
              </button>
            </div>
          </section>
        </div>
      )}

      {isCloseTurnoConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-cierre-turno-title"
            className={`w-full max-w-xl rounded-[28px] p-6 shadow-2xl ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
          >
            <h2 id="confirmar-cierre-turno-title" className="text-3xl font-black text-slate-950">
              ¿Deseas cerrar el turno?
            </h2>
            <p className="mt-3 text-xl font-bold text-slate-700">
              No podrás registrar pedidos hasta abrir un turno nuevo.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsCloseTurnoConfirmOpen(false)}
                className="min-h-[56px] rounded-2xl border-2 border-slate-300 bg-white px-5 text-lg font-black text-slate-950 hover:bg-slate-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCloseTurnoConfirmOpen(false);
                  handleToggleTurno();
                }}
                className="min-h-[56px] rounded-2xl border-2 border-red-800 bg-red-700 px-5 text-lg font-black text-white hover:bg-red-800"
              >
                Sí, cerrar turno
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function AccessibleStepNavigation({
  isHighContrast,
  onNext,
  onPrevious,
  validationError
}: {
  isHighContrast: boolean;
  onNext: () => void;
  onPrevious: () => void;
  validationError: string | null;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onPrevious}
        className={`rounded-lg border-2 border-slate-900 bg-white px-4 py-3 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}
      >
        Atrás
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={Boolean(validationError)}
        aria-describedby={validationError ? "facil-step-validation" : undefined}
        className={`ml-auto rounded-lg px-4 py-3 font-bold ${
          validationError ? "cursor-not-allowed bg-slate-300 text-slate-500" : "bg-slate-900 text-white"
        } ${isHighContrast && !validationError ? "contrast-button-primary" : ""}`}
      >
        Continuar
      </button>
    </div>
  );
}

export default PdvFacilView;
