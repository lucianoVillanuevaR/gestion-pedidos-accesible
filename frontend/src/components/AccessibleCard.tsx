/**
 * Tarjeta accesible con:
 * - Contraste AA mínimo
 * - Bordes claros en modo accesible
 * - Espaciado generoso
 * - Soporte semántico
 */

import { useAccessibilityContext } from "../contexts/AccessibilityContext";

interface AccessibleCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  variant?: "default" | "highlighted" | "warning";
}

export default function AccessibleCard({
  title,
  subtitle,
  variant = "default",
  className = "",
  children,
  ...props
}: AccessibleCardProps) {
  const { isAccessible, isHighContrast } = useAccessibilityContext();

  const baseClasses = isAccessible
    ? "bg-white border-3 border-slate-900 rounded-2xl shadow-lg"
    : isHighContrast
      ? "bg-white border-2 border-slate-900 rounded-xl shadow-md"
      : "bg-white border-1 border-slate-200 rounded-lg shadow-sm";

  const variantClasses = {
    default: "",
    highlighted: isAccessible
      ? "border-blue-900 bg-blue-50"
      : isHighContrast
        ? "border-blue-700 bg-blue-50"
        : "border-blue-200 bg-blue-50",
    warning: isAccessible
      ? "border-amber-900 bg-amber-50"
      : isHighContrast
        ? "border-amber-700 bg-amber-50"
        : "border-amber-200 bg-amber-50"
  };

  const paddingClass = isAccessible ? "p-6" : "p-4";

  const finalClassName = [
    baseClasses,
    variantClasses[variant],
    paddingClass,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={finalClassName} {...props}>
      {title && (
        <div>
          <h3
            className={`font-bold text-slate-900 ${
              isAccessible ? "text-2xl mb-2" : "text-lg mb-1"
            }`}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className={`text-slate-600 ${
                isAccessible ? "text-base" : "text-sm"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </article>
  );
}
