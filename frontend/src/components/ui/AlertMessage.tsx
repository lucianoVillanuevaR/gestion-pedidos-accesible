import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

type AlertMessageTone = "error" | "success" | "info";

type AlertMessageProps = {
  children?: ReactNode;
  className?: string;
  id?: string;
  isHighContrast?: boolean;
  isLarge?: boolean;
  message?: string;
  tone?: AlertMessageTone;
};

const toneClasses: Record<AlertMessageTone, string> = {
  error: "border-red-800 bg-red-700 text-white",
  info: "border-slate-200 bg-white text-slate-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950"
};

const icons = {
  error: AlertTriangle,
  info: Info,
  success: CheckCircle2
};

function AlertMessage({
  children,
  className = "",
  id,
  isHighContrast = false,
  isLarge = false,
  message,
  tone = "error"
}: AlertMessageProps) {
  const Icon = icons[tone];
  const role = tone === "error" ? "alert" : "status";

  return (
    <div
      id={id}
      className={`flex items-start gap-3 rounded-2xl border p-4 ${
        isHighContrast ? "contrast-panel" : toneClasses[tone]
      } ${className}`}
      role={role}
      aria-live={tone === "error" ? undefined : "polite"}
    >
      <Icon className={`mt-1 shrink-0 ${isLarge ? "h-6 w-6" : "h-5 w-5"}`} aria-hidden="true" />
      <p className={isLarge ? "text-lg font-black" : "font-bold"}>{children ?? message}</p>
    </div>
  );
}

export default AlertMessage;
