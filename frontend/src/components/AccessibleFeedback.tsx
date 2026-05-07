/**
 * Retroalimentación visual accesible con:
 * - Iconos y texto claros
 * - Alto contraste
 * - Duración configurable
 */

import { useEffect, useState } from "react";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";

export interface FeedbackConfig {
  type: "success" | "error" | "info" | "warning";
  message: string;
  title?: string;
  duration?: number;
  ariaLive?: "polite" | "assertive";
}

interface AccessibleFeedbackProps extends FeedbackConfig {
  onClose?: () => void;
  visible?: boolean;
}

export default function AccessibleFeedback({
  type,
  message,
  title,
  duration = 5000,
  ariaLive = "polite",
  visible = true,
  onClose
}: AccessibleFeedbackProps) {
  const { isAccessible, isHighContrast } = useAccessibilityContext();
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (!isVisible || duration === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  if (!isVisible) {
    return null;
  }

  const typeConfig = {
    success: {
      icon: "✅",
      bgClass: isAccessible
        ? "bg-white border-3 border-green-900"
        : isHighContrast
          ? "bg-green-50 border-2 border-green-700"
          : "bg-green-50 border-2 border-green-200",
      textClass: isAccessible ? "text-slate-900" : "text-green-900"
    },
    error: {
      icon: "❌",
      bgClass: isAccessible
        ? "bg-white border-3 border-red-900"
        : isHighContrast
          ? "bg-red-50 border-2 border-red-700"
          : "bg-red-50 border-2 border-red-200",
      textClass: isAccessible ? "text-slate-900" : "text-red-900"
    },
    info: {
      icon: "ℹ️",
      bgClass: isAccessible
        ? "bg-white border-3 border-blue-900"
        : isHighContrast
          ? "bg-blue-50 border-2 border-blue-700"
          : "bg-blue-50 border-2 border-blue-200",
      textClass: isAccessible ? "text-slate-900" : "text-blue-900"
    },
    warning: {
      icon: "⚠️",
      bgClass: isAccessible
        ? "bg-white border-3 border-amber-900"
        : isHighContrast
          ? "bg-amber-50 border-2 border-amber-700"
          : "bg-amber-50 border-2 border-amber-200",
      textClass: isAccessible ? "text-slate-900" : "text-amber-900"
    }
  };

  const config = typeConfig[type];
  const titleClass = isAccessible ? "text-lg" : "text-base";
  const paddingClass = isAccessible ? "p-6" : "p-4";
  const gapClass = isAccessible ? "gap-4" : "gap-3";
  const iconSizeClass = isAccessible ? "text-3xl" : "text-2xl";

  return (
    <div
      role="alert"
      aria-live={ariaLive}
      aria-atomic="true"
      className={`
        fixed bottom-20 right-4 max-w-sm
        ${config.bgClass}
        rounded-xl ${paddingClass} shadow-xl
        flex ${gapClass} items-start
        animate-in fade-in slide-in-from-bottom-4 duration-300 z-40
      `}
    >
      <span className={`flex-shrink-0 ${iconSizeClass}`}>{config.icon}</span>
      <div className="flex-1 min-w-0">
        {title && (
          <p
            className={`font-bold ${config.textClass} ${titleClass}`}
          >
            {title}
          </p>
        )}
        <p
          className={`${config.textClass} ${
            isAccessible ? "text-base" : "text-sm"
          } ${title ? "mt-1" : ""}`}
        >
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className={`
          flex-shrink-0 text-2xl font-bold
          ${config.textClass} opacity-70 hover:opacity-100
          transition focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-blue-500
        `}
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  );
}
