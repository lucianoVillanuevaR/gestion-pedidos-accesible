import { Accessibility, CheckCircle2, ChevronDown, Eye, EyeOff, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import fondoR from "../assets/fondoR.png";
import logoRiq from "../assets/logoRiq.png";
import { getEasyRoute } from "../config/navigation";
import { DEMO_USERS, getDefaultRouteForRole } from "../constants/auth";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import { useAuthContext } from "../contexts/AuthContext";
import useVoice from "../hooks/useVoice";
import AlertMessage from "./ui/AlertMessage";

type FeedbackState = {
  type: "" | "success" | "error";
  message: string;
};

const LOGIN_HELP_MESSAGE = "Ingrese su correo y contraseña. Luego presione Ingresar al sistema.";
const EASY_MODE_TOAST_DURATION_MS = 4000;

function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ type: "", message: "" });
  const [showEasyModeToast, setShowEasyModeToast] = useState(false);
  const navigateTimerRef = useRef<number | null>(null);
  const easyModeToastTimerRef = useRef<number | null>(null);
  const previousAccessibleRef = useRef<boolean | null>(null);
  const { login } = useAuthContext();
  const { isAccessible, isHighContrast, isPanelOpen, isVoiceEnabled, openAccessibilityPanel } =
    useAccessibilityContext();
  const { speak } = useVoice({ enabled: isVoiceEnabled });
  const { speak: speakHelp } = useVoice({ enabled: true });

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) {
        window.clearTimeout(navigateTimerRef.current);
      }

      if (easyModeToastTimerRef.current) {
        window.clearTimeout(easyModeToastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (previousAccessibleRef.current === null) {
      previousAccessibleRef.current = isAccessible;
      return;
    }

    if (!previousAccessibleRef.current && isAccessible) {
      setShowEasyModeToast(true);

      if (easyModeToastTimerRef.current) {
        window.clearTimeout(easyModeToastTimerRef.current);
      }

      easyModeToastTimerRef.current = window.setTimeout(() => {
        setShowEasyModeToast(false);
        easyModeToastTimerRef.current = null;
      }, EASY_MODE_TOAST_DURATION_MS);
    }

    if (!isAccessible) {
      setShowEasyModeToast(false);

      if (easyModeToastTimerRef.current) {
        window.clearTimeout(easyModeToastTimerRef.current);
        easyModeToastTimerRef.current = null;
      }
    }

    previousAccessibleRef.current = isAccessible;
  }, [isAccessible]);

  const resetFeedback = () => {
    setFeedback({ type: "", message: "" });
  };

  const announceError = (message: string) => {
    setFeedback({ type: "error", message });
    speak(message);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await login({ identifier, password });

    if (!result.ok) {
      announceError(result.message);
      return;
    }

    setFeedback({ type: "success", message: "Bienvenido al sistema" });
    speak("Bienvenido al sistema");

    if (navigateTimerRef.current) {
      window.clearTimeout(navigateTimerRef.current);
    }

    navigateTimerRef.current = window.setTimeout(() => {
      const defaultRoute = getDefaultRouteForRole(result.user.role);
      const nextRoute = isAccessible ? (getEasyRoute(defaultRoute) ?? defaultRoute) : defaultRoute;
      navigate(nextRoute, { replace: true });
    }, 700);
  };

  const handleFieldFocus = (message: string) => {
    if (isVoiceEnabled) {
      speak(message);
    }
  };

  const handleReadHelp = () => {
    speakHelp(LOGIN_HELP_MESSAGE, {
      dedupeKey: "login-help",
      force: true,
      interrupt: true,
      priority: "high"
    });
  };

  const labelClass = isAccessible
    ? "block text-xl font-bold text-slate-900"
    : "block text-sm font-semibold text-slate-700";

  const inputClass = isAccessible
    ? `w-full min-h-[64px] px-4 py-3 text-xl rounded-xl bg-white focus:border-yellow-500 focus:outline-none focus:ring-4 focus:ring-yellow-200 ${
        isHighContrast ? "border-2 border-slate-900" : "border border-slate-700"
      }`
    : "w-full min-h-[56px] px-4 py-3 text-base border border-slate-900/25 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 bg-white/95 shadow-sm";

  const submitButtonClass = isAccessible
    ? "w-full min-h-[72px] px-6 py-4 text-2xl font-bold bg-[#FECE00] text-slate-950 rounded-xl border border-yellow-300 hover:bg-[#FFD633] focus:outline-none focus:ring-4 focus:ring-yellow-200 transition"
    : "w-full min-h-[60px] px-6 py-3 text-lg font-bold bg-[#FECE00] text-slate-950 rounded-lg border border-yellow-300 hover:bg-[#FFD633] focus:outline-none focus:ring-2 focus:ring-yellow-300 transition";

  const normalSupportButtonClass =
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white/95 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-yellow-200";
  const accessibilityButtonClass = isAccessible
    ? "inline-flex min-h-[58px] items-center justify-center gap-2 rounded-xl border-2 border-yellow-400 bg-[#FECE00] px-4 text-base font-bold text-slate-950 transition hover:bg-[#FFD633] focus:outline-none focus:ring-4 focus:ring-yellow-300"
    : normalSupportButtonClass;

  const supportButtonClass = isAccessible
    ? "inline-flex min-h-[58px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-base font-bold text-slate-900 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-yellow-300"
    : normalSupportButtonClass;

  const toastClass = isHighContrast
    ? "contrast-panel border-2 border-yellow-400 text-white"
    : "border border-yellow-300 bg-[#FFF8DC] text-slate-950 shadow-xl shadow-slate-900/15";

  const passwordInputClass = `${inputClass} ${isAccessible ? "pr-16" : "pr-14"}`;

  const passwordToggleClass = isAccessible
    ? `absolute right-2 top-1/2 flex min-h-[48px] min-w-[48px] -translate-y-1/2 items-center justify-center rounded-lg bg-slate-100 text-slate-900 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
        isHighContrast ? "border border-slate-900" : "border border-slate-700"
      }`
    : "absolute right-2 top-1/2 flex min-h-[40px] min-w-[40px] -translate-y-1/2 items-center justify-center rounded-lg border border-slate-900/25 bg-slate-100 text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-yellow-200";

  const cardClass = isAccessible
    ? "rounded-2xl border border-slate-900/25 bg-white p-8 shadow-lg shadow-slate-200 sm:p-10"
    : "rounded-2xl border border-slate-900/20 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.14)] sm:p-10";

  return (
    <>
      <main
        className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 transition-colors sm:py-16 ${
          isAccessible ? "bg-[#f5f5f5]" : "bg-cover bg-center bg-no-repeat"
        }`}
        style={
          isAccessible
            ? undefined
            : {
                backgroundImage: `url(${fondoR})`
              }
        }
      >
        {showEasyModeToast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed right-4 top-4 z-[210] max-w-[min(360px,calc(100vw-2rem))] rounded-2xl px-4 py-3 ${toastClass}`}
          >
            <p className="flex items-center gap-2 text-sm font-black">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              Modo fácil activado.
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug">Al iniciar sesión entrarás al modo fácil.</p>
          </div>
        )}

        <section className={`relative w-full max-w-md ${cardClass}`}>
          <div className={isAccessible ? "space-y-8" : "space-y-7"}>
            <header className={isAccessible ? "space-y-5 text-center" : "space-y-4 text-center"}>
              <div
                className={`mx-auto inline-flex justify-center rounded-2xl ${
                  isAccessible
                    ? "border border-slate-300 bg-yellow-100 p-3"
                    : "bg-white/70 p-2 shadow-sm ring-1 ring-white/80"
                }`}
              >
                <img
                  src={logoRiq}
                  alt="Logo de Riquísimo S.P.A"
                  className={isAccessible ? "h-24 w-32 object-contain" : "h-20 w-28 object-contain"}
                />
              </div>

              <h1
                className={isAccessible ? "text-[32px] font-bold text-slate-900" : "text-3xl font-bold text-slate-900"}
              >
                Riquísimo S.P.A
              </h1>

              <p className={isAccessible ? "text-xl text-slate-700" : "text-sm text-slate-600"}>
                Sistema de gestión de pedidos
              </p>

              <p className={isAccessible ? "text-lg font-semibold text-slate-800" : "text-sm text-slate-500"}>
                Iniciar sesión
              </p>
            </header>

            <form onSubmit={handleSubmit} className={isAccessible ? "space-y-7" : "space-y-6"} noValidate>
              <div className={isAccessible ? "space-y-3" : "space-y-2"}>
                <label htmlFor="identifier" className={labelClass}>
                  Usuario o correo
                </label>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="ejemplo@demo.cl"
                  value={identifier}
                  onChange={(event) => {
                    setIdentifier(event.target.value);
                    if (feedback.message) {
                      resetFeedback();
                    }
                  }}
                  onFocus={() => handleFieldFocus("Ingrese su correo")}
                  className={inputClass}
                  aria-describedby={feedback.message ? "login-feedback" : undefined}
                />
              </div>

              <div className={isAccessible ? "space-y-3" : "space-y-2"}>
                <label htmlFor="password" className={labelClass}>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (feedback.message) {
                        resetFeedback();
                      }
                    }}
                    onFocus={() => handleFieldFocus("Ingrese su contraseña")}
                    className={passwordInputClass}
                    aria-describedby={feedback.message ? "login-feedback" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className={passwordToggleClass}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className={isAccessible ? "h-6 w-6" : "h-5 w-5"} aria-hidden="true" />
                    ) : (
                      <Eye className={isAccessible ? "h-6 w-6" : "h-5 w-5"} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className={submitButtonClass}>
                Ingresar al sistema
              </button>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={openAccessibilityPanel}
                  aria-haspopup="dialog"
                  aria-expanded={isPanelOpen}
                  className={accessibilityButtonClass}
                >
                  {isAccessible ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Accessibility className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{isAccessible ? "Modo fácil activo" : "Accesibilidad"}</span>
                </button>

                <button type="button" onClick={handleReadHelp} className={supportButtonClass}>
                  <Volume2 className={isAccessible ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
                  <span>Leer ayuda</span>
                </button>
              </div>
            </form>

            {feedback.message && (
              <AlertMessage
                id="login-feedback"
                className="rounded-xl"
                isHighContrast={isHighContrast}
                isLarge={isAccessible}
                tone={feedback.type === "success" ? "success" : "error"}
              >
                {feedback.message}
              </AlertMessage>
            )}

            {DEMO_USERS.length > 0 && (
              <div className={`rounded-lg ${isAccessible ? "border border-slate-300" : "border border-slate-200"}`}>
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts((currentValue) => !currentValue)}
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-semibold transition ${
                    isAccessible
                      ? "min-h-[60px] bg-slate-50 text-slate-900 text-lg hover:bg-slate-100"
                      : "min-h-[52px] bg-slate-100 text-slate-900 text-sm hover:bg-slate-200"
                  }`}
                  aria-expanded={showDemoAccounts}
                >
                  <span>Accesos de prueba</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-4 w-4 transition ${showDemoAccounts ? "rotate-180" : ""}`}
                  />
                </button>

                {showDemoAccounts && (
                  <div
                    className={`space-y-3 border-t p-4 ${isAccessible ? "border-slate-300 bg-white" : "border-slate-200 bg-white"}`}
                  >
                    {DEMO_USERS.map((user) => (
                      <div key={user.email} className="space-y-1 rounded-lg bg-slate-50 p-3">
                        <p
                          className={
                            isAccessible
                              ? "text-lg font-semibold text-slate-900"
                              : "text-xs font-semibold text-slate-700"
                          }
                        >
                          {user.label}
                        </p>
                        <p className={isAccessible ? "text-base text-slate-700" : "text-xs text-slate-600"}>
                          {user.email}
                        </p>
                        <p className={isAccessible ? "text-base text-slate-700" : "text-xs text-slate-600"}>
                          {user.password}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default Login;
