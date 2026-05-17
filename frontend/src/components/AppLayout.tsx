import { Menu } from "lucide-react"
import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { getRouteMeta } from "../config/navigation"
import { useAccessibilityContext } from "../contexts/AccessibilityContext"
import AppSidebar from "./AppSidebar"

function AppLayout() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isAccessible, isHighContrast } = useAccessibilityContext()

  const currentRoute = getRouteMeta(location.pathname)
  const isPdvPage = location.pathname === "/pdv"
  const sidebarOffsetClass = isAccessible ? "lg:pl-[360px]" : "lg:pl-[320px]"
  const mainContentClass = isPdvPage
    ? "px-0 py-0"
    : `px-4 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-8 ${isAccessible ? "lg:px-10" : ""}`

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    const previousOverflow = document.body.style.overflow

    if (isSidebarOpen) {
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isSidebarOpen])

  useEffect(() => {
    if (!isSidebarOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isSidebarOpen])

  return (
    <div
      className={`min-h-screen ${
        isHighContrast
          ? "bg-black text-white"
          : isAccessible
            ? "bg-[#F3F4F6] text-slate-950"
            : "bg-[radial-gradient(circle_at_top_left,#fff3bf_0%,#f8fafc_38%,#ffffff_100%)] text-slate-950"
      }`}
    >
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={sidebarOffsetClass}>
        <header
          className={`sticky top-0 z-30 border-b px-4 py-3 backdrop-blur lg:hidden ${
            isHighContrast
              ? "border-yellow-400 bg-black/95 text-white"
              : "border-slate-200 bg-white/95 shadow-sm shadow-slate-200/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition ${
                isHighContrast
                  ? "contrast-button-secondary"
                  : "border-slate-300 bg-slate-100 text-slate-950 hover:bg-slate-200"
              }`}
              aria-label="Abrir navegación"
              aria-expanded={isSidebarOpen}
              aria-controls="main-sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className={`font-semibold leading-tight ${isAccessible ? "text-base" : "text-sm"} ${isHighContrast ? "text-white" : "text-slate-900"}`}>
                {currentRoute?.label ?? "Riquísimo"}
              </p>
              <p className={`mt-0.5 truncate text-xs ${isHighContrast ? "text-white/60" : "text-slate-500"}`}>
                {currentRoute?.description ?? "Sistema de pedidos"}
              </p>
            </div>
          </div>
        </header>

        <main id="main-content" className={mainContentClass}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
