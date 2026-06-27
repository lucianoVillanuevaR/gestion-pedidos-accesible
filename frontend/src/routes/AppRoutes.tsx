import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import LoadingState from "../components/ui/LoadingState";
import { getDefaultRouteForRole } from "../constants/auth";
import { useAuthContext } from "../contexts/AuthContext";
import type { UserRole } from "../types";

const ClientesPage = lazy(() => import("../pages/clientes/ClientesPage"));
const CocinaPage = lazy(() => import("../pages/cocina/CocinaPage"));
const CocinaFacilPage = lazy(() =>
  import("../pages/cocina/CocinaPage").then((module) => ({ default: module.CocinaFacilPage }))
);
const CocinaHistorialPage = lazy(() =>
  import("../pages/cocina/CocinaPage").then((module) => ({ default: module.CocinaHistorialPage }))
);
const HomePage = lazy(() => import("../pages/HomePage"));
const InventarioPage = lazy(() => import("../pages/inventario/InventarioPage"));
const ModoFacilPage = lazy(() => import("../pages/ModoFacilPage"));
const CierreTurnoPage = lazy(() => import("../pages/pedidos/CierreTurnoPage"));
const PedidosFacilPage = lazy(() => import("../pages/pedidos/PedidosFacilPage"));
const PedidosPage = lazy(() => import("../pages/pedidos/PedidosNormalPage"));
const PdvBasePage = lazy(() => import("../pages/pdv/PdvBasePage"));
const ProductosFacilPage = lazy(() => import("../pages/productos/ProductosFacilPage"));
const ProductosPage = lazy(() => import("../pages/productos/ProductosPage"));
const PortalPage = lazy(() => import("../pages/PortalPage"));

function RequireAuth() {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  return <AppLayout />;
}

function RequireRole({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user } = useAuthContext();

  if (!user) {
    return <Navigate replace to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to={getDefaultRouteForRole(user.role)} />;
  }

  return <Outlet />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState label="Cargando sección..." />}>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Navigate replace to="/pdv" />} />

          <Route element={<RequireRole allowedRoles={["cajero", "admin"]} />}>
            <Route path="/pdv" element={<PdvBasePage isAccessible={false} />} />
            <Route path="/modo-facil" element={<ModoFacilPage />} />
            <Route path="/pdv/facil" element={<PdvBasePage isAccessible />} />

            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/pedidos/facil" element={<PedidosFacilPage />} />
            <Route path="/cierre-turno" element={<CierreTurnoPage />} />
            <Route path="/cierre-turno/facil" element={<CierreTurnoPage />} />

            <Route path="/preparacion" element={<CocinaPage />} />
            <Route path="/preparacion/facil" element={<CocinaFacilPage />} />

            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/productos/facil" element={<ProductosFacilPage />} />

            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/inventario/facil" element={<InventarioPage isAccessible />} />

            <Route path="/historial-pedidos" element={<CocinaHistorialPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
          </Route>

          <Route element={<RequireRole allowedRoles={["cocina", "admin"]} />}>
            <Route path="/cocina" element={<CocinaPage />} />
            <Route path="/cocina/facil" element={<CocinaFacilPage />} />
          </Route>

          <Route element={<RequireRole allowedRoles={["admin"]} />}>
            <Route
              path="/configuracion"
              element={
                <PortalPage
                  accent="slate"
                  title="Configuración"
                  description="Organiza ajustes del sistema en una vista sencilla, sin menús enredados ni lenguaje técnico."
                  badge="Ajustes"
                  actions={[
                    {
                      title: "Usuarios y permisos",
                      description: "Centraliza roles y accesos con una estructura clara para cada perfil del negocio.",
                      button: "Gestionar"
                    },
                    {
                      title: "Operación del local",
                      description: "Agrupa horarios, mensajes internos y reglas del sistema en un solo lugar.",
                      button: "Abrir ajustes"
                    },
                    {
                      title: "Parámetros del pedido",
                      description: "Define opciones futuras de cocina, tickets y cobro sin perder simplicidad.",
                      button: "Revisar"
                    }
                  ]}
                  noteTitle="Configuración sin complejidad"
                  note="La meta es que incluso ajustes más delicados se sientan claros y guiados, no técnicos ni intimidantes."
                />
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
