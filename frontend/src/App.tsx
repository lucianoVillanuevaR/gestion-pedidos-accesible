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
          flex min-h-[64px] items-center gap-4 rounded-2xl border px-5 py-4 text-left
          font-black shadow-2xl transition duration-200 ease-out focus-visible:outline focus-visible:outline-4
          focus-visible:outline-offset-4
          ${isAccessible || isPanelOpen
            ? "border-slate-800 bg-white text-slate-900 hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-blue-700"
            : "border-blue-700 bg-blue-600 text-white hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-blue-300"
          }
        `}
      >
        <span
          aria-hidden="true"
          className={`grid h-11 w-11 place-items-center rounded-2xl text-xl shadow-inner ${
            isAccessible || isPanelOpen ? "bg-slate-100 text-slate-900" : "bg-white/15 text-white"
          }`}
        >
          ♿
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-lg">
            {isAccessible ? "OPCIONES" : "Accesibilidad"}
          </span>
          <span className="block text-sm font-semibold opacity-90">
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
