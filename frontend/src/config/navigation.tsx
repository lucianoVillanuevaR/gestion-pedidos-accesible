import {
  ChefHat,
  ClipboardList,
  ClipboardPlus,
  FileCheck2,
  Package,
  Settings2,
  Warehouse
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { UserRole } from "../types"

export type AppNavigationItem = {
  allowedRoles: UserRole[]
  description: string
  icon: LucideIcon
  label: string
  path: string
  sidebarRoles?: UserRole[]
}

const APP_NAVIGATION_ITEMS: AppNavigationItem[] = [
  {
    label: "Nuevo Pedido",
    path: "/pdv",
    description: "Registrar un pedido nuevo",
    icon: ClipboardPlus,
    allowedRoles: ["cajero", "admin"]
  },
  {
    label: "Pedidos activos",
    path: "/pedidos",
    description: "Ver pedidos activos",
    icon: ClipboardList,
    allowedRoles: ["cajero", "admin"]
  },
  {
    label: "Preparación",
    path: "/preparacion",
    description: "Gestionar preparación y entrega",
    icon: ChefHat,
    allowedRoles: ["cajero", "admin"]
  },
  {
    label: "Productos",
    path: "/productos",
    description: "Catálogo del menú",
    icon: Package,
    allowedRoles: ["cajero", "admin"]
  },
  {
    label: "Inventario",
    path: "/inventario",
    description: "Control de stock",
    icon: Warehouse,
    allowedRoles: ["cajero", "admin"]
  },
  {
    label: "Preparación",
    path: "/cocina",
    description: "Vista general de cocina",
    icon: ChefHat,
    allowedRoles: ["cocina", "admin"],
    sidebarRoles: ["cocina"]
  },
  {
    label: "Historial",
    path: "/historial-pedidos",
    description: "Pedidos listos y recientes",
    icon: ClipboardList,
    allowedRoles: ["cajero", "admin"]
  },
  {
    label: "Cierre de turno",
    path: "/cierre-turno",
    description: "Resumen y cierre del turno",
    icon: FileCheck2,
    allowedRoles: ["cajero", "admin"]
  },
  {
    label: "Configuración",
    path: "/configuracion",
    description: "Ajustes del sistema",
    icon: Settings2,
    allowedRoles: ["admin"]
  }
]

export function getSidebarNavigation(role: UserRole) {
  return APP_NAVIGATION_ITEMS.filter((item) => {
    const roles = item.sidebarRoles ?? item.allowedRoles
    return roles.includes(role)
  })
}

export function getRouteMeta(pathname: string) {
  return [...APP_NAVIGATION_ITEMS]
    .sort((left, right) => right.path.length - left.path.length)
    .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
}

export function isPdvRoute(pathname: string) {
  return pathname === "/pdv" || pathname === "/pdv/facil"
}

export function isPedidosRoute(pathname: string) {
  return pathname === "/pedidos" || pathname === "/pedidos/facil" || pathname === "/cierre-turno" || pathname === "/cierre-turno/facil"
}

export function isProductosRoute(pathname: string) {
  return pathname === "/productos" || pathname === "/productos/facil"
}

export function isCocinaRoute(pathname: string) {
  return pathname === "/cocina" || pathname === "/cocina/facil" || pathname === "/preparacion" || pathname === "/preparacion/facil" || pathname.startsWith("/cocina/")
}

export function isHistorialPedidosRoute(pathname: string) {
  return pathname === "/historial-pedidos"
}

export function isClientesRoute(pathname: string) {
  return pathname === "/clientes"
}

export function isInventarioRoute(pathname: string) {
  return pathname === "/inventario" || pathname === "/inventario/facil"
}
