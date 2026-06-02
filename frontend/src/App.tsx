import AppRoutes from "./routes/AppRoutes";
import AccessibilityPanel from "./components/AccessibilityPanel";
import { AccessibilityProvider, useAccessibilityContext } from "./contexts/AccessibilityContext";
import { AuthProvider } from "./contexts/AuthContext";

function AppShell() {
  const {
    isPanelOpen,
    isAccessible,
    textSize,
    isHighContrast,
    isVoiceEnabled,
    isSoundEnabled,
    closeAccessibilityPanel,
    toggleAccessibility,
    setTextSize,
    toggleHighContrast,
    toggleVoiceEnabled,
    toggleSoundEnabled
  } = useAccessibilityContext();

  return (
    <>
      <AppRoutes />

      <AccessibilityPanel
        isOpen={isPanelOpen}
        onClose={closeAccessibilityPanel}
        isAccessible={isAccessible}
        textSize={textSize}
        isHighContrast={isHighContrast}
        isVoiceEnabled={isVoiceEnabled}
        isSoundEnabled={isSoundEnabled}
        onToggleAccessible={toggleAccessibility}
        onSetTextSize={setTextSize}
        onToggleContrast={toggleHighContrast}
        onToggleVoice={toggleVoiceEnabled}
        onToggleSound={toggleSoundEnabled}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppShell />
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;
