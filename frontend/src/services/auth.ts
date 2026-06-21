import type { AuthUser } from "../types";
import { apiRequest } from "./api";

type AuthResponse = { token?: string; user?: AuthUser };

export async function loginRequest(identifier: string, password: string) {
  const body = await apiRequest<AuthResponse>("/auth/login", {
    authenticated: false,
    fallbackMessage: "No fue posible iniciar sesión",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password })
  });
  if (!body.user || !body.token) throw new Error("Respuesta de autenticación inválida");
  return { user: body.user, token: body.token };
}

export async function getCurrentUser() {
  const body = await apiRequest<AuthResponse>("/auth/me", { fallbackMessage: "Sesión inválida" });
  if (!body.user) throw new Error("Sesión inválida");
  return body.user;
}
