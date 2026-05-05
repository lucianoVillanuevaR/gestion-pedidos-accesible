import { useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import AccessibilityButton from "./components/AccessibilityButton";
import AccessibilityPanel from "./components/AccessibilityPanel";
import { AccessibilityProvider, useAccessibilityContext } from "./contexts/AccessibilityContext";
import useVoice from "./hooks/useVoice";

function AppShell() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const {
    isAccessible,
    textSize,
    isHighContrast,
    isVoiceEnabled,
    toggleAccessibility,
    setTextSize,
    toggleHighContrast,
    toggleVoiceEnabled
  } = useAccessibilityContext();
  const { speak } = useVoice({ enabled: isVoiceEnabled });

  return (
    <>
      <AppRoutes />

      <AccessibilityButton
        isAccessible={isAccessible}
        textSize={textSize}
        isHighContrast={isHighContrast}
        isVoiceEnabled={isVoiceEnabled}
        isOpen={isPanelOpen}
        onOpen={() => setIsPanelOpen(true)}
      />

      <AccessibilityPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        isAccessible={isAccessible}
        textSize={textSize}
        isHighContrast={isHighContrast}
        isVoiceEnabled={isVoiceEnabled}
        onToggleAccessible={toggleAccessibility}
        onSetTextSize={setTextSize}
        onToggleContrast={toggleHighContrast}
        onToggleVoice={toggleVoiceEnabled}
        speak={speak}
      />
    </>
  );
}

function App() {
  return (
    <AccessibilityProvider>
      <AppShell />
    </AccessibilityProvider>
  );
}

export default App;

