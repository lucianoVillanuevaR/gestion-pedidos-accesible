import AlertMessage from "../../components/ui/AlertMessage";
import type { FeedbackState } from "./PdvShared";

type PdvFeedbackMessageProps = {
  className?: string;
  feedback: FeedbackState;
  id?: string;
  isAccessible?: boolean;
  isHighContrast?: boolean;
  onRetry?: () => void;
};

function PdvFeedbackMessage({
  className = "",
  feedback,
  id,
  isAccessible = false,
  isHighContrast = false,
  onRetry
}: PdvFeedbackMessageProps) {
  const title = feedback.title ?? getDefaultTitle(feedback.type);

  return (
    <AlertMessage
      className={`animate-in fade-in slide-in-from-right-4 duration-300 ${className}`}
      id={id}
      isHighContrast={isHighContrast}
      isLarge={isAccessible}
      tone={feedback.type}
    >
      <span className="block">
        <span className={`block ${isAccessible ? "text-xl font-black" : "font-black"}`}>{title}</span>
        <span className={`mt-1 block ${isAccessible ? "text-lg font-bold" : "text-sm font-bold"}`}>
          {feedback.message}
        </span>
        {feedback.details && (
          <span className={`mt-2 block ${isAccessible ? "text-base font-semibold" : "text-xs font-semibold"}`}>
            {feedback.details}
          </span>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`mt-3 rounded-lg border px-4 py-2 font-black transition ${
              isHighContrast
                ? "contrast-button-secondary"
                : feedback.type === "error"
                  ? "border-white/80 bg-white text-red-800 hover:bg-red-50"
                  : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            }`}
          >
            Reintentar
          </button>
        )}
      </span>
    </AlertMessage>
  );
}

function getDefaultTitle(type: FeedbackState["type"]) {
  if (type === "success") return "Listo";
  if (type === "info") return "Información";
  return "Revisa el pedido";
}

export default PdvFeedbackMessage;
