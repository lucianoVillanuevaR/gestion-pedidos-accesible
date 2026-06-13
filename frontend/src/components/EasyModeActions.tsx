import { ArrowLeftCircle, HelpCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";

type EasyModeActionsProps = {
  className?: string;
  confirmHome?: boolean;
  confirmExit?: boolean;
  homeLabel?: string;
  showHelp?: boolean;
  showHome?: boolean;
};

const FOCUS_CLASS = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900 focus-visible:ring-offset-2";

function EasyModeActions({
  className = "",
  confirmHome = false,
  confirmExit = false,
  homeLabel = "Inicio modo fácil",
  showHelp = true,
  showHome = true
}: EasyModeActionsProps) {
  const navigate = useNavigate();
  const { isHighContrast, isPanelOpen, openAccessibilityPanel, setAccessibleMode } = useAccessibilityContext();

  const secondaryClass = isHighContrast
    ? "contrast-button-secondary"
    : "border-slate-300 bg-white text-slate-950 hover:border-slate-900 hover:bg-slate-50";
  const primaryClass = isHighContrast
    ? "contrast-button-secondary"
    : "border-slate-900 bg-slate-900 text-white hover:bg-black";

  const goHome = () => {
    if (confirmHome && !window.confirm("Hay un pedido en proceso. ¿Deseas volver al inicio?")) {
      return;
    }

    navigate("/modo-facil");
  };

  const exitEasyMode = () => {
    if (confirmExit && !window.confirm("Hay un pedido en proceso. ¿Deseas salir del modo fácil?")) {
      return;
    }

    setAccessibleMode(false);
    navigate("/pdv", { replace: true });
  };

  const actionCount = (showHome ? 1 : 0) + 1 + (showHelp ? 1 : 0);
  const gridClass = actionCount >= 3
    ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
    : "grid gap-3 sm:grid-cols-2";

  return (
    <div className={`${gridClass} ${className}`}>
      {showHome && (
        <button
          type="button"
          onClick={goHome}
          aria-label="Volver al inicio del modo fácil"
          className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-black transition ${secondaryClass} ${FOCUS_CLASS}`}
        >
          <Home className="h-6 w-6" aria-hidden="true" />
          {homeLabel}
        </button>
      )}

      <button
        type="button"
        onClick={exitEasyMode}
        aria-label="Salir del modo fácil y volver al modo normal"
        className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-black transition ${primaryClass} ${FOCUS_CLASS}`}
      >
        <ArrowLeftCircle className="h-6 w-6" aria-hidden="true" />
        Salir del modo fácil
      </button>

      {showHelp && (
        <button
          type="button"
          onClick={openAccessibilityPanel}
          aria-haspopup="dialog"
          aria-expanded={isPanelOpen}
          aria-label="Abrir opciones de ayuda"
          className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-black transition ${secondaryClass} ${FOCUS_CLASS}`}
        >
          <HelpCircle className="h-6 w-6" aria-hidden="true" />
          Opciones de ayuda
        </button>
      )}
    </div>
  );
}

export default EasyModeActions;
