import { ArrowLeftCircle, HelpCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import useActionVoice from "../hooks/useActionVoice";

type EasyModeActionsProps = {
  className?: string;
  compact?: boolean;
  confirmHome?: boolean;
  confirmExit?: boolean;
  homeLabel?: string;
  showHelp?: boolean;
  showHome?: boolean;
};

const FOCUS_CLASS =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900 focus-visible:ring-offset-2";

function EasyModeActions({
  className = "",
  compact = false,
  confirmHome = false,
  confirmExit = false,
  homeLabel = "Inicio modo fácil",
  showHelp = true,
  showHome = true
}: EasyModeActionsProps) {
  const navigate = useNavigate();
  const { isHighContrast, isPanelOpen, isVoiceEnabled, openAccessibilityPanel, setAccessibleMode } =
    useAccessibilityContext();
  const { speakAction } = useActionVoice(isVoiceEnabled);

  const secondaryClass = isHighContrast
    ? "contrast-button-secondary"
    : "border-slate-300 bg-white text-slate-950 hover:border-slate-900 hover:bg-slate-50";
  const primaryClass = secondaryClass;

  const goHome = () => {
    if (confirmHome && !window.confirm("Hay un pedido en proceso. ¿Deseas volver al inicio?")) {
      return;
    }

    speakAction("Inicio modo fácil.", "easy-mode-home");
    navigate("/modo-facil");
  };

  const exitEasyMode = () => {
    if (confirmExit && !window.confirm("Hay un pedido en proceso. ¿Deseas salir del modo fácil?")) {
      return;
    }

    speakAction("Salir del modo fácil.", "easy-mode-exit");
    setAccessibleMode(false);
    navigate("/pdv", { replace: true });
  };

  const openHelp = () => {
    speakAction("Opciones de ayuda.", "easy-mode-help");
    openAccessibilityPanel();
  };

  const actionCount = (showHome ? 1 : 0) + 1 + (showHelp ? 1 : 0);
  const gridClass = actionCount >= 3 ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-3 sm:grid-cols-2";
  const buttonClass = compact ? "min-h-[48px] rounded-xl px-3 text-base" : "min-h-[56px] rounded-2xl px-4 text-lg";
  const iconClass = compact ? "h-5 w-5" : "h-6 w-6";

  return (
    <div className={`${gridClass} ${className}`}>
      {showHome && (
        <button
          type="button"
          onClick={goHome}
          aria-label="Volver al inicio del modo fácil"
          className={`inline-flex items-center justify-center gap-2 border-2 font-black transition ${buttonClass} ${secondaryClass} ${FOCUS_CLASS}`}
        >
          <Home className={iconClass} aria-hidden="true" />
          {compact ? "Inicio" : homeLabel}
        </button>
      )}

      <button
        type="button"
        onClick={exitEasyMode}
        aria-label="Salir del modo fácil y volver al modo normal"
        className={`inline-flex items-center justify-center gap-2 border-2 font-black transition ${buttonClass} ${primaryClass} ${FOCUS_CLASS}`}
      >
        <ArrowLeftCircle className={iconClass} aria-hidden="true" />
        {compact ? "Salir" : "Salir del modo fácil"}
      </button>

      {showHelp && (
        <button
          type="button"
          onClick={openHelp}
          aria-haspopup="dialog"
          aria-expanded={isPanelOpen}
          aria-label="Abrir opciones de ayuda"
          className={`inline-flex items-center justify-center gap-2 border-2 font-black transition ${buttonClass} ${secondaryClass} ${FOCUS_CLASS}`}
        >
          <HelpCircle className={iconClass} aria-hidden="true" />
          {compact ? "Ayuda" : "Opciones de ayuda"}
        </button>
      )}
    </div>
  );
}

export default EasyModeActions;
