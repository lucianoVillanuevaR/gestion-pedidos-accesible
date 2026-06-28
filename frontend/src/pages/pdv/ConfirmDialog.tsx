import type { ReactNode } from "react";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";

type ConfirmDialogProps = {
  children?: ReactNode;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  primaryLabel: string;
  title: string;
};

function ConfirmDialog({ children, description, onCancel, onConfirm, primaryLabel, title }: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdv-confirm-title"
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 id="pdv-confirm-title" className="text-xl font-black text-slate-950">
            {title}
          </h2>
          <p className="mt-2 text-sm font-bold text-slate-600">{description}</p>
        </div>
        <div className="space-y-4 p-5">{children}</div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onCancel}
            className={`min-h-[46px] rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[46px] rounded-xl border border-slate-900 bg-slate-900 px-4 font-black text-white transition hover:bg-black ${FOCUS_VISIBLE_CLASS}`}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
