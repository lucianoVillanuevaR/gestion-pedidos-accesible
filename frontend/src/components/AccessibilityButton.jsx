function AccessibilityButton({
  isAccessible,
  textSize,
  isHighContrast,
  isVoiceEnabled,
  isOpen,
  onOpen
}) {
  const statusText = isAccessible ? "Modo ACTIVADO" : "Modo NORMAL";
  const voiceText = isVoiceEnabled ? "Voz ON" : "Voz OFF";
  const contrastText = isHighContrast ? "Contraste alto" : "Contraste normal";

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <button
        type="button"
        aria-label="Abrir panel de accesibilidad"
        aria-expanded={isOpen}
        onClick={onOpen}
        className={`flex min-h-[58px] items-center gap-3 rounded-full border px-4 py-3 text-left font-bold shadow-xl transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 sm:min-h-[64px] sm:px-5 ${
          isAccessible || isOpen
            ? "border-slate-700 bg-white text-slate-900 hover:bg-slate-50 focus-visible:outline-blue-700"
            : "border-blue-700 bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-300"
        }`}
        title="Abrir panel de accesibilidad"
      >
        <span
          aria-hidden="true"
          className={`grid h-9 w-9 place-items-center rounded-full text-lg ${
            isAccessible || isOpen ? "bg-slate-100 text-slate-900" : "bg-white/15 text-white"
          }`}
        >
          ♿
        </span>
        <span className="leading-tight">
          <span className="block text-base sm:text-lg">Accesibilidad</span>
          <span className="block text-xs font-medium opacity-90 sm:text-sm">
            {statusText}
          </span>
          <span className="block text-[11px] font-medium opacity-80 sm:text-xs">
            {voiceText} · {contrastText} · {textSize === "large" ? "Texto grande" : textSize === "small" ? "Texto pequeño" : "Texto normal"}
          </span>
        </span>
      </button>
    </div>
  );
}

export default AccessibilityButton;
