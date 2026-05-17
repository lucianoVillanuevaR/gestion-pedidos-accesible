import { NavLink } from "react-router-dom"
import type { AppNavigationItem } from "../config/navigation"

type SidebarNavItemProps = {
  isAccessible: boolean
  isHighContrast: boolean
  item: AppNavigationItem
  onNavigate: () => void
}

function SidebarNavItem({
  isAccessible,
  isHighContrast,
  item,
  onNavigate
}: SidebarNavItemProps) {
  const Icon = item.icon
  const showDescription = !isAccessible

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) => {
        const baseClass = `group flex w-full items-center rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isAccessible ? "min-h-[68px] gap-4 px-4 py-3" : "min-h-[52px] gap-3 px-3 py-2.5"
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
            <Icon className={isAccessible ? "h-6 w-6" : "h-4 w-4"} />
          </span>

          <span className="min-w-0 flex-1">
            <span className={`block font-semibold leading-tight ${isAccessible ? "text-lg" : "text-sm"}`}>
              {item.label}
            </span>
            {showDescription && (
              <span
                className={`mt-0.5 block text-xs leading-snug ${
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
