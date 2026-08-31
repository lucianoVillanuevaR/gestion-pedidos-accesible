import { useRef, useState, type ReactNode } from "react";
import {
  Check,
  Contrast,
  RotateCcw,
  Sparkles,
  Type,
  Volume2,
  X,
} from "lucide-react";
import type {
  AccessibilityTextSize,
  SoundVolumeLevel,
} from "../constants/accessibility";
import useAccessibleDialog from "../hooks/useAccessibleDialog";
import useVoice from "../hooks/useVoice";
import { playSoundFeedback } from "../hooks/useSoundFeedback";

type AccessibilityPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  isAccessible: boolean;
  textSize: AccessibilityTextSize;
  isHighContrast: boolean;
  isVoiceEnabled: boolean;
  isSoundEnabled: boolean;
  soundVolume: SoundVolumeLevel;
  isVoiceSupported?: boolean;
  onToggleAccessible: () => void;
  onSetTextSize: (value: AccessibilityTextSize) => void;
  onToggleContrast: () => void;
  onToggleVoice: () => void;
  onToggleSound: () => void;
  onSetSoundVolume: (value: SoundVolumeLevel) => void;
  onReset: () => void;
};

type AccessibilityToggleProps = {
  checked: boolean;
  description: string;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onChange: () => void;
};

const focusClass =
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-yellow-400";

