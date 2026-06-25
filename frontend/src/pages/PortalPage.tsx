import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import PortalHeader from "./portal/PortalHeader";
import PortalNavigationCards from "./portal/PortalNavigationCards";
import PortalNote from "./portal/PortalNote";
import type { PortalAccent, PortalAction, PortalStat } from "./portal/portalTypes";

type PortalPageProps = {
  accent?: PortalAccent;
  actions?: PortalAction[];
  badge?: string;
  description: string;
  note?: string;
  noteTitle?: string;
  stats?: PortalStat[];
  title: string;
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
      <PortalHeader
        accent={accent}
        badge={badge}
        description={description}
        isAccessible={isAccessible}
        isHighContrast={isHighContrast}
        pageShellClass={pageShellClass}
        stats={stats}
        title={title}
      />

      <PortalNavigationCards
        accent={accent}
        actions={actions}
        isAccessible={isAccessible}
        isHighContrast={isHighContrast}
        softPanelClass={softPanelClass}
      />

      <PortalNote
        isAccessible={isAccessible}
        isHighContrast={isHighContrast}
        note={note}
        noteTitle={noteTitle}
        softPanelClass={softPanelClass}
      />
    </section>
  );
}

export default PortalPage;
