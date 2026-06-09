import { Accessibility, LogOut, ShieldCheck, X } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import logoRiq from "../assets/logoRiq.png"
import { getSidebarNavigation, isClientesRoute, isHistorialPedidosRoute, isPdvRoute, isPedidosRoute, isProductosRoute } from "../config/navigation"
import { useAccessibilityContext } from "../contexts/AccessibilityContext"
import { useAuthContext } from "../contexts/AuthContext"
import { getDefaultRouteForRole } from "../constants/auth"
import useActionVoice from "../hooks/useActionVoice"
import SidebarNavItem from "./SidebarNavItem"

type AppSidebarProps = {
  hasTopBrandBar?: boolean
  isOpen: boolean
  onClose: () => void
}

const VOICED_SIDEBAR_ITEMS = new Set(["Nuevo Pedido", "Pedidos", "Productos"])

function AppSidebar({ hasTopBrandBar = false, isOpen, onClose }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAccessible, isHighContrast, isPanelOpen, isVoiceEnabled, openAccessibilityPanel } = useAccessibilityContext()
  const { logout, user } = useAuthContext()
  const { speakAction } = useActionVoice(isVoiceEnabled)

  if (!user) {
    return null
  }

  const navigationItems = getSidebarNavigation(user.role)
  const isPdvPage = isPdvRoute(location.pathname)
  const isPedidosPage = isPedidosRoute(location.pathname)
  const isProductosPage = isProductosRoute(location.pathname)
  const isHistorialPedidosPage = isHistorialPedidosRoute(location.pathname)
  const isClientesPage = isClientesRoute(location.pathname)
  const hasYellowHeader = isPdvPage || isPedidosPage || isProductosPage || isHistorialPedidosPage || isClientesPage
  const widthClass = isAccessible ? "w-[92vw] max-w-[368px] lg:w-[368px]" : "w-[82vw] max-w-[280px] lg:w-[240px]"
  const brandHeaderClass = isHighContrast
    ? "border-yellow-400"
    : isAccessible
      ? "border-slate-300 bg-slate-50 text-slate-950"
      : hasYellowHeader
        ? "border-amber-200 bg-[#FECE00] text-slate-950"
        : "border-slate-200 bg-white text-slate-950"
  const brandBadgeClass = isHighContrast
    ? "bg-white/10 border border-white/20"
    : isAccessible
      ? "bg-slate-950 border border-slate-950 text-white"
      : hasYellowHeader
        ? "bg-[#FFF8DC] border border-amber-300"
        : "bg-slate-100 border border-slate-300"
  const brandTitleClass = isHighContrast ? "text-white" : "text-slate-950"
  const brandSubtitleClass = isHighContrast ? "text-yellow-200/80" : isAccessible ? "text-slate-700" : hasYellowHeader ? "text-slate-700" : "text-slate-500"
  const brandCloseButtonClass = isHighContrast
    ? "contrast-button-secondary"
    : isAccessible
      ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
      : hasYellowHeader
        ? "border-amber-300 bg-[#FFF8DC] text-slate-950 hover:bg-[#FFF4BF]"
        : "border-slate-300 bg-slate-100 text-slate-950 hover:bg-slate-200"
  const brandHeaderSpacingClass = hasYellowHeader
    ? `${isAccessible ? "h-[84px] min-h-[84px]" : "h-[56px] min-h-[56px]"} px-3`
    : `px-3 ${isAccessible ? "py-5" : "py-3"}`
  const navigationSpacingClass = isAccessible ? "space-y-3" : "space-y-1.5"
  const footerSpacingClass = isAccessible ? "mt-auto border-t px-4 py-5" : "mt-auto border-t px-2.5 py-3"
  const accessibilityButtonClass = isHighContrast
    ? "contrast-button-secondary"
    : isAccessible
      ? "border-slate-900 bg-white text-slate-950 hover:bg-slate-50 focus-visible:ring-slate-900"
      : "border-slate-300 bg-slate-50 text-slate-950 hover:bg-slate-100 focus-visible:ring-amber-400"

  const handleLogout = () => {
    logout()
    onClose()
    navigate("/", { replace: true })
  }

  const handleOpenAccessibility = () => {
    openAccessibilityPanel()
    onClose()
  }

  const handleSidebarNavigate = (label: string) => {
    if (!VOICED_SIDEBAR_ITEMS.has(label)) {
      onClose()
      return
    }

    speakAction(label, `sidebar:${label}`)
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
          hasTopBrandBar ? "lg:bottom-0 lg:top-12 lg:h-[calc(100vh-48px)]" : ""
        } ${
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
        <div className={`flex items-center justify-between gap-3 border-b ${brandHeaderSpacingClass} ${brandHeaderClass} ${hasTopBrandBar ? "lg:hidden" : ""}`}>
          <div className="min-w-0 flex items-center gap-2">
            <div className={`flex ${isAccessible ? "h-14 w-14" : "h-9 w-9"} items-center justify-center rounded-xl p-1.5 ${brandBadgeClass}`}>
              <img src={logoRiq} alt="Logo de Riquísimo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className={`truncate font-black tracking-tight ${brandTitleClass} ${isAccessible ? "text-[1.5rem]" : "text-[13px]"}`}>
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

        <div className={`flex-1 overflow-y-auto ${isAccessible ? "px-4 py-5" : "px-2.5 py-3"}`}>
          <nav className={navigationSpacingClass}>
            {navigationItems.map((item) => (
              <SidebarNavItem
                key={item.path}
                item={item}
                pathOverride={
                  isAccessible && item.path === "/pdv"
                    ? "/pdv/facil"
                    : isAccessible && item.path === "/pedidos"
                      ? "/pedidos/facil"
                    : isAccessible && item.path === "/productos"
                      ? "/productos/facil"
                      : isAccessible && item.path === "/cocina"
                        ? "/cocina/facil"
                        : undefined
                }
                isAccessible={isAccessible}
                isHighContrast={isHighContrast}
                onNavigate={() => handleSidebarNavigate(item.label)}
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
            className={`mb-2 inline-flex w-full items-center justify-between gap-2 rounded-2xl border px-3 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${accessibilityButtonClass} ${isAccessible ? "min-h-[68px]" : "min-h-[48px]"}`}
          >
            <span className="flex min-w-0 items-center gap-2 text-left">
              <span className={`inline-flex items-center justify-center rounded-2xl ${isAccessible ? "h-12 w-12 text-2xl" : "h-9 w-9 text-xl"} ${isHighContrast ? "border border-current bg-black/10" : "bg-slate-900 text-white"}`}>
                <Accessibility className={isAccessible ? "h-6 w-6" : "h-[18px] w-[18px]"} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className={`block font-black leading-tight ${isAccessible ? "text-lg" : "text-[13px]"}`}>
                  Accesibilidad
                </span>
                <span className={`mt-0.5 block ${isAccessible ? "text-sm" : "text-[11px]"} ${isHighContrast ? "contrast-secondary-text" : "text-slate-500"}`}>
                  Modo facil, contraste y ayuda
                </span>
              </span>
            </span>
            <ShieldCheck className={isAccessible ? "h-6 w-6" : "h-5 w-5"} aria-hidden="true" />
          </button>

          <div className={`mb-2 rounded-2xl px-3 py-2.5 ${isHighContrast ? "bg-black/30" : isAccessible ? "border border-slate-200 bg-slate-50" : "bg-slate-50"}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${isHighContrast ? "text-yellow-200/70" : "text-slate-500"}`}>
              Usuario
            </p>
            <p className={`mt-1 font-semibold leading-tight ${isHighContrast ? "text-white" : "text-slate-900"} ${isAccessible ? "text-lg" : "text-[13px]"}`}>
              {user.label}
            </p>
            <p className={`mt-0.5 truncate text-[11px] ${isHighContrast ? "text-white/60" : "text-slate-500"} ${isAccessible ? "text-sm" : ""}`}>
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
                  ? "border-red-800 bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700"
                  : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500"
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
                    : "border-slate-300 bg-transparent text-slate-600 hover:bg-slate-50 focus-visible:ring-amber-400"
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
