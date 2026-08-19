import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(", ");

type AccessibleDialogOptions = {
  containerRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose?: () => void;
};

/**
 * Aplica el patrón de diálogo modal de WAI-ARIA: foco inicial, encierro con
 * Tab, cierre con Escape y restauración del foco al elemento que lo abrió.
 */
function useAccessibleDialog({ containerRef, enabled = true, initialFocusRef, onClose }: AccessibleDialogOptions) {
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableElements = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const initialElement = initialFocusRef?.current ?? focusableElements()[0] ?? container;

    initialElement.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = focusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstElement || !container.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || !container.contains(activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [containerRef, enabled, initialFocusRef, onClose]);
}

export default useAccessibleDialog;
