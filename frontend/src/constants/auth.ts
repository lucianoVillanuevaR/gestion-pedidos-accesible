import type { DemoUser, UserRole } from "../types";

export const AUTH_STORAGE_KEY = "riquisimo-auth-session";
export const AUTH_TOKEN_STORAGE_KEY = "riquisimo-auth-token";

export const DEMO_USERS: DemoUser[] = import.meta.env.DEV
  ? [
      {
        email: "cajero@demo.cl",
        username: "cajero",
        password: "123456",
        role: "cajero",
        label: "Cajero"
      },
      {
        email: "cocina@demo.cl",
        username: "cocina",
        password: "123456",
        role: "cocina",
        label: "Cocina"
      },
      {
        email: "admin@demo.cl",
        username: "admin",
        password: "123456",
        role: "admin",
        label: "Administrador"
      }
    ]
  : [];

export function getDefaultRouteForRole(role: UserRole) {
  if (role === "cocina") {
    return "/cocina";
  }

  if (role === "cajero") {
    return "/pdv";
  }

  return "/pdv";
}
