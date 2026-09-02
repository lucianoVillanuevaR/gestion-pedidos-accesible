import { useRef, type ReactNode } from "react";
import { FOCUS_VISIBLE_CLASS } from "../../../constants/ui";
import useAccessibleDialog from "../../../hooks/useAccessibleDialog";

type ConfirmDialogProps = {
  children?: ReactNode;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  title: string;
};

function ConfirmDialog({
  children,
  description,
  onCancel,
  onConfirm,
  primaryDisabled = false,
  primaryLabel,
  title,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  useAccessibleDialog({
    containerRef: dialogRef,
    initialFocusRef: cancelButtonRef,
    onClose: onCancel,
  });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 px-4 backdrop-blur-[1px] no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdv-confirm-title"
      aria-describedby="pdv-confirm-description"
      ref={dialogRef}
      tabIndex={-1}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2
            id="pdv-confirm-title"
            className="text-xl font-black text-slate-950"
          >
            {title}
          </h2>
          <p
            id="pdv-confirm-description"
            className="mt-2 text-sm font-bold text-slate-600"
          >
            {description}
          </p>
        </div>
        <div className="space-y-4 p-5">{children}</div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className={`min-h-[46px] rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={primaryDisabled}
            className={`min-h-[46px] rounded-xl border border-slate-900 bg-slate-900 px-4 font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
