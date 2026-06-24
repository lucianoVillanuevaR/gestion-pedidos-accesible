import { AlertTriangle } from "lucide-react";

type ErrorAlertProps = {
  isHighContrast?: boolean;
  isLarge?: boolean;
  message: string;
};

function ErrorAlert({ isHighContrast = false, isLarge = false, message }: ErrorAlertProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${isHighContrast ? "contrast-panel" : "border-red-200 bg-red-50 text-red-950"}`}
      role="alert"
    >
      <AlertTriangle className={`mt-1 shrink-0 ${isLarge ? "h-6 w-6" : "h-5 w-5"}`} aria-hidden="true" />
      <p className={isLarge ? "text-lg font-black" : "font-bold"}>{message}</p>
    </div>
  );
}

export default ErrorAlert;
