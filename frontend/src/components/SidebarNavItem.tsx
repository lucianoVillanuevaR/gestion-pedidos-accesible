import { NavLink } from "react-router-dom"
import type { AppNavigationItem } from "../config/navigation"

type SidebarNavItemProps = {
  isAccessible: boolean
  isHighContrast: boolean
  item: AppNavigationItem
  onNavigate: () => void
  pathOverride?: string
}

function SidebarNavItem({
  isAccessible,
  isHighContrast,
  item,
  onNavigate,
  pathOverride
}: SidebarNavItemProps) {
  const Icon = item.icon
  const showDescription = !isAccessible
  const path = pathOverride ?? item.path

  return (
    <NavLink
      to={path}
      onClick={() => onNavigate()}
      className={({ isActive }) => {
        const baseClass = `group flex w-full items-center rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isAccessible ? "min-h-[68px] gap-4 px-4 py-3" : "min-h-[48px] gap-2.5 px-2.5 py-2"
        }`

        return `${baseClass} ${
          isHighContrast
            ? isActive
              ? "contrast-button-primary"
              : "contrast-button-secondary"
            : isActive
              ? "border-[#FDB913] bg-[#FDB913] text-slate-950 shadow-sm shadow-[#FDB913]/20"
              : "border-slate-200 bg-white text-slate-950 hover:bg-slate-50 hover:border-slate-300"
        }`
      }}
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex shrink-0 items-center justify-center rounded-xl border transition ${
              isHighContrast
                ? "border-current bg-black/10"
                : isActive
                  ? "border-amber-300 bg-[#FFF8DC]"
                  : "border-slate-200 bg-slate-900/5"
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
                      ? "text-slate-700/80"
                      : "text-slate-600"
                }`}
              >
                {item.description}
              </span>
            )}
          </span>
        </>
      )}
    </NavLink>
  )
}

export default SidebarNavItem
