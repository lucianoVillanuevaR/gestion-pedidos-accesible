import { Accessibility, ChefHat, ClipboardList, ClipboardPlus, FileCheck2, History, Volume2, Warehouse } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import EasyModeActions from "../components/EasyModeActions";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import useActionVoice from "../hooks/useActionVoice";

type EasyAction = {
  ariaLabel: string;
  description: string;
  icon: LucideIcon;
  label: string;
  path: string;
};

const EASY_ACTIONS: EasyAction[] = [
  {
    ariaLabel: "Crear pedido paso a paso",
    label: "Crear pedido",
    description: "Registrar un nuevo pedido paso a paso.",
    icon: ClipboardPlus,
    path: "/pdv/facil"
  },
  {
    ariaLabel: "Ver pedidos activos",
    label: "Ver pedidos activos",
    description: "Ver pedidos pendientes, listos o en preparación.",
    icon: ClipboardList,
    path: "/pedidos/facil"
  },
  {
    ariaLabel: "Ir a preparación",
    label: "Preparación",
    description: "Gestionar pedidos que se están preparando.",
    icon: ChefHat,
    path: "/preparacion/facil"
  },
  {
    ariaLabel: "Ver stock básico",
    label: "Stock básico",
    description: "Ver productos disponibles o agotados.",
    icon: Warehouse,
    path: "/inventario/facil"
  },
  {
    ariaLabel: "Ver pedidos recientes",
    label: "Pedidos recientes",
    description: "Ver pedidos y turnos cerrados.",
    icon: History,
    path: "/historial-pedidos"
  },
  {
    ariaLabel: "Cerrar turno",
    label: "Cerrar turno",
    description: "Ver resumen y cerrar el turno.",
    icon: FileCheck2,
    path: "/cierre-turno/facil"
  }
];

function ModoFacilPage() {
  const { isHighContrast, isVoiceEnabled } = useAccessibilityContext();
  const { speakAction } = useActionVoice(isVoiceEnabled);

  const panelClass = isHighContrast
    ? "contrast-panel border-2 border-yellow-400"
    : "border-2 border-slate-900 bg-white";
  const softPanelClass = isHighContrast
    ? "contrast-panel-soft border-2 border-yellow-400"
    : "border-2 border-slate-200 bg-slate-50";
  const focusClass = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900 focus-visible:ring-offset-2";
  const handleReadIntro = () => {
    speakAction(
      "Estás en modo fácil. Puedes crear un pedido, ver pedidos activos, revisar preparación, consultar stock básico, cerrar turno o ver pedidos recientes.",
      "modo-facil-inicio-leer"
    );
  };

  return (
    <main className={`min-h-screen ${isHighContrast ? "bg-black text-white" : "bg-white text-slate-950"}`}>
      <div className="mx-auto w-full max-w-[1440px] space-y-5 px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
        <header className={`rounded-[28px] p-6 sm:p-8 ${panelClass}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className={`text-sm font-black uppercase tracking-[0.18em] ${isHighContrast ? "text-yellow-300" : "text-slate-500"}`}>
                Riquísimo
              </p>
              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Modo fácil
              </h1>
              <p className={`mt-3 text-xl font-bold leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-700"}`}>
                Elige una opción para continuar.
              </p>
            </div>

            <div className="grid gap-3 lg:min-w-[620px]">
              <EasyModeActions showHome={false} />
              <button
                type="button"
                onClick={handleReadIntro}
                className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-black transition ${
                  isHighContrast ? "contrast-button-secondary" : "border-slate-300 bg-white text-slate-950 hover:border-slate-900 hover:bg-slate-50"
                } ${focusClass}`}
              >
                <Volume2 className="h-6 w-6" aria-hidden="true" />
                Leer ayuda
              </button>
            </div>
          </div>
        </header>

        <section className={`rounded-[28px] p-5 sm:p-6 ${softPanelClass}`} aria-labelledby="easy-actions-title">
          <div className="mb-5 flex items-center gap-3">
            <span
              className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 ${
                isHighContrast ? "border-yellow-400 text-yellow-200" : "border-yellow-300 bg-[#FECE00] text-slate-950"
              }`}
              aria-hidden="true"
            >
              <Accessibility className="h-6 w-6" />
            </span>
            <h2 id="easy-actions-title" className={`text-2xl font-black ${isHighContrast ? "contrast-important" : "text-slate-950"}`}>
              ¿Qué quieres hacer ahora?
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {EASY_ACTIONS.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                aria-label={action.ariaLabel}
                className={`group flex min-h-[132px] items-center gap-4 rounded-2xl border-2 p-5 no-underline transition ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : "border-slate-300 bg-white text-slate-950 hover:border-slate-900 hover:bg-[#FFF8DC]"
                } ${focusClass}`}
              >
                <span
                  className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 ${
                    isHighContrast
                      ? "border-yellow-400 text-yellow-200"
                      : "border-slate-900 bg-slate-900 text-white group-hover:bg-black"
                  }`}
                  aria-hidden="true"
                >
                  <action.icon className="h-8 w-8" />
                </span>
                <span className="min-w-0">
                  <span className="block text-2xl font-black leading-tight">{action.label}</span>
                  <span className={`mt-2 block text-lg font-bold leading-snug ${isHighContrast ? "contrast-body-text" : "text-slate-700"}`}>
                    {action.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default ModoFacilPage;
