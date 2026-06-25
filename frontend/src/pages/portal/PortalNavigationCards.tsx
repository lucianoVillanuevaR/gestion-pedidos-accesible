import { ArrowRight, CircleCheckBig } from "lucide-react";
import { accentStyles, type PortalAccent, type PortalAction } from "./portalTypes";

type PortalNavigationCardsProps = {
  accent: PortalAccent;
  actions: PortalAction[];
  isAccessible: boolean;
  isHighContrast: boolean;
  softPanelClass: string;
};

function PortalNavigationCards({
  accent,
  actions,
  isAccessible,
  isHighContrast,
  softPanelClass
}: PortalNavigationCardsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
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
  );
}

export default PortalNavigationCards;
