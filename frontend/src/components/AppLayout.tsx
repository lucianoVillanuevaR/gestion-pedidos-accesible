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
  const hideSidebar = isPdvPage && isAccessible
  const sidebarOffsetClass = hideSidebar ? "" : isAccessible ? "lg:pl-[360px]" : "lg:pl-[320px]"
  const pageShellClass = isPdvPage ? "w-full" : "mx-auto w-full max-w-[1400px]"
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

      {!hideSidebar && <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

      <div className={sidebarOffsetClass}>
        {!hideSidebar && (
          <header
            className={`sticky top-0 z-30 border-b backdrop-blur lg:hidden ${
              isHighContrast
                ? "border-yellow-400 bg-black/95 text-white"
                : "border-slate-200 bg-white/95 shadow-sm shadow-slate-200/30"
            }`}
          >
            <div className={`mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 ${isAccessible ? "min-h-[80px] py-4" : "min-h-[68px] py-3"}`}>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className={`inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : isAccessible
                      ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900"
                      : "border-slate-300 bg-slate-100 text-slate-950 hover:bg-slate-200 focus-visible:ring-blue-500"
                }`}
                aria-label="Abrir navegación"
                aria-expanded={isSidebarOpen}
                aria-controls="main-sidebar"
              >
                <Menu className={isAccessible ? "h-6 w-6" : "h-5 w-5"} />
              </button>

              <div className="min-w-0">
                <p className={`font-black leading-tight ${isAccessible ? "text-xl" : "text-sm"} ${isHighContrast ? "text-white" : "text-slate-900"}`}>
                  {currentRoute?.label ?? "Riquísimo"}
                </p>
                <p className={`mt-1 truncate ${isAccessible ? "text-sm" : "text-xs"} ${isHighContrast ? "text-white/60" : "text-slate-500"}`}>
                  {currentRoute?.description ?? "Sistema de pedidos"}
                </p>
              </div>
            </div>
          </header>
        )}

        <main id="main-content" className={mainContentClass}>
          <div className={pageShellClass}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
