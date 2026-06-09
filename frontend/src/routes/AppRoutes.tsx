import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import { getDefaultRouteForRole } from "../constants/auth"
import { useAuthContext } from "../contexts/AuthContext"
import ClientesPage from "../pages/clientes/ClientesPage"
import CocinaPage, { CocinaFacilPage, CocinaHistorialPage } from "../pages/cocina/CocinaPage"
import HomePage from "../pages/HomePage"
import PedidosFacilPage from "../pages/pedidos/PedidosFacilPage"
import PedidosPage from "../pages/pedidos/PedidosNormalPage"
import PdvBasePage from "../pages/pdv/PdvBasePage"
import ProductosFacilPage from "../pages/productos/ProductosFacilPage"
import ProductosPage from "../pages/productos/ProductosPage"
import PortalPage from "../pages/PortalPage"
import type { UserRole } from "../types"

function RequireAuth() {
  const { isAuthenticated } = useAuthContext()

  if (!isAuthenticated) {
    return <Navigate replace to="/" />
  }

  return <AppLayout />
}

function RequireRole({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user } = useAuthContext()

  if (!user) {
    return <Navigate replace to="/" />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to={getDefaultRouteForRole(user.role)} />
  }

  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Navigate replace to="/pdv" />} />

        <Route element={<RequireRole allowedRoles={["cajero", "admin"]} />}>
          <Route path="/pdv" element={<PdvBasePage isAccessible={false} />} />
          <Route path="/pdv/facil" element={<PdvBasePage isAccessible />} />

          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/pedidos/facil" element={<PedidosFacilPage />} />

          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/productos/facil" element={<ProductosFacilPage />} />

          <Route path="/historial-pedidos" element={<CocinaHistorialPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
        </Route>

        <Route element={<RequireRole allowedRoles={["cocina", "admin"]} />}>
          <Route path="/cocina" element={<CocinaPage />} />
          <Route path="/cocina/facil" element={<CocinaFacilPage />} />
        </Route>

        <Route element={<RequireRole allowedRoles={["admin"]} />}>
          <Route
            path="/inventario"
            element={
              <PortalPage
                accent="slate"
                title="Inventario"
                description="Controla stock y disponibilidad con información directa, visible y ordenada."
                badge="Operación interna"
                actions={[
                  {
                    title: "Stock crítico",
                    description: "Destaca rápido los productos o insumos que necesitan reposición pronta.",
                    button: "Revisar"
                  },
                  {
                    title: "Actualización simple",
                    description: "Prepara formularios con pocos campos y botones grandes para reducir errores.",
                    button: "Actualizar"
                  },
                  {
                    title: "Disponibilidad",
                    description: "Conecta el stock con la venta para evitar pedidos de productos agotados.",
                    button: "Gestionar"
                  }
                ]}
                noteTitle="Base para control diario"
                note="Aquí conviene crecer con alertas claras, pocos pasos y mensajes muy fáciles de entender para cualquier operador."
              />
            }
          />

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
  )
}

export default AppRoutes
