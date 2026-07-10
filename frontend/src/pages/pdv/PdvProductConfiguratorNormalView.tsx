import { Check, Minus, Plus, X } from "lucide-react";
import type { PersonalizacionProducto, Producto, VarianteProducto } from "../../types";
import { formatCurrency } from "../../utils/pdv";
import {
  ADEREZOS_DISPONIBLES,
  PRODUCT_COMMENT_MAX_LENGTH,
  type PdvProductConfiguratorState
} from "./hooks/usePdvProductConfigurator";

export default function PdvProductConfiguratorNormalView({
  config,
  isHighContrast,
  onClose,
  onSelect,
  producto
}: {
  config: PdvProductConfiguratorState;
  isHighContrast: boolean;
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
    cantidad,
    combinacionSeleccionada,
    decreaseCantidad,
    esSandwich,
    increaseCantidad,
    opcionSeleccionada,
    opcionesConfigurables,
    requiereOpcion,
    setComentario,
    toggleAderezo,
    total,
    varianteSeleccionada,
    comentario
  } = config;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-3 py-5">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-selection-title"
        className={`w-full max-w-[680px] overflow-hidden rounded-[22px] border shadow-2xl ${isHighContrast ? "contrast-panel border-yellow-400" : "border-slate-300 bg-white"}`}
      >
        <header
          className={`flex min-h-[56px] items-center justify-between border-b px-5 ${isHighContrast ? "border-yellow-400" : "border-slate-200"}`}
        >
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              {producto.tipo === "promo" ? "Configurar promoción" : "Configurar producto"}
            </p>
            <h2 id="variant-selection-title" className="text-lg font-black text-slate-950">
              {producto.nombre}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
            aria-label="Cerrar configuración"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div
          className={`grid border-b ${isHighContrast ? "border-yellow-400" : "border-slate-200"} sm:grid-cols-[minmax(0,1fr)_210px]`}
        >
          <div className="p-5">
            <p
              className={`text-sm font-semibold leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-600"}`}
            >
              {producto.descripcion || "Selecciona cómo preparar esta promoción."}
            </p>
            <p className="mt-6 text-2xl font-black text-slate-950">{formatCurrency(producto.precio)}</p>
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
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-950">
                  {esSandwich ? "Elige la carne de tu sándwich" : "Elige una opción"}
                </h3>
                <p className={`mt-1 text-sm font-semibold ${isHighContrast ? "contrast-body-text" : "text-slate-500"}`}>
                  Selecciona una opción obligatoria
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${isHighContrast ? "border-yellow-400 text-yellow-300" : "border-yellow-400 bg-yellow-50 text-yellow-800"}`}
              >
                Obligatorio
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de completo">
              {opcionesConfigurables.map((opcion) => {
                const isSelected = opcion.selected;
                return (
                  <button
                    key={opcion.key}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={opcion.select}
                    className={`flex min-h-[58px] items-center gap-3 rounded-xl border-2 px-4 text-left text-base font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${
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
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-400 bg-white"}`}
                    >
                      {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    {opcion.nombre}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className={`border-t p-5 ${isHighContrast ? "border-yellow-400" : "border-slate-200"}`}>
          <div>
            <h3 className="text-base font-black text-slate-950">Aderezos</h3>
            <p className={`mt-1 text-sm font-semibold ${isHighContrast ? "contrast-body-text" : "text-slate-500"}`}>
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
                  onClick={() => toggleAderezo(aderezo)}
                  className={`flex min-h-[54px] items-center gap-2 rounded-xl border-2 px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
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

        <div className={`border-t p-5 ${isHighContrast ? "border-yellow-400" : "border-slate-200"}`}>
          <label htmlFor="productComment" className="block text-base font-black text-slate-950">
            Comentarios
          </label>
          <p className={`mt-1 text-sm font-semibold ${isHighContrast ? "contrast-body-text" : "text-slate-500"}`}>
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
              onClick={decreaseCantidad}
              disabled={cantidad <= 1}
              className="inline-flex min-h-[50px] items-center justify-center text-slate-700 transition hover:bg-slate-100 disabled:opacity-35"
              aria-label="Disminuir cantidad"
            >
              <Minus className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="min-w-12 text-center text-lg font-black text-slate-950">{cantidad}</span>
            <button
              type="button"
              onClick={increaseCantidad}
              className="inline-flex min-h-[50px] items-center justify-center text-slate-950 transition hover:bg-yellow-50"
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            disabled={requiereOpcion && !opcionSeleccionada}
            onClick={() =>
              (!requiereOpcion || opcionSeleccionada) &&
              onSelect(varianteSeleccionada, cantidad, {
                aderezos,
                comentario: comentario.trim() || undefined,
                combinacion: combinacionSeleccionada
              })
            }
            className={`inline-flex min-h-[50px] items-center justify-center rounded-xl border-2 px-5 text-base font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 ${!requiereOpcion || opcionSeleccionada ? (isHighContrast ? "contrast-button-primary" : "border-slate-900 bg-[#FECE00] text-slate-950 hover:bg-[#FFD633]") : ""}`}
          >
            {!requiereOpcion || opcionSeleccionada ? `Agregar · ${formatCurrency(total)}` : "Selecciona una opción"}
          </button>
        </footer>
      </section>
    </div>
  );
}
