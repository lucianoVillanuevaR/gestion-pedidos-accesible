import { useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import AccessibilityPanel from "./components/AccessibilityPanel";
import { AccessibilityProvider, useAccessibilityContext } from "./contexts/AccessibilityContext";
import { AuthProvider } from "./contexts/AuthContext";

function AppShell() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const {
    isAccessible,
    textSize,
    isHighContrast,
    isVoiceEnabled,
    isSoundEnabled,
    toggleAccessibility,
    setTextSize,
    toggleHighContrast,
    toggleVoiceEnabled,
    toggleSoundEnabled
  } = useAccessibilityContext();

  return (
    <>
      <AppRoutes />

      {/* Botón flotante de accesibilidad - Esquina inferior derecha */}
      <button
        type="button"
        aria-label="Abrir panel de accesibilidad"
        aria-expanded={isPanelOpen}
        onClick={() => setIsPanelOpen((currentState) => !currentState)}
        className={`
          fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6 no-print
          flex min-h-[56px] items-center gap-3 rounded-full border px-4 py-3 text-left
          font-bold shadow-xl transition focus-visible:outline focus-visible:outline-4
          focus-visible:outline-offset-4
          ${isAccessible || isPanelOpen
            ? "border-slate-700 bg-white text-slate-900 hover:bg-slate-50 focus-visible:outline-blue-700"
            : "border-blue-700 bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-300"
          }
        `}
      >
        <span
          aria-hidden="true"
          className={`grid h-9 w-9 place-items-center rounded-full text-lg ${
            isAccessible || isPanelOpen ? "bg-slate-100 text-slate-900" : "bg-white/15 text-white"
          }`}
        >
          ♿
        </span>
        <span className="leading-tight hidden sm:block">
          <span className="block text-base">
            {isAccessible ? "OPCIONES" : "Accesibilidad"}
          </span>
          <span className="block text-xs font-medium opacity-90">
            {isAccessible ? "MODO FÁCIL" : "Activar"}
          </span>
        </span>
      </button>

      <AccessibilityPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
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
