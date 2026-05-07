/**
 * Botón accesible con:
 * - Contraste AA/AAA
 * - Soporte teclado completo
 * - Adaptación a modo accesible
 */

import { useAccessibilityContext } from "../contexts/AccessibilityContext";

interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  icon?: React.ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
}

export default function AccessibleButton({
  variant = "primary",
  size = "medium",
  icon,
  fullWidth = false,
  isLoading = false,
  className = "",
  children,
  ariaLabel,
  disabled,
  ...props
}: AccessibleButtonProps) {
  const { isAccessible, isHighContrast } = useAccessibilityContext();

  // Mapeo de clases base según tamaño
  const sizeClasses = {
    small: isAccessible ? "px-4 py-2 text-base" : "px-3 py-1.5 text-sm",
    medium: isAccessible ? "px-6 py-3 text-lg" : "px-4 py-2 text-base",
    large: isAccessible ? "px-8 py-4 text-2xl" : "px-6 py-3 text-lg"
  };

  // Mapeo de colores según variante
  const variantClasses = {
    primary: isAccessible
      ? "bg-slate-900 text-white border-2 border-slate-900 hover:bg-slate-800"
      : isHighContrast
        ? "bg-blue-700 text-white border-2 border-blue-700 hover:bg-blue-800"
        : "bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700",
    secondary: isAccessible
      ? "bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-100"
      : isHighContrast
        ? "bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-100"
        : "bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-50",
    danger: isAccessible
      ? "bg-red-700 text-white border-2 border-red-700 hover:bg-red-800"
      : isHighContrast
        ? "bg-red-700 text-white border-2 border-red-700 hover:bg-red-800"
        : "bg-red-600 text-white border-2 border-red-600 hover:bg-red-700"
  };

  const focusClass =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";

  const widthClass = fullWidth ? "w-full" : "";

  const finalClassName = [
    "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition",
    "min-h-[48px]",
    sizeClasses[size],
    variantClasses[variant],
    focusClass,
    disabledClass,
    widthClass,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={finalClassName}
      aria-label={ariaLabel || (typeof children === "string" ? children : undefined)}
      disabled={disabled || isLoading}
      {...props}
    >
      {icon && !isLoading && <span className="flex items-center">{icon}</span>}
      {isLoading && <span className="animate-spin">⏳</span>}
      {children}
    </button>
  );
}