function AccessibilityToggle({
  checked,
  description,
  disabled = false,
  icon,
  label,
  onChange,
}: AccessibilityToggleProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-slate-900"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-bold leading-snug text-slate-900">{label}</p>
          <p className="mt-1 text-sm leading-snug text-slate-600">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label}: ${checked ? "Activado" : "Desactivado"}`}
        disabled={disabled}
        onClick={onChange}
        className={`inline-flex min-h-11 min-w-[92px] shrink-0 items-center gap-1.5 rounded-full border-2 px-2 py-1 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${focusClass} ${
          checked
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-400 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
            checked
              ? "order-2 border-white bg-[#FECE00] text-slate-950"
              : "border-slate-400 bg-slate-100"
          }`}
          aria-hidden="true"
        >
          {checked && <Check className="h-4 w-4" strokeWidth={3} />}
        </span>
        <span className="text-xs">{checked ? "Sí" : "No"}</span>
      </button>
    </div>
  );
}

function AccessibilityPanel({
  isOpen,
  onClose,
  isAccessible,
  textSize,
  isHighContrast,
  isVoiceEnabled,
  isSoundEnabled,
  soundVolume,
  isVoiceSupported = true,
  onToggleAccessible,
  onSetTextSize,
  onToggleContrast,
  onToggleVoice,
  onToggleSound,
  onSetSoundVolume,
  onReset,
}: AccessibilityPanelProps) {
  const { cancel, speak } = useVoice({ enabled: true });
  const [statusMessage, setStatusMessage] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useAccessibleDialog({
    containerRef: dialogRef,
    enabled: isOpen,
    initialFocusRef: closeButtonRef,
    onClose,
  });

  if (!isOpen) return null;

  const announcePanelAction = (message: string, dedupeKey: string) => {
    if (!isVoiceEnabled) return;
    speak(message, {
      priority: "high",
      dedupeKey,
      cooldownMs: 700,
      force: true,
      interrupt: true,
      delayMs: 0,
    });
  };

  const handleToggleVoice = () => {
    cancel();
    speak(
      isVoiceEnabled ? "Ayuda por voz desactivada." : "Ayuda por voz activada.",
      {
        priority: "high",
        dedupeKey: "voice-toggle-confirmation",
        force: true,
        interrupt: true,
        delayMs: 0,
      },
    );
    onToggleVoice();
  };

  const handleReset = () => {
    if (!window.confirm("¿Restablecer todos los ajustes de accesibilidad?"))
      return;
    cancel();
    onReset();
    setStatusMessage("Ajustes de accesibilidad restablecidos.");
  };

  const sizeOptions: Array<{
    value: AccessibilityTextSize;
    label: string;
    name: string;
  }> = [
    { value: "small", label: "A-", name: "Pequeño" },
    { value: "normal", label: "A", name: "Normal" },
    { value: "large", label: "A+", name: "Grande" },
  ];
  const volumeOptions: Array<{ value: SoundVolumeLevel; label: string }> = [
    { value: "soft", label: "Suave" },
    { value: "normal", label: "Normal" },
    { value: "loud", label: "Fuerte" },
  ];
  const sectionTitleClass = `font-black text-slate-900 ${isAccessible ? "text-xl" : "text-lg"}`;
  const optionButtonClass = (selected: boolean) =>
    `relative min-h-12 rounded-lg border-2 px-2 py-2 font-bold transition ${focusClass} ${
      selected
        ? "border-slate-900 bg-[#FECE00] text-slate-950"
        : "border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:bg-slate-50"
    }`;

  return (
    <div
      className="fixed inset-0 z-[200] bg-slate-950/35 no-print sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-panel-title"
        tabIndex={-1}
        className={`ml-auto flex h-full w-full max-w-[460px] flex-col overflow-hidden bg-white shadow-2xl sm:rounded-2xl ${
          isAccessible ? "border-2 border-slate-900" : "border border-slate-200"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="z-10 shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="accessibility-panel-title"
                className="text-2xl font-black leading-tight text-slate-900"
              >
                Opciones de accesibilidad
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => {
                announcePanelAction(
                  "Cerrar panel de accesibilidad.",
                  "accessibility-panel-close",
                );
                onClose();
              }}
              aria-label="Cerrar panel de accesibilidad"
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-slate-400 bg-white px-3 font-bold text-slate-800 transition hover:bg-slate-100 ${focusClass}`}
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span>Cerrar</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          <div className="space-y-5">
            <section aria-labelledby="quick-settings-title">
              <h3 id="quick-settings-title" className={sectionTitleClass}>
                Ajustes rápidos
              </h3>
              <div className="mt-3 divide-y divide-slate-200">
                <AccessibilityToggle
                  checked={isAccessible}
                  label="Modo fácil"
                  description="Simplifica la interfaz."
                  icon={<Sparkles className="h-5 w-5" />}
                  onChange={() => {
                    announcePanelAction(
                      isAccessible
                        ? "Modo fácil desactivado."
                        : "Modo fácil activado.",
                      "accessibility-panel-easy-mode",
                    );
                    onToggleAccessible();
                  }}
                />
                <AccessibilityToggle
                  checked={isHighContrast}
                  label="Contraste alto"
                  description="Mejora la visibilidad."
                  icon={<Contrast className="h-5 w-5" />}
                  onChange={() => {
                    announcePanelAction(
                      isHighContrast
                        ? "Contraste alto desactivado."
                        : "Contraste alto activado.",
                      "accessibility-panel-contrast",
                    );
                    onToggleContrast();
                  }}
                />
                <AccessibilityToggle
                  checked={isVoiceEnabled}
                  disabled={!isVoiceSupported}
                  label="Ayuda por voz"
                  description="Lee acciones importantes."
                  icon={<Volume2 className="h-5 w-5" />}
                  onChange={handleToggleVoice}
                />
                {!isVoiceSupported && (
                  <p
                    className="py-3 text-sm font-semibold text-amber-900"
                    role="status"
                  >
                    La ayuda por voz no está disponible en este navegador.
                  </p>
                )}
                <AccessibilityToggle
                  checked={isSoundEnabled}
                  label="Sonidos"
                  description="Reproduce avisos."
                  icon={<Volume2 className="h-5 w-5" />}
                  onChange={() => {
                    announcePanelAction(
                      isSoundEnabled
                        ? "Sonidos desactivados."
                        : "Sonidos activados.",
                      "accessibility-panel-sound",
                    );
                    onToggleSound();
                    if (!isSoundEnabled)
                      void playSoundFeedback("success", soundVolume);
                  }}
                />
              </div>
            </section>

            <section
              className="border-t border-slate-200 pt-5"
              aria-labelledby="text-settings-title"
            >
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-yellow-700" aria-hidden="true" />
                <h3 id="text-settings-title" className={sectionTitleClass}>
                  Texto
                </h3>
              </div>
              <fieldset className="mt-3">
                <legend className="font-bold text-slate-900">
                  Tamaño del texto
                </legend>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {sizeOptions.map((option) => {
                    const selected = textSize === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`Tamaño ${option.name}`}
                        onClick={() => {
                          announcePanelAction(
                            `Tamaño de texto ${option.name}.`,
                            `accessibility-panel-text-size:${option.value}`,
                          );
                          onSetTextSize(option.value);
                        }}
                        className={optionButtonClass(selected)}
                      >
                        {selected && (
                          <Check
                            className="mr-1 inline h-4 w-4"
                            aria-hidden="true"
                          />
                        )}
                        {option.label}
                        <span className="mt-0.5 block text-xs font-semibold">
                          {option.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </section>

            {isSoundEnabled && (
              <section
                className="border-t border-slate-200 pt-5"
                aria-labelledby="sound-settings-title"
              >
                <div className="flex items-center gap-2">
                  <Volume2
                    className="h-5 w-5 text-yellow-700"
                    aria-hidden="true"
                  />
                  <h3 id="sound-settings-title" className={sectionTitleClass}>
                    Sonido
                  </h3>
                </div>
                <fieldset className="mt-3">
                  <legend className="font-bold text-slate-900">Volumen</legend>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {volumeOptions.map((option) => {
                      const selected = soundVolume === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => onSetSoundVolume(option.value)}
                          className={optionButtonClass(selected)}
                        >
                          {selected && (
                            <Check
                              className="mr-1 inline h-4 w-4"
                              aria-hidden="true"
                            />
                          )}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="sr-only" aria-live="polite">
                    Nivel seleccionado:{" "}
                    {
                      volumeOptions.find(
                        (option) => option.value === soundVolume,
                      )?.label
                    }
                    .
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void playSoundFeedback("success", soundVolume)
                    }
                    className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-400 bg-white px-4 font-bold text-slate-800 transition hover:bg-slate-100 ${focusClass}`}
                  >
                    <Volume2 className="h-5 w-5" aria-hidden="true" />
                    Probar sonido
                  </button>
                </fieldset>
              </section>
            )}

            <div className="border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={handleReset}
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-400 bg-white px-4 font-bold text-slate-800 transition hover:bg-slate-100 ${focusClass}`}
              >
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
                Restablecer ajustes
              </button>
              <p
                className="mt-3 text-sm font-semibold text-green-800"
                role="status"
                aria-live="polite"
              >
                {statusMessage}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AccessibilityPanel;
