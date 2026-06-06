import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import { getDefaultRouteForRole } from "../constants/auth"
import { useAuthContext } from "../contexts/AuthContext"
import HomePage from "../pages/HomePage"
import PedidosFacilPage from "../pages/pedidos/PedidosFacilPage"
import PedidosPage from "../pages/pedidos/PedidosNormalPage"
import PdvBasePage from "../pages/pdv/PdvBasePage"
import ProductosPage from "../pages/productos/ProductosPage"
import PortalPage from "../pages/PortalPage"
import type { UserRole } from "../types"

function EmptyRoute() {
  return <div aria-hidden="true" className="min-h-[1px]" />
}

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
        <Route path="/dashboard" element={<Navigate replace to="/inicio" />} />

        <Route element={<RequireRole allowedRoles={["cajero", "admin"]} />}>
          <Route path="/inicio" element={<EmptyRoute />} />

          <Route path="/pdv" element={<PdvBasePage isAccessible={false} />} />
          <Route path="/pdv/facil" element={<PdvBasePage isAccessible />} />

          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/pedidos/facil" element={<PedidosFacilPage />} />

          <Route path="/productos" element={<ProductosPage />} />
        </Route>

        <Route element={<RequireRole allowedRoles={["cocina", "admin"]} />}>
          <Route
            path="/cocina"
            element={
              <PortalPage
                accent="orange"
                title="Cocina"
                description="Visualiza el flujo general de preparación con una interfaz simple y fácil de seguir."
                badge="Producción"
                stats={[
                  { label: "Pendientes", value: "8" },
                  { label: "En preparación", value: "4" },
                  { label: "Listos", value: "5" }
                ]}
                actions={[
                  {
                    title: "Pedidos pendientes",
                    description: "Revisa primero lo que aún no empieza para ordenar mejor la preparación.",
                    button: "Abrir pendientes"
                  },
                  {
                    title: "Pedidos listos",
                    description: "Confirma lo que ya está preparado y listo para entrega o retiro.",
                    button: "Ver listos"
                  },
                  {
                    title: "Ritmo del turno",
                    description: "Mantén una visión clara del trabajo actual sin sobrecargar la pantalla.",
                    button: "Ver estado"
                  }
                ]}
                noteTitle="Cocina sin ruido visual"
                note="La vista de cocina debe mostrar pocas decisiones por pantalla, con estados grandes y tiempos fáciles de reconocer."
              />
            }
          />

          <Route
            path="/cocina/pendientes"
            element={
              <PortalPage
                accent="orange"
                title="Pedidos pendientes"
                description="Ordena las comandas que faltan por preparar y ayuda a priorizar el trabajo del turno."
                badge="Pendientes"
                actions={[
                  {
                    title: "Prioridad alta",
                    description: "Destina una zona clara a pedidos urgentes o con mayor tiempo de espera.",
                    button: "Ver urgentes"
                  },
                  {
                    title: "Turno actual",
                    description: "Mantén agrupadas las comandas activas sin esconder información importante.",
                    button: "Ver turno"
                  },
                  {
                    title: "Entrega simple",
                    description: "Prepara esta vista para marcar pedidos listos con un solo toque.",
                    button: "Configurar flujo"
                  }
                ]}
                noteTitle="Listo para operación"
                note="Esta pantalla puede evolucionar hacia una cola visual grande, con pocos colores y botones amplios para touch."
              />
            }
          />

          <Route
            path="/cocina/listos"
            element={
              <PortalPage
                accent="orange"
                title="Pedidos listos"
                description="Agrupa pedidos terminados para entrega rápida y sin confusiones en el retiro."
                badge="Listos"
                actions={[
                  {
                    title: "Entregas del turno",
                    description: "Muestra claramente qué comandas ya están listas para despacho o retiro.",
                    button: "Ver entregas"
                  },
                  {
                    title: "Confirmar salida",
                    description: "Deja preparado un flujo simple para cerrar pedidos sin pasos innecesarios.",
                    button: "Confirmar"
                  },
                  {
                    title: "Historial reciente",
                    description: "Conserva una vista breve de lo recién completado para evitar dudas del equipo.",
                    button: "Ver recientes"
                  }
                ]}
                noteTitle="Entrega más ordenada"
                note="En un flujo real, esta vista puede ayudar mucho a bajar la carga cognitiva del equipo en horas de mayor demanda."
              />
            }
          />
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
            path="/ventas"
            element={
              <PortalPage
                accent="slate"
                title="Ventas"
                description="Consulta indicadores y resultados con una vista limpia, profesional y fácil de leer."
                badge="Resultados"
                stats={[
                  { label: "Ventas hoy", value: "$248.900" },
                  { label: "Pedidos cobrados", value: "57" },
                  { label: "Ticket promedio", value: "$4.367" }
                ]}
                actions={[
                  {
                    title: "Resumen diario",
                    description: "Prepara una lectura rápida del desempeño del local sin saturar con tablas complejas.",
                    button: "Ver resumen"
                  },
                  {
                    title: "Métodos de pago",
                    description: "Observa cómo se distribuyen efectivo, tarjeta y transferencia durante el turno.",
                    button: "Analizar"
                  },
                  {
                    title: "Comparar turnos",
                    description: "Deja lista una vista simple para comparar días o franjas horarias.",
                    button: "Comparar"
                  }
                ]}
                noteTitle="Datos con lectura amable"
                note="Las ventas también pueden ser accesibles: menos ruido visual, cifras grandes y mensajes accionables."
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
