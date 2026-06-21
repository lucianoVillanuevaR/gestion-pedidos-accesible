import type { AuthUser } from "../types";
import { authenticatedFetch, buildApiUrl } from "./api";

async function parseResponse(response: Response) {
  const body = (await response.json()) as { error?: string; token?: string; user?: AuthUser };
  if (!response.ok) throw new Error(body.error || "No fue posible iniciar sesión");
  return body;
}

export async function loginRequest(identifier: string, password: string) {
  const response = await fetch(buildApiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password })
  });
  const body = await parseResponse(response);
  if (!body.user || !body.token) throw new Error("Respuesta de autenticación inválida");
  return { user: body.user, token: body.token };
}

export async function getCurrentUser() {
  const body = await parseResponse(await authenticatedFetch(buildApiUrl("/api/auth/me")));
  if (!body.user) throw new Error("Sesión inválida");
  return body.user;
}
