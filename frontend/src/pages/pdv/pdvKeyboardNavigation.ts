export type PdvKeyboardAction = "next" | "previous" | "reset";

export function getPdvKeyboardAction(key: string, documentRef: Document = document): PdvKeyboardAction | null {
  if (documentRef.querySelector('[role="dialog"][aria-modal="true"]')) {
    return null;
  }

  if (key === "Escape") return "reset";
  if (key === "ArrowRight") return "next";
  if (key === "ArrowLeft") return "previous";
  return null;
}
