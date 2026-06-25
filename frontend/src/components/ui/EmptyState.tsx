import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  message: string;
  title: string;
};

function EmptyState({
  action,
  className = "rounded-[18px] border border-slate-200 bg-white p-8 text-center shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
  icon: Icon,
  iconClassName = "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-200 bg-[#FFF8DC] text-slate-950",
  message,
  title
}: EmptyStateProps) {
  return (
    <div className={className}>
      {Icon && (
        <div className={iconClassName}>
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
      )}
      <p className="mt-5 text-2xl font-black text-slate-950">{title}</p>
      <p className="mt-3 font-bold text-slate-600">{message}</p>
      {action}
    </div>
  );
}

export default EmptyState;
