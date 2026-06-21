import { createContext, useContext, type PropsWithChildren } from "react";
import useAccessibility, { type AccessibilityState } from "../hooks/useAccessibility";

const AccessibilityContext = createContext<AccessibilityState | null>(null);

function AccessibilityProvider({ children }: PropsWithChildren) {
  const accessibility = useAccessibility();

  return <AccessibilityContext.Provider value={accessibility}>{children}</AccessibilityContext.Provider>;
}

function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);

  if (!context) {
    throw new Error("useAccessibilityContext must be used within AccessibilityProvider");
  }

  return context;
}

export { AccessibilityProvider, useAccessibilityContext };
