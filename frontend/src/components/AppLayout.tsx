import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import logoRiq from "../assets/logoRiq.png";
import {
  getEasyRoute,
  getRouteMeta,
  getStandardRoute,
  isClientesRoute,
  isCocinaRoute,
  isEasyRoute,
  isHistorialPedidosRoute,
  isInventarioRoute,
  isPdvRoute,
  isPedidosRoute,
  isProductosRoute,
  isAdminRoute
} from "../config/navigation";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import AppSidebar from "./AppSidebar";

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAccessible, isHighContrast } = useAccessibilityContext();

  const currentRoute = getRouteMeta(location.pathname);
  const isEasyPage = isEasyRoute(location.pathname);
  const isPdvPage = isPdvRoute(location.pathname);
  const isPdvNormalPage = location.pathname === "/pdv" && !isAccessible;
  const isPedidosPage = isPedidosRoute(location.pathname);
  const isProductosPage = isProductosRoute(location.pathname);
  const isInventarioPage = isInventarioRoute(location.pathname);
  const isCocinaPage = isCocinaRoute(location.pathname);
  const isHistorialPedidosPage = isHistorialPedidosRoute(location.pathname);
  const isClientesPage = isClientesRoute(location.pathname);
  const isAdminPage = isAdminRoute(location.pathname);
  const isFullWidthPage =
    isEasyPage ||
    isPdvPage ||
    isPedidosPage ||
    isProductosPage ||
    isInventarioPage ||
    isCocinaPage ||
    isHistorialPedidosPage ||
    isClientesPage ||
    isAdminPage;
  const showBrandTopBar =
    !isAccessible &&
    (isPdvPage ||
      isPedidosPage ||
      isProductosPage ||
      isInventarioPage ||
      isCocinaPage ||
      isHistorialPedidosPage ||
      isClientesPage ||
      isAdminPage);
  const hideSidebar = isEasyPage || (isAccessible && (location.pathname === "/pdv" || isHistorialPedidosPage));
  const sidebarOffsetClass = hideSidebar ? "" : isAccessible ? "lg:pl-[368px]" : "lg:pl-[240px]";
  const pageShellClass = isFullWidthPage ? "w-full" : "mx-auto w-full max-w-[1400px]";
  const mainContentClass = isFullWidthPage
    ? `px-0 py-0 ${isPdvNormalPage ? "h-[calc(100dvh-48px)] overflow-hidden" : ""}`
    : `px-4 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-8 ${isAccessible ? "lg:px-10" : ""}`;
  const appBackgroundClass = isHighContrast
    ? "bg-black text-white"
      : isAccessible
        ? "bg-[#F3F4F6] text-slate-950"
      : isPedidosPage ||
          isProductosPage ||
          isInventarioPage ||
          isCocinaPage ||
          isHistorialPedidosPage ||
          isClientesPage ||
          isAdminPage
        ? "bg-slate-50 text-slate-950"
        : "bg-[radial-gradient(circle_at_top_left,#fff3bf_0%,#f8fafc_38%,#ffffff_100%)] text-slate-950";

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const nextPath = isAccessible
      ? getEasyRoute(location.pathname, { useEasyHome: true })
      : getStandardRoute(location.pathname);

    if (nextPath) {
      navigate(nextPath, { replace: true });
    }
  }, [isAccessible, location.pathname, navigate]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSidebarOpen]);

  return (
    <div className={`${isPdvNormalPage ? "h-dvh overflow-hidden" : "min-h-screen"} ${appBackgroundClass}`}>
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      {showBrandTopBar && (
        <header className="fixed inset-x-0 top-0 z-[60] hidden h-12 items-center border-b border-yellow-300 bg-[#FECE00] px-4 text-slate-950 shadow-sm lg:flex">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-yellow-300 bg-[#FFF8DC] p-1">
              <img src={logoRiq} alt="Logo de Riquísimo" className="h-full w-full object-contain" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black leading-tight">Riquísimo</p>
              <p className="truncate text-[10px] font-medium leading-tight text-slate-700">Sistema de Pedidos</p>
            </div>
          </div>
        </header>
      )}

      {!hideSidebar && (
        <AppSidebar hasTopBrandBar={showBrandTopBar} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      <div
        className={`${sidebarOffsetClass} ${showBrandTopBar ? "lg:pt-12" : ""} ${isPdvNormalPage ? "h-dvh overflow-hidden" : ""}`}
      >
        {!hideSidebar && (
          <header
            className={`sticky top-0 z-30 border-b backdrop-blur lg:hidden ${
              isHighContrast
                ? "border-yellow-400 bg-black/95 text-white"
                : "border-slate-200 bg-white/95 shadow-sm shadow-slate-200/30"
            }`}
          >
            <div
              className={`mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 ${isAccessible ? "min-h-[80px] py-4" : "min-h-[68px] py-3"}`}
            >
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className={`inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : isAccessible
                      ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900"
                      : "border-slate-300 bg-slate-100 text-slate-950 hover:bg-slate-200 focus-visible:ring-yellow-400"
                }`}
                aria-label="Abrir navegación"
                aria-expanded={isSidebarOpen}
                aria-controls="main-sidebar"
              >
                <Menu className={isAccessible ? "h-6 w-6" : "h-5 w-5"} />
              </button>

              <div className="min-w-0">
                <p
                  className={`font-black leading-tight ${isAccessible ? "text-xl" : "text-sm"} ${isHighContrast ? "text-white" : "text-slate-900"}`}
                >
                  {currentRoute?.label ?? "Riquísimo"}
                </p>
                <p
                  className={`mt-1 truncate ${isAccessible ? "text-sm" : "text-xs"} ${isHighContrast ? "text-white/60" : "text-slate-500"}`}
                >
                  {currentRoute?.description ?? "Sistema de pedidos"}
                </p>
              </div>
            </div>
          </header>
        )}

        <main id="main-content" className={mainContentClass}>
          <div className={`${pageShellClass} ${isPdvNormalPage ? "h-full" : ""}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
