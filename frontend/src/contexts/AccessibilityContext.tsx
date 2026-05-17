import { createContext, useContext, type PropsWithChildren } from "react";
import useAccessibility from "../hooks/useAccessibility";

type AccessibilityTextSize = "small" | "normal" | "large";

type AccessibilityContextValue = {
  isPanelOpen: boolean;
  isAccessible: boolean;
  textSize: AccessibilityTextSize;
  isHighContrast: boolean;
  isVoiceEnabled: boolean;
  isSoundEnabled: boolean;
  prefersReducedMotion: boolean;
  setTextSize: (value: AccessibilityTextSize) => void;
  openAccessibilityPanel: () => void;
  closeAccessibilityPanel: () => void;
  toggleAccessibility: () => void;
  toggleHighContrast: () => void;
  toggleVoiceEnabled: () => void;
  toggleSoundEnabled: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function AccessibilityProvider({ children }: PropsWithChildren) {
  const accessibility = useAccessibility() as AccessibilityContextValue;

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
