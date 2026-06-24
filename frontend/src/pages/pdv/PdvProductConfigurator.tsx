import { Check, Minus, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PersonalizacionProducto, Producto, VarianteProducto } from "../../types";
import { formatCurrency } from "../../utils/pdv";
import { PEDIDO_MAX_CANTIDAD_DETALLE } from "../../validations/pedido.validation";

const ADEREZOS_DISPONIBLES = ["Mostaza", "Mayonesa", "Ketchup", "Poca mayo"];
const PRODUCT_COMMENT_MAX_LENGTH = 200;

export default function PdvProductConfigurator({
  isAccessible,
  isHighContrast,
  onClose,
  onSelect,
  producto
}: {
  isAccessible: boolean;
  isHighContrast: boolean;
  onClose: () => void;
  onSelect: (
    variante: VarianteProducto | undefined,
    cantidad: number,
    personalizacion: PersonalizacionProducto
  ) => void;
  producto: Producto;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [aderezos, setAderezos] = useState<string[]>([]);
  const [comentario, setComentario] = useState("");
  const [easyConfigStep, setEasyConfigStep] = useState(0);
  const easyHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const varianteSeleccionada = producto.variantes?.find((variante) => variante.id === selectedVariantId);
  const variantesDisponibles = producto.variantes?.filter((item) => item.disponible !== false) ?? [];
  const requiereOpcion = variantesDisponibles.length > 0;
  const esSandwich = producto.nombre.toLocaleLowerCase("es").includes("sandwich");
  const total = producto.precio * cantidad;
  const easySteps: Array<"opcion" | "aderezos" | "confirmar"> = requiereOpcion
    ? ["opcion", "aderezos", "confirmar"]
    : ["aderezos", "confirmar"];
  const easyStage = easySteps[easyConfigStep];
  const canContinueEasy = easyStage !== "opcion" || Boolean(varianteSeleccionada);

  const toggleAderezo = (aderezo: string) => {
    setAderezos((current) =>
      current.includes(aderezo) ? current.filter((item) => item !== aderezo) : [...current, aderezo]
    );
  };

  useEffect(() => {
    if (isAccessible) easyHeadingRef.current?.focus();
  }, [easyConfigStep, isAccessible]);

  if (isAccessible) {
    const isLastStep = easyConfigStep === easySteps.length - 1;
    const stageTitle =
      easyStage === "opcion"
        ? esSandwich
          ? "Elige la carne"
          : "Elige una opción"
        : easyStage === "aderezos"
          ? "Elige los aderezos"
          : "Revisa y agrega";

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/75 px-3 py-4 backdrop-blur-[1px]">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="easy-config-title"
          className={`w-full max-w-4xl overflow-hidden rounded-[28px] border-4 shadow-2xl ${isHighContrast ? "contrast-panel border-yellow-400" : "border-slate-900 bg-white"}`}
        >
          <header
            className={`border-b-2 px-5 py-4 sm:px-7 ${isHighContrast ? "border-yellow-400" : "border-slate-900 bg-white"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className={`text-base font-black uppercase tracking-[0.12em] ${isHighContrast ? "contrast-secondary-text" : "text-slate-600"}`}
                >
                  Paso {easyConfigStep + 1} de {easySteps.length}
                </p>
                <h2
                  id="easy-config-title"
                  ref={easyHeadingRef}
                  tabIndex={-1}
                  className="mt-1 text-3xl font-black leading-tight text-slate-950 outline-none sm:text-4xl"
                >
                  Paso {easyConfigStep + 1}: {stageTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${isHighContrast ? "contrast-button-secondary" : "border-slate-900 bg-white hover:bg-slate-100"}`}
                aria-label="Cerrar y volver a productos"
              >
                <X className="h-8 w-8" aria-hidden="true" />
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
            className={`flex items-center gap-4 border-b-2 px-5 py-4 sm:px-7 ${isHighContrast ? "border-yellow-400" : "border-slate-200 bg-slate-50"}`}
          >
            {producto.imagen ? (
              <img
                src={producto.imagen}
                alt=""
                className="h-24 w-28 shrink-0 rounded-2xl border-2 border-slate-300 object-cover"
              />
            ) : (
              <div className="flex h-24 w-28 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-300 bg-yellow-50 font-black text-yellow-800">
                Riquísimo
              </div>
            )}
            <div className="min-w-0">
              <p className="text-2xl font-black leading-tight text-slate-950">{producto.nombre}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(producto.precio)}</p>
            </div>
          </div>

          <div className="min-h-[310px] px-5 py-6 sm:px-7">
            {easyStage === "opcion" && (
              <div>
                <p className="text-xl font-bold text-slate-700">Toca una opción. Debes elegir una para continuar.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label={stageTitle}>
                  {variantesDisponibles.map((variante) => {
                    const isSelected = selectedVariantId === variante.id;
                    return (
                      <button
                        key={variante.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedVariantId(variante.id)}
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
                          <span>{variante.nombre}</span>
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
              <div>
                <div
                  className={`rounded-2xl border-2 p-5 ${isHighContrast ? "border-yellow-400" : "border-slate-300 bg-slate-50"}`}
                >
                  <h3 className="text-xl font-black text-slate-950">Tu selección</h3>
                  {varianteSeleccionada && (
                    <p className="mt-3 text-lg font-bold text-slate-700">Opción: {varianteSeleccionada.nombre}</p>
                  )}
                  <p className="mt-2 text-lg font-bold text-slate-700">
                    Aderezos: {aderezos.length ? aderezos.join(", ") : "Sin aderezos"}
                  </p>
                  <div className="mt-5">
                    <p className="text-lg font-black text-slate-700">Cantidad</p>
                    <div className="mt-3 grid grid-cols-[minmax(88px,1fr)_auto_minmax(88px,1fr)] items-center gap-3 rounded-2xl border-4 border-slate-900 bg-white p-3">
                      <button
                        type="button"
                        onClick={() => setCantidad((current) => Math.max(1, current - 1))}
                        disabled={cantidad <= 1}
                        className="inline-flex min-h-[84px] items-center justify-center rounded-xl border-2 border-slate-900 bg-white text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
                        aria-label="Quitar uno"
                      >
                        <Minus className="h-10 w-10" strokeWidth={3} aria-hidden="true" />
                      </button>
                      <span className="min-w-24 rounded-xl bg-slate-100 px-4 py-4 text-center text-5xl font-black text-slate-950">
                        {cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCantidad((current) => Math.min(PEDIDO_MAX_CANTIDAD_DETALLE, current + 1))}
                        className="inline-flex min-h-[84px] items-center justify-center rounded-xl border-2 border-slate-900 bg-[#FECE00] text-slate-950 transition hover:bg-[#FFD633] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
                        aria-label="Agregar uno"
                      >
                        <Plus className="h-10 w-10" strokeWidth={3} aria-hidden="true" />
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
              </div>
            )}
          </div>

          <footer
            className={`grid gap-3 border-t-2 p-4 sm:grid-cols-2 ${isHighContrast ? "border-yellow-400" : "border-slate-200 bg-slate-50"}`}
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
                    comentario: comentario.trim() || undefined
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 px-3 py-5 backdrop-blur-[1px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-selection-title"
        className={`w-full overflow-hidden rounded-[22px] shadow-2xl ${isAccessible ? "max-w-3xl border-2" : "max-w-[680px] border"} ${isHighContrast ? "contrast-panel border-yellow-400" : "border-slate-300 bg-white"}`}
      >
        <header
          className={`flex items-center justify-between border-b px-5 ${isAccessible ? "min-h-[72px]" : "min-h-[56px]"} ${isHighContrast ? "border-yellow-400" : "border-slate-200"}`}
        >
          <div>
            <p
              className={`font-black uppercase tracking-[0.14em] ${isAccessible ? "text-sm" : "text-[11px] text-slate-500"}`}
            >
              {producto.tipo === "promo" ? "Configurar promoción" : "Configurar producto"}
            </p>
            <h2
              id="variant-selection-title"
              className={`${isAccessible ? "text-2xl" : "text-lg"} font-black text-slate-950`}
            >
              {producto.nombre}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center justify-center rounded-full transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${isAccessible ? "h-12 w-12" : "h-10 w-10"}`}
            aria-label="Cerrar configuración"
          >
            <X className={isAccessible ? "h-7 w-7" : "h-5 w-5"} aria-hidden="true" />
          </button>
        </header>

        <div
          className={`grid border-b ${isHighContrast ? "border-yellow-400" : "border-slate-200"} sm:grid-cols-[minmax(0,1fr)_210px]`}
        >
          <div className={isAccessible ? "p-6" : "p-5"}>
            <p
              className={`font-semibold leading-relaxed ${isAccessible ? "text-lg" : "text-sm"} ${isHighContrast ? "contrast-body-text" : "text-slate-600"}`}
            >
              {producto.descripcion || "Selecciona cómo preparar esta promoción."}
            </p>
            <p className={`mt-6 font-black text-slate-950 ${isAccessible ? "text-3xl" : "text-2xl"}`}>
              {formatCurrency(producto.precio)}
            </p>
          </div>
          <div
            className={`flex min-h-[150px] items-center justify-center overflow-hidden ${isHighContrast ? "bg-black" : "bg-[#FFF8DC]"}`}
          >
            {producto.imagen ? (
              <img
                src={producto.imagen}
                alt={producto.altText || producto.nombre}
                className="h-full max-h-[190px] w-full object-cover"
              />
            ) : (
              <span
                className={`px-5 text-center font-black uppercase tracking-wide ${isHighContrast ? "text-yellow-300" : "text-yellow-800"}`}
              >
                Riquísimo
              </span>
            )}
          </div>
        </div>

        {requiereOpcion && (
          <div className={isAccessible ? "p-6" : "p-5"}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`font-black text-slate-950 ${isAccessible ? "text-2xl" : "text-base"}`}>
                  {esSandwich ? "Elige la carne de tu sándwich" : "Elige una opción"}
                </h3>
                <p
                  className={`mt-1 font-semibold ${isAccessible ? "text-lg" : "text-sm"} ${isHighContrast ? "contrast-body-text" : "text-slate-500"}`}
                >
                  Selecciona una opción obligatoria
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 font-black ${isAccessible ? "text-base" : "text-xs"} ${isHighContrast ? "border-yellow-400 text-yellow-300" : "border-yellow-400 bg-yellow-50 text-yellow-800"}`}
              >
                Obligatorio
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de completo">
              {variantesDisponibles.map((variante) => {
                const isSelected = selectedVariantId === variante.id;
                return (
                  <button
                    key={variante.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedVariantId(variante.id)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 text-left font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${isAccessible ? "min-h-[76px] text-xl" : "min-h-[58px] text-base"} ${
                      isSelected
                        ? isHighContrast
                          ? "contrast-button-primary"
                          : "border-slate-900 bg-yellow-50 text-slate-950"
                        : isHighContrast
                          ? "contrast-button-secondary"
                          : "border-slate-300 bg-white text-slate-800 hover:border-yellow-500 hover:bg-yellow-50"
                    }`}
                  >
                    <span
                      className={`inline-flex shrink-0 items-center justify-center rounded-md border-2 ${isAccessible ? "h-8 w-8" : "h-6 w-6"} ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-400 bg-white"}`}
                    >
                      {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    {variante.nombre}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div
          className={`border-t ${isAccessible ? "p-6" : "p-5"} ${isHighContrast ? "border-yellow-400" : "border-slate-200"}`}
        >
          <div>
            <h3 className={`font-black text-slate-950 ${isAccessible ? "text-2xl" : "text-base"}`}>Aderezos</h3>
            <p
              className={`mt-1 font-semibold ${isAccessible ? "text-lg" : "text-sm"} ${isHighContrast ? "contrast-body-text" : "text-slate-500"}`}
            >
              Selecciona hasta 3 opciones
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ADEREZOS_DISPONIBLES.map((aderezo) => {
              const isSelected = aderezos.includes(aderezo);
              const isDisabled = !isSelected && aderezos.length >= 3;
              return (
                <button
                  key={aderezo}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={isDisabled}
                  onClick={() =>
                    setAderezos((current) =>
                      current.includes(aderezo) ? current.filter((item) => item !== aderezo) : [...current, aderezo]
                    )
                  }
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${isAccessible ? "min-h-[68px] text-lg" : "min-h-[54px] text-sm"} ${
                    isSelected
                      ? isHighContrast
                        ? "contrast-button-primary"
                        : "border-slate-900 bg-yellow-50 text-slate-950"
                      : isHighContrast
                        ? "contrast-button-secondary"
                        : "border-slate-300 bg-white text-slate-700 hover:border-yellow-500"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-400 bg-white"}`}
                  >
                    {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
                  </span>
                  {aderezo}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`border-t ${isAccessible ? "p-6" : "p-5"} ${isHighContrast ? "border-yellow-400" : "border-slate-200"}`}
        >
          <label
            htmlFor="productComment"
            className={`block font-black text-slate-950 ${isAccessible ? "text-2xl" : "text-base"}`}
          >
            Comentarios
          </label>
          <p
            className={`mt-1 font-semibold ${isAccessible ? "text-lg" : "text-sm"} ${isHighContrast ? "contrast-body-text" : "text-slate-500"}`}
          >
            Opcional. Esta indicación llegará a cocina con este producto.
          </p>
          <textarea
            id="productComment"
            rows={3}
            value={comentario}
            maxLength={PRODUCT_COMMENT_MAX_LENGTH}
            onChange={(event) => setComentario(event.target.value)}
            placeholder="Ej: sin cebolla, bien tostado..."
            className={`mt-3 w-full resize-none rounded-xl border-2 bg-white px-4 py-3 font-semibold text-slate-950 outline-none focus:ring-4 focus:ring-yellow-400 ${isHighContrast ? "border-yellow-400" : "border-slate-300"}`}
          />
          <p className="mt-1 text-right text-xs font-bold text-slate-500">
            {comentario.length}/{PRODUCT_COMMENT_MAX_LENGTH}
          </p>
        </div>

        <footer
          className={`grid gap-3 border-t p-4 sm:grid-cols-[220px_minmax(0,1fr)] ${isHighContrast ? "border-yellow-400" : "border-slate-200 bg-slate-50"}`}
        >
          <div
            className={`grid grid-cols-[1fr_auto_1fr] items-center overflow-hidden rounded-xl border bg-white ${isHighContrast ? "border-yellow-400" : "border-slate-300"}`}
          >
            <button
              type="button"
              onClick={() => setCantidad((current) => Math.max(1, current - 1))}
              disabled={cantidad <= 1}
              className={`inline-flex items-center justify-center text-slate-700 transition hover:bg-slate-100 disabled:opacity-35 ${isAccessible ? "min-h-[64px]" : "min-h-[50px]"}`}
              aria-label="Disminuir cantidad"
            >
              <Minus className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className={`${isAccessible ? "text-2xl" : "text-lg"} min-w-12 text-center font-black text-slate-950`}>
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => setCantidad((current) => Math.min(PEDIDO_MAX_CANTIDAD_DETALLE, current + 1))}
              className={`inline-flex items-center justify-center text-slate-950 transition hover:bg-yellow-50 ${isAccessible ? "min-h-[64px]" : "min-h-[50px]"}`}
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            disabled={requiereOpcion && !varianteSeleccionada}
            onClick={() =>
              (!requiereOpcion || varianteSeleccionada) &&
              onSelect(varianteSeleccionada, cantidad, {
                aderezos,
                comentario: comentario.trim() || undefined
              })
            }
            className={`inline-flex items-center justify-center rounded-xl border-2 px-5 font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 ${isAccessible ? "min-h-[64px] text-xl" : "min-h-[50px] text-base"} ${!requiereOpcion || varianteSeleccionada ? (isHighContrast ? "contrast-button-primary" : "border-slate-900 bg-[#FECE00] text-slate-950 hover:bg-[#FFD633]") : ""}`}
          >
            {!requiereOpcion || varianteSeleccionada ? `Agregar · ${formatCurrency(total)}` : "Selecciona una opción"}
          </button>
        </footer>
      </section>
    </div>
  );
}
