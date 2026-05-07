import { useEffect } from "react";

/**
 * Panel principal de accesibilidad con dos experiencias visuales:
 * 1. Modo Normal: compacto, moderno
 * 2. Modo Accesible: expandido, claro, legible
 * 
 * Características WCAG:
 * - Navegación completa por teclado
 * - Contraste AA/AAA
 * - Semántica HTML correcta
 */
function AccessibilityPanel({
  isOpen,
  onClose,
  isAccessible,
  textSize,
  isHighContrast,
  isVoiceEnabled,
  isSoundEnabled,
  onToggleAccessible,
  onSetTextSize,
  onToggleContrast,
  onToggleVoice,
  onToggleSound,
  speak
}) {
  // Manejo de teclado
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

  // Anunciar cuando voz está habilitada
  useEffect(() => {
    if (isVoiceEnabled && isOpen) {
      speak("Panel de opciones simples abierto. Use Tab para navegar.");
    }
  }, [isVoiceEnabled, isOpen, speak]);

  if (!isOpen) {
    return null;
  }

  // Clases base para botones según modo
  const getButtonClass = (active) => {
    const baseClass = "min-h-[56px] rounded-xl border px-4 py-3 font-bold transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4";

    if (isAccessible) {
      return `${baseClass} text-lg ${
        active
          ? "border-slate-900 bg-slate-900 text-white focus-visible:outline-blue-500"
          : "border-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 focus-visible:outline-blue-500"
      }`;
    }

    return `${baseClass} text-base ${
      active
        ? "border-blue-700 bg-blue-600 text-white focus-visible:outline-blue-300"
        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-blue-300"
    }`;
  };

  // Clases para contenedor de opciones
  const sectionClass = isAccessible
    ? "rounded-2xl border-3 border-slate-900 bg-white p-6 space-y-4"
    : "rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3";

  const titleClass = isAccessible ? "text-2xl" : "text-lg";
  const descriptionClass = isAccessible ? "text-base" : "text-sm";
  const spacingClass = isAccessible ? "space-y-6" : "space-y-5";

  const headerPaddingClass = isAccessible ? "px-6 py-5" : "px-5 py-4";
  const contentPaddingClass = isAccessible ? "px-6 py-6" : "px-5 py-5";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 px-3 py-4 sm:px-4"
      onClick={onClose}
      role="presentation"
    >
      <aside
        aria-modal="true"
        role="dialog"
        aria-label="Panel de opciones simples"
        className={`
          ml-auto flex h-full w-full max-w-md flex-col
          ${isAccessible
            ? "rounded-3xl border-3 border-slate-900 bg-white shadow-2xl"
            : "rounded-3xl bg-white shadow-2xl shadow-slate-900/20"
          }
        `}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`
            border-b ${isAccessible ? "border-3 border-slate-900" : "border-slate-200"}
            ${headerPaddingClass} sm:px-6
          `}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className={`
                  font-bold uppercase tracking-[0.16em]
                  ${isAccessible
                    ? "text-xl text-slate-900"
                    : "text-sm text-blue-700"
                  }
                `}
              >
                {isAccessible ? " OPCIONES SIMPLES" : "♿ Accesibilidad"}
              </p>
              <h2
                className={`
                  mt-2 font-black text-slate-900
                  ${isAccessible ? "text-3xl" : "text-2xl"}
                `}
              >
                {isAccessible ? "Usa el sistema más fácil" : "Opciones simples"}
              </h2>
              <p
                className={`
                  mt-2 text-slate-600
                  ${isAccessible ? "text-lg" : "text-sm"}
                `}
              >
                {isAccessible
                  ? "Ajusta el sistema para que sea más cómodo para ti"
                  : "Ajustes claros para usar el sistema con más facilidad."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de opciones"
              className={`
                flex-shrink-0 min-h-[56px] min-w-[56px] rounded-xl border font-bold transition
                focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4
                ${isAccessible
                  ? "text-2xl border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-100 focus-visible:outline-blue-500"
                  : "text-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-blue-300"
                }
              `}
            >
              ✕
            </button>
          </div>
        </div>

        <div
          className={`flex-1 overflow-y-auto ${contentPaddingClass} sm:px-6`}
        >
          <div className={spacingClass}>
            {/* MODO ACCESIBLE */}
            <section className={sectionClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`font-black text-slate-900 ${titleClass}`}>
                    {isAccessible ? "✅ MODO FÁCIL" : "🎯 Modo accesible"}
                  </h3>
                  <p
                    className={`
                      mt-2 text-slate-700
                      ${isAccessible ? "text-lg font-semibold" : "text-sm"}
                    `}
                  >
                    {isAccessible
                      ? "Texto grande • Botones enormes • Colores fuertes"
                      : "Aumenta tamaño, mejora contraste y simplifica."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onToggleAccessible();
                    speak(
                      isAccessible
                        ? "Modo fácil desactivado"
                        : "Modo fácil activado"
                    );
                  }}
                  aria-label={
                    isAccessible
                      ? "Desactivar modo fácil"
                      : "Activar modo fácil"
                  }
                  aria-pressed={isAccessible}
                  className={getButtonClass(isAccessible)}
                >
                  <span className={isAccessible ? "text-2xl" : ""}>
                    {isAccessible ? "✓ ACTIVADO" : "ACTIVAR"}
                  </span>
                </button>
              </div>
            </section>

            {/* TAMAÑO DE TEXTO */}
            <section className={sectionClass}>
              <div>
                <h3 className={`font-black text-slate-900 ${titleClass}`}>
                  {isAccessible ? "📝 TAMAÑO DE LETRAS" : "📝 Tamaño de texto"}
                </h3>
                <p
                  className={`
                    mt-2 text-slate-700
                    ${isAccessible ? "text-lg font-semibold" : "text-sm"}
                  `}
                >
                  {isAccessible
                    ? "Elige el tamaño que te sea más cómodo"
                    : "Ajuste simple para leer mejor."}
                </p>
              </div>

              <div
                className="grid gap-3 grid-cols-3"
              >
                {[
                  {
                    value: "small",
                    label: isAccessible ? " CHICA" : "A-",
                    name: "Pequeño"
                  },
                  {
                    value: "normal",
                    label: isAccessible ? " NORMAL" : "A",
                    name: "Normal"
                  },
                  {
                    value: "large",
                    label: isAccessible ? " GRANDE" : "A+",
                    name: "Grande"
                  }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSetTextSize(option.value);
                      speak(`Tamaño de letra: ${option.name}`);
                    }}
                    aria-label={`Tamaño de texto ${option.name}`}
                    aria-pressed={textSize === option.value}
                    className={getButtonClass(textSize === option.value)}
                  >
                    <span className={isAccessible ? "text-2xl" : ""}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* CONTRASTE */}
            <section className={sectionClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`font-black text-slate-900 ${titleClass}`}>
                    {isAccessible ? "⚡ CONTRASTE FUERTE" : "⚡ Contraste alto"}
                  </h3>
                  <p
                    className={`
                      mt-2 text-slate-700
                      ${isAccessible ? "text-lg font-semibold" : "text-sm"}
                    `}
                  >
                    {isAccessible
                      ? "Colores más fuertes para ver mejor"
                      : "Mejora la visibilidad de los elementos."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onToggleContrast();
                    speak(
                      isHighContrast
                        ? "Contraste fuerte desactivado"
                        : "Contraste fuerte activado"
                    );
                  }}
                  aria-label={
                    isHighContrast
                      ? "Desactivar contraste alto"
                      : "Activar contraste alto"
                  }
                  aria-pressed={isHighContrast}
                  className={getButtonClass(isHighContrast)}
                >
                  <span className={isAccessible ? "text-2xl" : ""}>
                    {isHighContrast ? "✓ ACTIVADO" : "ACTIVAR"}
                  </span>
                </button>
              </div>
            </section>

            {/* VOZ */}
            <section className={sectionClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`font-black text-slate-900 ${titleClass}`}>
                    {isAccessible ? "🔊 AYUDA CON VOZ" : "🔊 Ayuda por voz"}
                  </h3>
                  <p
                    className={`
                      mt-2 text-slate-700
                      ${isAccessible ? "text-lg font-semibold" : "text-sm"}
                    `}
                  >
                    {isAccessible
                      ? "El sistema te hablará mientras usas"
                      : "El sistema leerá instrucciones y mensajes."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onToggleVoice();
                    speak(
                      isVoiceEnabled
                        ? "Ayuda por voz desactivada"
                        : "Ayuda por voz activada"
                    );
                  }}
                  aria-label={
                    isVoiceEnabled
                      ? "Desactivar ayuda por voz"
                      : "Activar ayuda por voz"
                  }
                  aria-pressed={isVoiceEnabled}
                  className={getButtonClass(isVoiceEnabled)}
                >
                  <span className={isAccessible ? "text-2xl" : ""}>
                    {isVoiceEnabled ? "✓ ACTIVADO" : "ACTIVAR"}
                  </span>
                </button>
              </div>
            </section>

            {/* SONIDOS */}
            <section className={sectionClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`font-black text-slate-900 ${titleClass}`}>
                    {isAccessible ? "🔔 SONIDOS DE AYUDA" : "🔔 Sonidos"}
                  </h3>
                  <p
                    className={`
                      mt-2 text-slate-700
                      ${isAccessible ? "text-lg font-semibold" : "text-sm"}
                    `}
                  >
                    {isAccessible
                      ? "Soniditos que avisan cuando haces algo"
                      : "Reproduce sonidos breves en acciones importantes."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onToggleSound();
                    speak(
                      isSoundEnabled
                        ? "Sonidos desactivados"
                        : "Sonidos activados"
                    );
                  }}
                  aria-label={
                    isSoundEnabled
                      ? "Desactivar sonidos"
                      : "Activar sonidos"
                  }
                  aria-pressed={isSoundEnabled}
                  className={getButtonClass(isSoundEnabled)}
                >
                  <span className={isAccessible ? "text-2xl" : ""}>
                    {isSoundEnabled ? "✓ ACTIVADO" : "ACTIVAR"}
                  </span>
                </button>
              </div>
            </section>

            {/* INFORMACIÓN MODAL - Modo Accesible Activo */}
            {isAccessible && (
              <div
                className={`
                  rounded-2xl border-3 border-green-900 bg-green-50 p-6
                  space-y-2
                `}
              >
                <p className="text-lg font-black text-green-900">
                  ✅ MODO FÁCIL ACTIVADO
                </p>
                <p className="text-base font-semibold text-slate-800">
                  Todos los textos, botones y espacios se ven más grandes ahora.
                </p>
                <p className="text-sm text-slate-700">
                  Presiona TAB para navegar • ESC para cerrar
                </p>
              </div>
            )}

            {/* RESTABLECER */}
            <button
              type="button"
              onClick={() => {
                onSetTextSize("normal");
                if (isAccessible) onToggleAccessible();
                if (isHighContrast) onToggleContrast();
                if (isVoiceEnabled) onToggleVoice();
                if (isSoundEnabled) onToggleSound();
                speak("Ajustes restablecidos");
              }}
              className={`
                w-full min-h-[56px] rounded-xl border font-bold transition
                focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4
                ${isAccessible
                  ? "text-lg border-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 focus-visible:outline-blue-500"
                  : "text-base border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-blue-300"
                }
              `}
            >
              {isAccessible ? "🔄 RESTABLECER TODO" : "Restablecer ajustes"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AccessibilityPanel;
