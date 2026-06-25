import { accentStyles, type PortalAccent, type PortalStat } from "./portalTypes";

type PortalHeaderProps = {
  accent: PortalAccent;
  badge: string;
  description: string;
  isAccessible: boolean;
  isHighContrast: boolean;
  pageShellClass: string;
  stats: PortalStat[];
  title: string;
};

function PortalHeader({
  accent,
  badge,
  description,
  isAccessible,
  isHighContrast,
  pageShellClass,
  stats,
  title
}: PortalHeaderProps) {
  return (
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
  );
}

export default PortalHeader;
