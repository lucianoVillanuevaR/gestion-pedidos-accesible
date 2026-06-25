import { LoaderCircle } from "lucide-react";

type LoadingStateProps = {
  className?: string;
  iconClassName?: string;
  label: string;
  labelClassName?: string;
};

function LoadingState({
  className = "rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
  iconClassName = "h-8 w-8",
  label,
  labelClassName = "font-black"
}: LoadingStateProps) {
  return (
    <div className={`flex min-h-[260px] items-center justify-center ${className}`}>
      <LoaderCircle className={`${iconClassName} animate-spin`} aria-hidden="true" />
      <span className={`ml-3 ${labelClassName}`}>{label}</span>
    </div>
  );
}

export default LoadingState;
