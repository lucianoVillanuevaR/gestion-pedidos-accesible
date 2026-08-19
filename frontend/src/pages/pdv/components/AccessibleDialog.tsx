import { useRef, type ReactNode } from "react";
import useAccessibleDialog from "../../../hooks/useAccessibleDialog";

type AccessibleDialogProps = {
  children: ReactNode;
  labelId: string;
  onClose: () => void;
  panelClassName: string;
};

function AccessibleDialog({ children, labelId, onClose, panelClassName }: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useAccessibleDialog({ containerRef: dialogRef, onClose });

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-[1px] no-print"
    >
      <section className={panelClassName}>{children}</section>
    </div>
  );
}

export default AccessibleDialog;
