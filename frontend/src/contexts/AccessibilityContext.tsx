import { createContext, useContext, type PropsWithChildren } from "react";
import useAccessibility from "../hooks/useAccessibility";

type AccessibilityContextValue = ReturnType<typeof useAccessibility>;

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function AccessibilityProvider({ children }: PropsWithChildren) {
  const accessibility = useAccessibility();

  return (
    <AccessibilityContext.Provider value={accessibility}>
      {children}
    </AccessibilityContext.Provider>
  );
}

function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);

  if (!context) {
    throw new Error("useAccessibilityContext must be used within AccessibilityProvider");
  }

  return context;
}

export { AccessibilityProvider, useAccessibilityContext };