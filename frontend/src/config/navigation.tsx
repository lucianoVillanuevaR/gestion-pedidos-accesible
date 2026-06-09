import {
  ChefHat,
  ClipboardList,
  ClipboardPlus,
  Package,
  Settings2,
  UsersRound,
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
    label: "Pedidos",
    path: "/pedidos",
    description: "Ver pedidos activos",
    icon: ClipboardList,
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
    allowedRoles: ["admin"]
  },
  {
    label: "Cocina",
    path: "/cocina",
    description: "Vista general de cocina",
    icon: ChefHat,
    allowedRoles: ["cocina", "admin"]
  },
  {
    label: "Historial de pedidos",
    path: "/historial-pedidos",
    description: "Pedidos listos y recientes",
    icon: ClipboardList,
    allowedRoles: ["cajero", "admin"]
  },
  {
    label: "Clientes",
    path: "/clientes",
    description: "Registro y segmentos",
    icon: UsersRound,
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
  return pathname === "/pedidos" || pathname === "/pedidos/facil"
}

export function isProductosRoute(pathname: string) {
  return pathname === "/productos" || pathname === "/productos/facil"
}

export function isCocinaRoute(pathname: string) {
  return pathname === "/cocina" || pathname === "/cocina/facil" || pathname.startsWith("/cocina/")
}

export function isHistorialPedidosRoute(pathname: string) {
  return pathname === "/historial-pedidos"
}

export function isClientesRoute(pathname: string) {
  return pathname === "/clientes"
}
