import { useEffect, useRef } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import type { PersonalizacionProducto, Producto, VarianteProducto } from "../../types";
import { formatCurrency } from "../../utils/pdv";
import useVoice from "../../hooks/useVoice";
import {
  ADEREZOS_DISPONIBLES,
  PRODUCT_COMMENT_MAX_LENGTH,
  type PdvProductConfiguratorState
} from "./hooks/usePdvProductConfigurator";

export default function PdvProductConfiguratorEasyView({
  config,
  isHighContrast,
  isVoiceEnabled,
  onClose,
  onSelect,
  producto
}: {
  config: PdvProductConfiguratorState;
  isHighContrast: boolean;
  isVoiceEnabled: boolean;
  onClose: () => void;
  onSelect: (
    variante: VarianteProducto | undefined,
    cantidad: number,
    personalizacion: PersonalizacionProducto
  ) => void;
  producto: Producto;
}) {
  const {
    aderezos,
    canContinueEasy,
    cantidad,
    combinacionSeleccionada,
    decreaseCantidad,
    easyConfigStep,
    easyHeadingRef,
    easyStage,
    easySteps,
    esSandwich,
    increaseCantidad,
    opcionesConfigurables,
    setComentario,
    setEasyConfigStep,
    toggleAderezo,
    total,
    varianteSeleccionada,
    comentario
  } = config;
  const isLastStep = easyConfigStep === easySteps.length - 1;
  const { speak } = useVoice({ enabled: isVoiceEnabled });
  const lastAnnouncedStepRef = useRef("");
  const stageTitle =
    easyStage === "opcion"
      ? esSandwich
        ? "Elige la carne"
        : "Elige una opción"
      : easyStage === "aderezos"
        ? "Elige los aderezos"
        : "Revisa y agrega";

  useEffect(() => {
    if (!isVoiceEnabled) {
      lastAnnouncedStepRef.current = "";
      return;
    }

    const stepKey = `${producto.id}:${easyConfigStep}:${easyStage}`;
    if (lastAnnouncedStepRef.current === stepKey) {
      return;
    }

    lastAnnouncedStepRef.current = stepKey;
    const totalSteps = easySteps.length;
    const stepNumber = easyConfigStep + 1;
    const message =
      easyStage === "opcion"
        ? `Paso ${stepNumber} de ${totalSteps}. ${esSandwich ? "Elige la carne" : "Elige una opción"} para ${producto.nombre}.`
        : easyStage === "aderezos"
          ? `Paso ${stepNumber} de ${totalSteps}. Elige un aderezo si quieres. Puedes elegir hasta 3, o continuar sin aderezos.`
          : `Paso ${stepNumber} de ${totalSteps}. Revisa y agrega. Ajusta la cantidad y agrega un comentario opcional para cocina si lo necesitas.`;

    speak(message, {
      priority: "high",
      dedupeKey: `pdv-product-config:${stepKey}`,
      cooldownMs: 0,
      delayMs: 120,
      force: true,
      interrupt: true
    });
  }, [easyConfigStep, easyStage, easySteps.length, esSandwich, isVoiceEnabled, producto.id, producto.nombre, speak]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-3 py-4 sm:items-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="easy-config-title"
        className={`my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border-4 shadow-2xl ${isHighContrast ? "contrast-panel border-yellow-400" : "border-slate-900 bg-white"}`}
      >
        <header
          className={`shrink-0 border-b-2 px-4 py-3 sm:px-6 ${isHighContrast ? "border-yellow-400" : "border-slate-900 bg-white"}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p
                className={`text-sm font-black uppercase tracking-[0.12em] ${isHighContrast ? "contrast-secondary-text" : "text-slate-600"}`}
              >
                Paso {easyConfigStep + 1} de {easySteps.length}
              </p>
              <h2
                id="easy-config-title"
                ref={easyHeadingRef}
                tabIndex={-1}
                className="mt-1 text-2xl font-black leading-tight text-slate-950 outline-none sm:text-3xl"
              >
                Paso {easyConfigStep + 1}: {stageTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${isHighContrast ? "contrast-button-secondary" : "border-slate-900 bg-white hover:bg-slate-100"}`}
              aria-label="Cerrar y volver a productos"
            >
              <X className="h-7 w-7" aria-hidden="true" />
            </button>
          </div>
          <div
            className="mt-4 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${easySteps.length}, minmax(0, 1fr))` }}
            aria-hidden="true"
          >
            {easySteps.map((_, index) => (
              <span
                key={index}
                className={`h-3 rounded-full ${index <= easyConfigStep ? (isHighContrast ? "bg-yellow-300" : "bg-[#FECE00]") : "bg-slate-200"}`}
              />
            ))}
          </div>
        </header>

        <div
          className={`flex shrink-0 items-center gap-4 border-b-2 px-4 py-3 sm:px-6 ${isHighContrast ? "border-yellow-400" : "border-slate-200 bg-slate-50"}`}
        >
          {producto.imagen ? (
            <img
              src={producto.imagen}
              alt=""
              className="h-20 w-24 shrink-0 rounded-2xl border-2 border-slate-300 object-cover"
            />
          ) : (
            <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-300 bg-yellow-50 font-black text-yellow-800">
              Riquísimo
            </div>
          )}
          <div className="min-w-0">
            <p className="line-clamp-2 text-xl font-black leading-tight text-slate-950 sm:text-2xl">
              {producto.nombre}
            </p>
            <p className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">{formatCurrency(producto.precio)}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {easyStage === "opcion" && (
            <div>
              <p className="text-xl font-bold text-slate-700">Toca una opción. Debes elegir una para continuar.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label={stageTitle}>
                {opcionesConfigurables.map((opcion) => {
                  const isSelected = opcion.selected;
                  return (
                    <button
                      key={opcion.key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={opcion.select}
                      className={`flex min-h-[96px] flex-wrap items-center justify-between gap-3 rounded-2xl border-4 px-5 py-4 text-left text-2xl font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${
                        isSelected
                          ? isHighContrast
                            ? "contrast-button-primary"
                            : "border-slate-900 bg-yellow-50 text-slate-950"
                          : isHighContrast
                            ? "contrast-button-secondary"
                            : "border-slate-300 bg-white text-slate-950 hover:border-slate-900"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-4">
                        <span
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-400 bg-white"}`}
                        >
                          {isSelected && <Check className="h-6 w-6" aria-hidden="true" />}
                        </span>
                        <span>{opcion.nombre}</span>
                      </span>
                      {isSelected && (
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-base font-black ${isHighContrast ? "border-yellow-300 bg-yellow-300 text-black" : "border-slate-900 bg-slate-900 text-white"}`}
                        >
                          <Check className="h-5 w-5" aria-hidden="true" />
                          Seleccionado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {easyStage === "aderezos" && (
            <div>
              <p className="text-xl font-bold text-slate-700">
                Puedes elegir hasta 3. También puedes continuar sin aderezos.
              </p>
              <p className="mt-2 text-lg font-black text-slate-600">Seleccionados: {aderezos.length} de 3</p>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {ADEREZOS_DISPONIBLES.map((aderezo) => {
                  const isSelected = aderezos.includes(aderezo);
                  const isDisabled = !isSelected && aderezos.length >= 3;
                  return (
                    <button
                      key={aderezo}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={isDisabled}
                      onClick={() => toggleAderezo(aderezo)}
                      className={`flex min-h-[92px] flex-wrap items-center justify-between gap-3 rounded-2xl border-4 px-5 py-4 text-left text-xl font-black transition disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${
                        isSelected
                          ? isHighContrast
                            ? "contrast-button-primary"
                            : "border-slate-900 bg-yellow-50 text-slate-950"
                          : isHighContrast
                            ? "contrast-button-secondary"
                            : "border-slate-300 bg-white text-slate-950 hover:border-slate-900"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-4">
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-4 ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-400 bg-white"}`}
                        >
                          {isSelected && <Check className="h-5 w-5" aria-hidden="true" />}
                        </span>
                        <span>{aderezo}</span>
                      </span>
                      {isSelected && (
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-base font-black ${isHighContrast ? "border-yellow-300 bg-yellow-300 text-black" : "border-slate-900 bg-slate-900 text-white"}`}
                        >
                          <Check className="h-5 w-5" aria-hidden="true" />
                          Seleccionado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {easyStage === "confirmar" && (
            <div
              className={`rounded-2xl border-2 p-4 sm:p-5 ${isHighContrast ? "border-yellow-400" : "border-slate-300 bg-slate-50"}`}
            >
              <h3 className="text-2xl font-black text-slate-950">Tu selección</h3>
              {varianteSeleccionada && (
                <p className="mt-3 text-lg font-bold text-slate-700">Opción: {varianteSeleccionada.nombre}</p>
              )}
              {combinacionSeleccionada && (
                <p className="mt-3 text-lg font-bold text-slate-700">Combinación: {combinacionSeleccionada.nombre}</p>
              )}
              <p className="mt-2 text-lg font-bold text-slate-700">
                Aderezos: {aderezos.length ? aderezos.join(", ") : "Sin aderezos"}
              </p>
              <div className="mt-5">
                <p className="text-lg font-black text-slate-700">Cantidad</p>
                <div className="mt-3 grid grid-cols-[1fr_84px_1fr] items-center gap-3 rounded-2xl border-4 border-slate-900 bg-white p-3">
                  <button
                    type="button"
                    onClick={decreaseCantidad}
                    disabled={cantidad <= 1}
                    className="inline-flex h-16 items-center justify-center rounded-xl border-2 border-slate-900 bg-white text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 sm:h-20"
                    aria-label="Quitar uno"
                  >
                    <Minus className="h-9 w-9" strokeWidth={3} aria-hidden="true" />
                  </button>
                  <span className="flex h-16 items-center justify-center rounded-xl bg-slate-100 text-center text-4xl font-black text-slate-950 sm:h-20 sm:text-5xl">
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={increaseCantidad}
                    className="inline-flex h-16 items-center justify-center rounded-xl border-2 border-slate-900 bg-[#FECE00] text-slate-950 transition hover:bg-[#FFD633] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 sm:h-20"
                    aria-label="Agregar uno"
                  >
                    <Plus className="h-9 w-9" strokeWidth={3} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="mt-5">
                <label htmlFor="easyProductComment" className="block text-lg font-black text-slate-700">
                  Comentarios para cocina
                </label>
                <p className="mt-1 text-base font-semibold text-slate-600">Opcional. Puedes dejarlo vacío.</p>
                <textarea
                  id="easyProductComment"
                  rows={3}
                  value={comentario}
                  maxLength={PRODUCT_COMMENT_MAX_LENGTH}
                  onChange={(event) => setComentario(event.target.value)}
                  placeholder="Ej: sin cebolla, bien tostado..."
                  className="mt-3 w-full resize-none rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-lg font-semibold text-slate-950 outline-none focus:border-slate-900 focus:ring-4 focus:ring-yellow-400"
                />
                <p className="mt-1 text-right text-base font-bold text-slate-600">
                  {comentario.length}/{PRODUCT_COMMENT_MAX_LENGTH}
                </p>
              </div>
            </div>
          )}
        </div>

        <footer
          className={`grid shrink-0 gap-3 border-t-2 p-4 sm:grid-cols-2 ${isHighContrast ? "border-yellow-400" : "border-slate-200 bg-slate-50"}`}
        >
          <button
            type="button"
            onClick={easyConfigStep === 0 ? onClose : () => setEasyConfigStep((current) => current - 1)}
            className={`min-h-[68px] rounded-2xl border-4 px-6 text-xl font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${isHighContrast ? "contrast-button-secondary" : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"}`}
          >
            {easyConfigStep === 0 ? "Cancelar" : "Atrás"}
          </button>
          {isLastStep ? (
            <button
              type="button"
              onClick={() =>
                onSelect(varianteSeleccionada, cantidad, {
                  aderezos,
                  comentario: comentario.trim() || undefined,
                  combinacion: combinacionSeleccionada
                })
              }
              className={`min-h-[68px] rounded-2xl border-4 px-6 text-xl font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${isHighContrast ? "contrast-button-primary" : "border-slate-900 bg-[#FECE00] text-slate-950 hover:bg-[#FFD633]"}`}
            >
              Agregar · {formatCurrency(total)}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinueEasy}
              onClick={() => setEasyConfigStep((current) => current + 1)}
              className={`min-h-[68px] rounded-2xl border-4 px-6 text-xl font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 ${canContinueEasy ? (isHighContrast ? "contrast-button-primary" : "border-slate-900 bg-slate-900 text-white hover:bg-black") : ""}`}
            >
              Continuar
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
