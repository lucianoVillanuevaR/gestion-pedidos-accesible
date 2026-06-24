import { useEffect, useRef } from "react";
import type { AccessibilityTextSize } from "../constants/accessibility";
import useVoice from "../hooks/useVoice";

type AccessibilityPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  isAccessible: boolean;
  textSize: AccessibilityTextSize;
  isHighContrast: boolean;
  isVoiceEnabled: boolean;
  isSoundEnabled: boolean;
  onToggleAccessible: () => void;
  onSetTextSize: (value: AccessibilityTextSize) => void;
  onToggleContrast: () => void;
  onToggleVoice: () => void;
  onToggleSound: () => void;
};

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
  onToggleSound
}: AccessibilityPanelProps) {
  const { speak } = useVoice({ enabled: true });
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstElement || !dialogRef.current.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || !dialogRef.current.contains(activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const getButtonClass = (active: boolean) => {
    const baseClass =
      "min-h-[56px] rounded-xl border px-4 py-3 font-bold transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4";

    if (isAccessible) {
      return `${baseClass} text-lg ${
        active
          ? "border-slate-900 bg-slate-900 text-white focus-visible:outline-yellow-400"
          : "border-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 focus-visible:outline-yellow-400"
      }`;
    }

    return `${baseClass} text-base ${
      active
        ? "border-[#FECE00] bg-[#FECE00] text-slate-950 focus-visible:outline-yellow-300"
        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-yellow-300"
    }`;
  };

  const sectionClass = isAccessible
    ? "rounded-2xl border-3 border-slate-900 bg-white p-6 space-y-4"
    : "rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3";

  const titleClass = isAccessible ? "text-2xl" : "text-lg";
  const spacingClass = isAccessible ? "space-y-6" : "space-y-5";
  const headerPaddingClass = isAccessible ? "px-6 py-5" : "px-5 py-4";
  const contentPaddingClass = isAccessible ? "px-6 py-6" : "px-5 py-5";
  const handleToggleVoice = () => {
    if (!isVoiceEnabled) {
      speak("Ayuda por voz activada.", {
        priority: "high",
        dedupeKey: "voice-enabled-confirmation",
        force: true,
        interrupt: true,
        delayMs: 0
      });
    }

    onToggleVoice();
  };

  const sizeOptions: Array<{ value: AccessibilityTextSize; label: string; name: string }> = [
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
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 px-3 py-4 no-print sm:px-4" onClick={onClose} role="presentation">
      <aside
        ref={dialogRef}
        aria-modal="true"
        role="dialog"
        aria-label="Panel de opciones simples"
        tabIndex={-1}
        className={`
          ml-auto flex h-full w-full max-w-md flex-col overflow-hidden
          ${
            isAccessible
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
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-4">
            <div className="min-w-0">
              <p
                className={`
                  font-bold uppercase tracking-[0.16em]
                  ${isAccessible ? "text-xl text-slate-900" : "text-sm text-yellow-700"}
                `}
              >
                {isAccessible ? "OPCIONES SIMPLES" : "Accesibilidad"}
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
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de opciones"
              className={`
                inline-flex min-h-[56px] shrink-0 items-center justify-center whitespace-nowrap rounded-xl border px-3 font-bold transition sm:px-4
                focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4
                ${
                  isAccessible
                    ? "text-2xl border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-100 focus-visible:outline-yellow-400"
                    : "text-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-yellow-300"
                }
              `}
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto ${contentPaddingClass} sm:px-6`}>
          <div className={spacingClass}>
            <section className={sectionClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`font-black text-slate-900 ${titleClass}`}>
                    {isAccessible ? "MODO FÁCIL" : "Modo accesible"}
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
                  onClick={onToggleAccessible}
                  aria-label={isAccessible ? "Desactivar modo fácil" : "Activar modo fácil"}
                  aria-pressed={isAccessible}
                  className={getButtonClass(isAccessible)}
                >
                  <span className={isAccessible ? "text-2xl" : ""}>{isAccessible ? "ACTIVADO" : "ACTIVAR"}</span>
                </button>
              </div>
            </section>

            <section className={sectionClass}>
              <div>
                <h3 className={`font-black text-slate-900 ${titleClass}`}>
                  {isAccessible ? "TAMAÑO DE LETRAS" : "Tamaño de texto"}
                </h3>
                <p
                  className={`
                    mt-2 text-slate-700
                    ${isAccessible ? "text-lg font-semibold" : "text-sm"}
                  `}
                >
                  {isAccessible ? "Elige el tamaño que te sea más cómodo" : "Ajuste simple para leer mejor."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {sizeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSetTextSize(option.value);
                    }}
                    aria-label={`Tamaño de texto ${option.name}`}
                    aria-pressed={textSize === option.value}
                    className={getButtonClass(textSize === option.value)}
                  >
                    <span className={isAccessible ? "text-2xl" : ""}>{option.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className={sectionClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`font-black text-slate-900 ${titleClass}`}>
                    {isAccessible ? "CONTRASTE FUERTE" : "Contraste alto"}
                  </h3>
                  <p
                    className={`
                      mt-2 text-slate-700
                      ${isAccessible ? "text-lg font-semibold" : "text-sm"}
                    `}
                  >
                    {isAccessible ? "Colores más fuertes para ver mejor" : "Mejora la visibilidad de los elementos."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onToggleContrast}
                  aria-label={isHighContrast ? "Desactivar contraste alto" : "Activar contraste alto"}
                  aria-pressed={isHighContrast}
                  className={getButtonClass(isHighContrast)}
                >
                  <span className={isAccessible ? "text-2xl" : ""}>{isHighContrast ? "ACTIVADO" : "ACTIVAR"}</span>
                </button>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`font-black text-slate-900 ${titleClass}`}>
                    {isAccessible ? "AYUDA CON VOZ" : "Ayuda por voz"}
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
                  onClick={handleToggleVoice}
                  aria-label={isVoiceEnabled ? "Desactivar ayuda por voz" : "Activar ayuda por voz"}
                  aria-pressed={isVoiceEnabled}
                  className={getButtonClass(isVoiceEnabled)}
                >
                  <span className={isAccessible ? "text-2xl" : ""}>{isVoiceEnabled ? "ACTIVADO" : "ACTIVAR"}</span>
                </button>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`font-black text-slate-900 ${titleClass}`}>
                    {isAccessible ? "SONIDOS DE AYUDA" : "Sonidos"}
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
                  onClick={onToggleSound}
                  aria-label={isSoundEnabled ? "Desactivar sonidos" : "Activar sonidos"}
                  aria-pressed={isSoundEnabled}
                  className={getButtonClass(isSoundEnabled)}
                >
                  <span className={isAccessible ? "text-2xl" : ""}>{isSoundEnabled ? "ACTIVADO" : "ACTIVAR"}</span>
                </button>
              </div>
            </section>

            {isAccessible && (
              <div className="contrast-panel-soft space-y-2 rounded-2xl border-3 border-green-900 bg-green-50 p-6">
                <p className="contrast-important text-lg font-black text-green-900">MODO FÁCIL ACTIVADO</p>
                <p className="contrast-body-text text-base font-semibold text-slate-800">
                  Todos los textos, botones y espacios se ven más grandes ahora.
                </p>
                <p className="contrast-secondary-text text-sm text-slate-700">
                  Presiona TAB para navegar • ESC para cerrar
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onSetTextSize("normal");
                if (isAccessible) onToggleAccessible();
                if (isHighContrast) onToggleContrast();
                if (isVoiceEnabled) onToggleVoice();
                if (isSoundEnabled) onToggleSound();
              }}
              className={`
                w-full min-h-[56px] rounded-xl border font-bold transition
                focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4
                ${
                  isAccessible
                    ? "text-lg border-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 focus-visible:outline-yellow-400"
                    : "text-base border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-yellow-300"
                }
              `}
            >
              {isAccessible ? "RESTABLECER TODO" : "Restablecer ajustes"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AccessibilityPanel;
