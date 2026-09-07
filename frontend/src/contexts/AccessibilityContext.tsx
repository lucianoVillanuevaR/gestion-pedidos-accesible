import { createContext, useContext, type PropsWithChildren } from "react";
import { useInRouterContext, useLocation } from "react-router-dom";
import { isEasyRoute } from "../config/navigation";
import useAccessibility, { type AccessibilityState } from "../hooks/useAccessibility";

const AccessibilityContext = createContext<AccessibilityState | null>(null);

function AccessibilityProvider({ children }: PropsWithChildren) {
  const accessibility = useAccessibility();
  const isInRouter = useInRouterContext();

  if (isInRouter) {
    return (
      <RouteScopedAccessibilityProvider accessibility={accessibility}>{children}</RouteScopedAccessibilityProvider>
    );
  }

  return <AccessibilityContext.Provider value={accessibility}>{children}</AccessibilityContext.Provider>;
}

function RouteScopedAccessibilityProvider({
  accessibility,
  children
}: PropsWithChildren<{ accessibility: AccessibilityState }>) {
  const location = useLocation();
  const contextualAccessibility = {
    ...accessibility,
    // Keep the stored preference intact, but expose its visual effect only in PDV.
    isAccessible: accessibility.isAccessible && isEasyRoute(location.pathname)
  };

  return <AccessibilityContext.Provider value={contextualAccessibility}>{children}</AccessibilityContext.Provider>;
}

function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);

  if (!context) {
    throw new Error("useAccessibilityContext must be used within AccessibilityProvider");
  }

  return context;
}

export { AccessibilityProvider, useAccessibilityContext };
