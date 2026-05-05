import { useEffect } from "react";

function AccessibilityPanel({
  isOpen,
  onClose,
  isAccessible,
  textSize,
  isHighContrast,
  isVoiceEnabled,
  onToggleAccessible,
  onSetTextSize,
  onToggleContrast,
  onToggleVoice,
  speak
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isVoiceEnabled && isOpen) {
      speak("Ayuda por voz activada");
    }
  }, [isVoiceEnabled, isOpen, speak]);

  if (!isOpen) {
    return null;
  }

  const optionButtonClass = (active) =>
    `min-h-[48px] rounded-xl border px-4 py-3 text-base font-bold transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 ${
      active
        ? "border-blue-700 bg-blue-600 text-white focus-visible:outline-blue-300"
        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-blue-300"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 px-3 py-4 sm:px-4"
      onClick={onClose}
    >
      <aside
        aria-modal="true"
        role="dialog"
        aria-label="Panel de accesibilidad"
        className="ml-auto flex h-full w-full max-w-md flex-col rounded-3xl bg-white shadow-2xl shadow-slate-900/20"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                ♿ Accesibilidad
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Opciones simples
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Ajustes claros para usar el sistema con más facilidad.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de accesibilidad"
              className="min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 text-base font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-300"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Modo accesible
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Aumenta tamaño, mejora contraste y simplifica la interfaz.
                </p>
              </div>

              <button
                type="button"
                onClick={onToggleAccessible}
                aria-label={isAccessible ? "Desactivar modo accesible" : "Activar modo accesible"}
                aria-pressed={isAccessible}
                className={optionButtonClass(isAccessible)}
              >
                {isAccessible ? "ON" : "OFF"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Tamaño de texto
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Ajuste simple para leer mejor.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "small", label: "A-", name: "Pequeño" },
                { value: "normal", label: "A", name: "Normal" },
                { value: "large", label: "A+", name: "Grande" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSetTextSize(option.value)}
                  aria-label={`Tamaño de texto ${option.name}`}
                  aria-pressed={textSize === option.value}
                  className={optionButtonClass(textSize === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Contraste alto
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Mejora la visibilidad de los elementos.
                </p>
              </div>

              <button
                type="button"
                onClick={onToggleContrast}
                aria-label={isHighContrast ? "Desactivar contraste alto" : "Activar contraste alto"}
                aria-pressed={isHighContrast}
                className={optionButtonClass(isHighContrast)}
              >
                {isHighContrast ? "ON" : "OFF"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Ayuda por voz
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  El sistema leerá instrucciones y mensajes.
                </p>
              </div>

              <button
                type="button"
                onClick={onToggleVoice}
                aria-label={isVoiceEnabled ? "Desactivar ayuda por voz" : "Activar ayuda por voz"}
                aria-pressed={isVoiceEnabled}
                className={optionButtonClass(isVoiceEnabled)}
              >
                {isVoiceEnabled ? "ON" : "OFF"}
              </button>
            </div>
          </section>

          {isAccessible && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                Modo accesible activo. Los textos, botones y espacios aumentan.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default AccessibilityPanel;