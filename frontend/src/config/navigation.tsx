import { ChefHat, ClipboardList, ClipboardPlus, FileCheck2, Package, Settings2, Warehouse } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "../types";

export type AppNavigationItem = {
  allowedRoles: UserRole[];
  description: string;
  icon: LucideIcon;
  label: string;
  path: string;
  sidebarRoles?: UserRole[];
};

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
    description: "Turnos cerrados y ventas pasadas",
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
];

const EASY_ROUTE_BY_STANDARD_PATH: Record<string, string> = {
  "/pdv": "/pdv/facil",
  "/pedidos": "/pedidos/facil",
  "/cierre-turno": "/cierre-turno/facil",
  "/preparacion": "/preparacion/facil",
  "/productos": "/productos/facil",
  "/inventario": "/inventario/facil",
  "/cocina": "/cocina/facil"
};

const EASY_HOME_ROUTE_BY_STANDARD_PATH: Record<string, string> = {
  ...EASY_ROUTE_BY_STANDARD_PATH,
  "/pdv": "/modo-facil"
};

const STANDARD_ROUTE_BY_EASY_PATH: Record<string, string> = {
  "/modo-facil": "/pdv",
  "/pdv/facil": "/pdv",
  "/pedidos/facil": "/pedidos",
  "/cierre-turno/facil": "/cierre-turno",
  "/preparacion/facil": "/preparacion",
  "/productos/facil": "/productos",
  "/inventario/facil": "/inventario",
  "/cocina/facil": "/cocina"
};

export function getSidebarNavigation(role: UserRole) {
  return APP_NAVIGATION_ITEMS.filter((item) => {
    const roles = item.sidebarRoles ?? item.allowedRoles;
    return roles.includes(role);
  });
}

export function getRouteMeta(pathname: string) {
  return [...APP_NAVIGATION_ITEMS]
    .sort((left, right) => right.path.length - left.path.length)
    .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
}

export function getEasyRoute(pathname: string, { useEasyHome = false }: { useEasyHome?: boolean } = {}) {
  const routeMap = useEasyHome ? EASY_HOME_ROUTE_BY_STANDARD_PATH : EASY_ROUTE_BY_STANDARD_PATH;
  return routeMap[pathname];
}

export function getStandardRoute(pathname: string) {
  return STANDARD_ROUTE_BY_EASY_PATH[pathname];
}

export function isEasyRoute(pathname: string) {
  return pathname === "/modo-facil" || Object.values(EASY_ROUTE_BY_STANDARD_PATH).includes(pathname);
}

export function isPdvRoute(pathname: string) {
  return pathname === "/pdv" || pathname === "/pdv/facil";
}

export function isPedidosRoute(pathname: string) {
  return (
    pathname === "/pedidos" ||
    pathname === "/pedidos/facil" ||
    pathname === "/cierre-turno" ||
    pathname === "/cierre-turno/facil"
  );
}

export function isProductosRoute(pathname: string) {
  return pathname === "/productos" || pathname === "/productos/facil";
}

export function isCocinaRoute(pathname: string) {
  return (
    pathname === "/cocina" ||
    pathname === "/cocina/facil" ||
    pathname === "/preparacion" ||
    pathname === "/preparacion/facil" ||
    pathname.startsWith("/cocina/")
  );
}

export function isHistorialPedidosRoute(pathname: string) {
  return pathname === "/historial-pedidos";
}

export function isClientesRoute(pathname: string) {
  return pathname === "/clientes";
}

export function isInventarioRoute(pathname: string) {
  return pathname === "/inventario" || pathname === "/inventario/facil";
}
