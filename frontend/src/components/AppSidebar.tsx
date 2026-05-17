import { LogOut, ShieldCheck, X } from "lucide-react"
import { useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import logoRiq from "../assets/logoRiq.png"
import { getSidebarNavigation } from "../config/navigation"
import { useAccessibilityContext } from "../contexts/AccessibilityContext"
import { useAuthContext } from "../contexts/AuthContext"
import { getDefaultRouteForRole } from "../constants/auth"
import SidebarNavItem from "./SidebarNavItem"

type AppSidebarProps = {
  isOpen: boolean
  onClose: () => void
}

function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAccessible, isHighContrast, isPanelOpen, openAccessibilityPanel } = useAccessibilityContext()
  const { logout, user } = useAuthContext()

  if (!user) {
    return null
  }

  const navigationItems = getSidebarNavigation(user.role)
  const isPdvPage = location.pathname === "/pdv"
  const widthClass = isAccessible ? "w-[92vw] max-w-[368px] lg:w-[368px]" : "w-[86vw] max-w-[320px] lg:w-[320px]"
  const brandHeaderClass = isHighContrast
    ? "border-yellow-400"
    : isAccessible
      ? "border-slate-300 bg-slate-50 text-slate-950"
      : isPdvPage
        ? "border-amber-200 bg-[#FECE00] text-slate-950"
        : "border-slate-200 bg-white text-slate-950"
  const brandBadgeClass = isHighContrast
    ? "bg-white/10 border border-white/20"
    : isAccessible
      ? "bg-slate-950 border border-slate-950 text-white"
      : isPdvPage
        ? "bg-[#FFF8DC] border border-amber-300"
        : "bg-slate-100 border border-slate-300"
  const brandTitleClass = isHighContrast ? "text-white" : "text-slate-950"
  const brandSubtitleClass = isHighContrast ? "text-yellow-200/80" : isAccessible ? "text-slate-700" : isPdvPage ? "text-slate-700" : "text-slate-500"
  const brandCloseButtonClass = isHighContrast
    ? "contrast-button-secondary"
    : isAccessible
      ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
      : isPdvPage
        ? "border-amber-300 bg-[#FFF8DC] text-slate-950 hover:bg-[#FFF4BF]"
        : "border-slate-300 bg-slate-100 text-slate-950 hover:bg-slate-200"
  const brandHeaderSpacingClass = isPdvPage
    ? `min-h-[64px] px-4 ${isAccessible ? "py-4" : ""}`
    : `px-4 ${isAccessible ? "py-5" : "py-4"}`
  const navigationSpacingClass = isAccessible ? "space-y-3" : "space-y-2"
  const footerSpacingClass = isAccessible ? "mt-auto border-t px-4 py-5" : "mt-auto border-t px-3 py-4"
  const accessibilityButtonClass = isHighContrast
    ? "contrast-button-secondary"
    : isAccessible
      ? "border-slate-900 bg-white text-slate-950 hover:bg-slate-50 focus-visible:ring-slate-900"
      : "border-slate-300 bg-slate-50 text-slate-950 hover:bg-slate-100 focus-visible:ring-blue-500"

  const handleLogout = () => {
    logout()
    onClose()
    navigate("/", { replace: true })
  }

  const handleOpenAccessibility = () => {
    openAccessibilityPanel()
    onClose()
  }

  return (
    <>
      <button
        type="button"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        className={`fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] transition lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        id="main-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex ${widthClass} flex-col border-r transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isHighContrast
            ? "contrast-panel border-yellow-400 text-white"
            : isAccessible
              ? "border-slate-300 bg-white text-slate-950 shadow-xl shadow-slate-900/10"
              : "border-slate-200 bg-white text-slate-950 shadow-sm shadow-slate-200/50"
        }`}
        aria-label="Navegación principal"
      >
        <div className={`flex items-center justify-between gap-3 border-b ${brandHeaderSpacingClass} ${brandHeaderClass}`}>
          <div className="min-w-0 flex items-center gap-2.5">
            <div className={`flex ${isAccessible ? "h-14 w-14" : "h-10 w-10"} items-center justify-center rounded-xl p-1.5 ${brandBadgeClass}`}>
              <img src={logoRiq} alt="Logo de Riquísimo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className={`truncate font-black tracking-tight ${brandTitleClass} ${isAccessible ? "text-[1.5rem]" : "text-sm"}`}>
                Riquísimo
              </p>
              <p className={`text-[10px] leading-tight ${brandSubtitleClass} ${isAccessible ? "text-sm font-medium" : ""}`}>
                Sistema de Pedidos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border transition lg:hidden ${isAccessible ? "min-h-[52px] min-w-[52px] text-base" : ""} ${brandCloseButtonClass}`}
            aria-label="Cerrar menú"
          >
            <X className={isAccessible ? "h-5 w-5" : "h-4 w-4"} />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto ${isAccessible ? "px-4 py-5" : "px-3 py-4"}`}>
          <nav className={navigationSpacingClass}>
            {navigationItems.map((item) => (
              <SidebarNavItem
                key={item.path}
                item={item}
                isAccessible={isAccessible}
                isHighContrast={isHighContrast}
                onNavigate={onClose}
              />
            ))}
          </nav>
        </div>

        <div className={`${footerSpacingClass} ${isHighContrast ? "border-yellow-400" : "border-slate-200"}`}>
          <button
            type="button"
            onClick={handleOpenAccessibility}
            aria-haspopup="dialog"
            aria-expanded={isPanelOpen}
            className={`mb-3 inline-flex w-full items-center justify-between gap-3 rounded-2xl border px-4 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${accessibilityButtonClass} ${isAccessible ? "min-h-[68px]" : "min-h-[52px]"}`}
          >
            <span className="flex min-w-0 items-center gap-3 text-left">
              <span className={`inline-flex items-center justify-center rounded-2xl ${isAccessible ? "h-12 w-12 text-2xl" : "h-10 w-10 text-xl"} ${isHighContrast ? "border border-current bg-black/10" : "bg-slate-900 text-white"}`}>
                ♿
              </span>
              <span className="min-w-0">
                <span className={`block font-black leading-tight ${isAccessible ? "text-lg" : "text-sm"}`}>
                  Accesibilidad
                </span>
                <span className={`mt-0.5 block ${isAccessible ? "text-sm" : "text-xs"} ${isHighContrast ? "contrast-secondary-text" : "text-slate-500"}`}>
                  Modo facil, contraste y ayuda
                </span>
              </span>
            </span>
            <ShieldCheck className={isAccessible ? "h-6 w-6" : "h-5 w-5"} aria-hidden="true" />
          </button>

          <div className={`mb-3 rounded-2xl px-4 py-3 ${isHighContrast ? "bg-black/30" : isAccessible ? "border border-slate-200 bg-slate-50" : "bg-slate-50"}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${isHighContrast ? "text-yellow-200/70" : "text-slate-500"}`}>
              Usuario
            </p>
            <p className={`mt-1.5 font-semibold leading-tight ${isHighContrast ? "text-white" : "text-slate-900"} ${isAccessible ? "text-lg" : "text-sm"}`}>
              {user.label}
            </p>
            <p className={`mt-0.5 truncate text-xs ${isHighContrast ? "text-white/60" : "text-slate-500"} ${isAccessible ? "text-sm" : ""}`}>
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
              isHighContrast
                ? "contrast-button-secondary"
                : isAccessible
                  ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900"
                  : "border-slate-300 bg-slate-50 text-slate-950 hover:bg-slate-100 focus-visible:ring-blue-500"
            } ${isAccessible ? "min-h-[60px] text-base" : "min-h-[40px] text-xs"}`}
          >
            <LogOut className={isAccessible ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>

          {typeof window !== "undefined" && window.innerWidth < 1024 && (
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate(getDefaultRouteForRole(user.role))
              }}
              className={`mt-2 w-full rounded-xl border px-4 py-3 font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
                isHighContrast
                  ? "contrast-button-secondary"
                  : isAccessible
                    ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-900"
                    : "border-slate-300 bg-transparent text-slate-600 hover:bg-slate-50 focus-visible:ring-blue-500"
              }`}
            >
              Volver al inicio
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

export default AppSidebar
