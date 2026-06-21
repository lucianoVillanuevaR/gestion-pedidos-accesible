import { AlertTriangle, CheckCircle2, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import fondoR from "../assets/fondoR.png";
import logoRiq from "../assets/logoRiq.png";
import { DEMO_USERS, getDefaultRouteForRole } from "../constants/auth";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import { useAuthContext } from "../contexts/AuthContext";
import useVoice from "../hooks/useVoice";

type FeedbackState = {
  type: "" | "success" | "error";
  message: string;
};

function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ type: "", message: "" });
  const navigateTimerRef = useRef<number | null>(null);
  const { login } = useAuthContext();
  const { isAccessible, isHighContrast, isVoiceEnabled } = useAccessibilityContext();
  const { speak } = useVoice({ enabled: isVoiceEnabled });

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) {
        window.clearTimeout(navigateTimerRef.current);
      }
    };
  }, []);

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
      navigate(getDefaultRouteForRole(result.user.role), { replace: true });
    }, 700);
  };

  const handleFieldFocus = (message: string) => {
    if (isVoiceEnabled) {
      speak(message);
    }
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

  const passwordInputClass = `${inputClass} pr-24`;

  const passwordToggleClass = isAccessible
    ? `absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
        isHighContrast ? "border border-slate-900" : "border border-slate-700"
      }`
    : "absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-900/25 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-yellow-200";

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
                  onFocus={() => handleFieldFocus("Ingrese su usuario o correo")}
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
                      <EyeOff className="mr-1 h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="mr-1 h-4 w-4" aria-hidden="true" />
                    )}
                    <span className={isAccessible ? "text-sm" : "hidden sm:inline"}>
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </span>
                  </button>
                </div>
              </div>

              <button type="submit" className={submitButtonClass}>
                Ingresar al sistema
              </button>
            </form>

            {feedback.message && (
              <div
                id="login-feedback"
                role="status"
                aria-live="polite"
                className={`flex items-start gap-3 rounded-xl p-4 ${
                  feedback.type === "success"
                    ? isAccessible
                      ? "border border-emerald-700 bg-emerald-100 text-emerald-950"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-900"
                    : isAccessible
                      ? "border border-red-700 bg-red-100 text-red-950"
                      : "border border-red-200 bg-red-50 text-red-900"
                }`}
              >
                <span aria-hidden="true" className="mt-0.5">
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </span>
                <p className={isAccessible ? "text-lg font-semibold" : "text-sm font-semibold"}>{feedback.message}</p>
              </div>
            )}

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
                          isAccessible ? "text-lg font-semibold text-slate-900" : "text-xs font-semibold text-slate-700"
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
          </div>
        </section>
      </main>
    </>
  );
}

export default Login;
