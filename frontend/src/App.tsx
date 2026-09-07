import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import AccessibilityPanel from "./components/AccessibilityPanel";
import AccessibleRouteAnnouncer from "./components/AccessibleRouteAnnouncer";
import { AccessibilityProvider, useAccessibilityContext } from "./contexts/AccessibilityContext";
import { AuthProvider } from "./contexts/AuthContext";
import { isEasyModeControlRoute } from "./config/navigation";

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isPanelOpen,
    isAccessible,
    textSize,
    isHighContrast,
    isVoiceEnabled,
    isSoundEnabled,
    soundVolume,
    isVoiceSupported,
    closeAccessibilityPanel,
    setAccessibleMode,
    setTextSize,
    toggleHighContrast,
    toggleVoiceEnabled,
    toggleSoundEnabled,
    setSoundVolume,
    resetAccessibilitySettings
  } = useAccessibilityContext();
  const isEasyModeAvailable = isEasyModeControlRoute(location.pathname);
  const isEasyModeActive = isAccessible && isEasyModeAvailable;

  useEffect(() => {
    const value = String(isEasyModeActive);
    document.documentElement.dataset.accessible = value;
    document.body.dataset.accessible = value;
  }, [isEasyModeActive]);

  const handleToggleEasyMode = () => {
    if (!isEasyModeActive && isEasyModeAvailable) {
      closeAccessibilityPanel();
      setAccessibleMode(true);
      navigate("/modo-facil");
      return;
    }

    closeAccessibilityPanel();
    setAccessibleMode(false);
    navigate("/pdv", { replace: true });
  };

  return (
    <>
      <AccessibleRouteAnnouncer />
      <AppRoutes />

      <AccessibilityPanel
        isOpen={isPanelOpen}
        onClose={closeAccessibilityPanel}
        isAccessible={isEasyModeActive}
        showEasyMode={isEasyModeAvailable}
        textSize={textSize}
        isHighContrast={isHighContrast}
        isVoiceEnabled={isVoiceEnabled}
        isSoundEnabled={isSoundEnabled}
        soundVolume={soundVolume}
        isVoiceSupported={isVoiceSupported}
        onToggleAccessible={handleToggleEasyMode}
        onSetTextSize={setTextSize}
        onToggleContrast={toggleHighContrast}
        onToggleVoice={toggleVoiceEnabled}
        onToggleSound={toggleSoundEnabled}
        onSetSoundVolume={setSoundVolume}
        onReset={resetAccessibilitySettings}
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
