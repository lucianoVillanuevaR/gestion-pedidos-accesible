import { NavLink } from "react-router-dom";
import type { AppNavigationItem } from "../config/navigation";

type SidebarNavItemProps = {
  isAccessible: boolean;
  isHighContrast: boolean;
  item: AppNavigationItem;
  onNavigate: () => void;
  pathOverride?: string;
};

function SidebarNavItem({ isAccessible, isHighContrast, item, onNavigate, pathOverride }: SidebarNavItemProps) {
  const Icon = item.icon;
  const showDescription = !isAccessible;
  const path = pathOverride ?? item.path;

  return (
    <NavLink
      to={path}
      end
      onClick={() => onNavigate()}
      className={({ isActive }) => {
        const baseClass = `group flex w-full self-stretch items-center rounded-none border text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-950 focus-visible:ring-offset-2 ${
          isAccessible ? "min-h-[68px] gap-4 px-4 py-3" : "min-h-[48px] gap-2.5 px-2.5 py-2"
        }`;

        return `${baseClass} ${
          isHighContrast
            ? isActive
              ? "contrast-button-primary"
              : "contrast-button-secondary"
            : isActive
              ? "border-2 border-l-[8px] border-slate-950 bg-[#FECE00] text-slate-950 shadow-sm hover:bg-[#FFD633] focus-visible:bg-[#FECE00]"
              : "border-slate-300 bg-white text-slate-950 hover:border-slate-950 hover:bg-slate-950 hover:text-white focus-visible:border-slate-950 focus-visible:bg-slate-950 focus-visible:text-white"
        }`;
      }}
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex shrink-0 items-center justify-center rounded-none border transition ${
              isHighContrast
                ? "border-current bg-black/10"
                : isActive
                  ? "border-slate-950 bg-[#FECE00] group-hover:bg-[#FFD633]"
                  : "border-slate-200 bg-slate-900/5 group-hover:border-white/70 group-hover:bg-white/10 group-hover:text-white group-focus-visible:border-white/70 group-focus-visible:bg-white/10 group-focus-visible:text-white"
            }`}
            aria-hidden="true"
          >
            <Icon className={isAccessible ? "h-6 w-6" : "h-3.5 w-3.5"} />
          </span>

          <span className="min-w-0 flex-1">
            <span className={`block font-semibold leading-tight ${isAccessible ? "text-lg" : "text-[13px]"}`}>
              {item.label}
            </span>
            {showDescription && (
              <span
                className={`mt-0.5 block text-[11px] leading-snug ${
                  isHighContrast
                    ? "contrast-secondary-text"
                    : isActive
                      ? "text-slate-700/80 group-hover:text-slate-800"
                      : "text-slate-600 group-hover:text-slate-200 group-focus-visible:text-slate-200"
                }`}
              >
                {item.description}
              </span>
            )}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default SidebarNavItem;
