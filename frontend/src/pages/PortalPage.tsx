import { ArrowRight, CircleCheckBig } from "lucide-react";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";

type PortalAction = {
  button: string;
  description: string;
  title: string;
};

type PortalStat = {
  label: string;
  value: string;
};

type PortalPageProps = {
  accent?: "yellow" | "slate";
  actions?: PortalAction[];
  badge?: string;
  description: string;
  note?: string;
  noteTitle?: string;
  stats?: PortalStat[];
  title: string;
};

const accentStyles = {
  yellow: {
    badge: "bg-[#FECE00] text-slate-950 border-yellow-200",
    button: "bg-slate-900 text-white hover:bg-black"
  },
  slate: {
    badge: "bg-slate-900 text-white border-slate-700",
    button: "bg-slate-800 text-white hover:bg-slate-900"
  }
};

function PortalPage({
  accent = "yellow",
  actions = [],
  badge = "Vista lista",
  description,
  note = "Este espacio puede crecer con acciones guiadas, estados claros y accesos rápidos según el rol.",
  noteTitle = "Preparado para seguir creciendo",
  stats = [],
  title
}: PortalPageProps) {
  const { isAccessible, isHighContrast } = useAccessibilityContext();

  const pageShellClass = isHighContrast
    ? "contrast-panel border-yellow-400 bg-black"
    : "border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]";

  const softPanelClass = isHighContrast
    ? "contrast-panel-soft"
    : "border border-slate-200 bg-[linear-gradient(180deg,#fffdf7_0%,#ffffff_100%)]";

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <header className={`rounded-[28px] p-6 sm:p-8 ${pageShellClass}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <span
              className={`inline-flex rounded-full border px-4 py-2 text-sm font-black uppercase tracking-[0.18em] ${
                isHighContrast ? "contrast-badge" : accentStyles[accent].badge
              }`}
            >
              {badge}
            </span>
            <h1 className={`mt-5 font-black tracking-tight ${isAccessible ? "text-[2.15rem]" : "text-[2rem]"}`}>
              {title}
            </h1>
            <p
              className={`mt-3 max-w-2xl leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-600"} ${isAccessible ? "text-lg" : "text-base"}`}
            >
              {description}
            </p>
          </div>

          {stats.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[320px]">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl border px-4 py-4 ${
                    isHighContrast ? "contrast-panel-soft" : "border-yellow-100 bg-[#FFF8DC]"
                  }`}
                >
                  <p
                    className={`text-xs font-black uppercase tracking-[0.18em] ${isHighContrast ? "contrast-secondary-text" : "text-slate-500"}`}
                  >
                    {stat.label}
                  </p>
                  <p
                    className={`mt-2 font-black ${isAccessible ? "text-3xl" : "text-2xl"} ${isHighContrast ? "contrast-important" : "text-slate-950"}`}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {actions.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-3">
          {actions.map((action) => (
            <article key={action.title} className={`rounded-[26px] p-5 sm:p-6 ${softPanelClass}`}>
              <div className="flex h-full flex-col">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${
                    isHighContrast ? "contrast-panel" : "border-yellow-200 bg-[#FFF8DC] text-slate-950"
                  }`}
                  aria-hidden="true"
                >
                  <CircleCheckBig className="h-5 w-5" />
                </span>

                <h2 className={`mt-5 font-black ${isAccessible ? "text-2xl" : "text-xl"}`}>{action.title}</h2>
                <p
                  className={`mt-3 flex-1 leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-600"} ${isAccessible ? "text-lg" : "text-sm"}`}
                >
                  {action.description}
                </p>

                <button
                  type="button"
                  className={`mt-6 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 font-black transition ${
                    isHighContrast ? "contrast-button-primary" : accentStyles[accent].button
                  } ${isAccessible ? "text-lg" : "text-base"}`}
                >
                  <span>{action.button}</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className={`rounded-[26px] p-5 sm:p-6 ${softPanelClass}`}>
        <p className={`font-black ${isAccessible ? "text-2xl" : "text-xl"}`}>{noteTitle}</p>
        <p
          className={`mt-3 max-w-3xl leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-600"} ${isAccessible ? "text-lg" : "text-base"}`}
        >
          {note}
        </p>
      </section>
    </section>
  );
}

export default PortalPage;
