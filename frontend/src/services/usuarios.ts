import type { AdminUser, CreateUserPayload, UpdateUserPayload } from "../types";
import { apiRequest } from "./api";

export async function getUsuarios(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>("/usuarios", { fallbackMessage: "Error cargando usuarios" });
}

export async function createUsuario(payload: CreateUserPayload): Promise<AdminUser> {
  return apiRequest<AdminUser>("/usuarios", {
    body: JSON.stringify(payload),
    fallbackMessage: "Error creando usuario",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
}

export async function updateUsuario(id: number, payload: UpdateUserPayload): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/usuarios/${id}`, {
    body: JSON.stringify(payload),
    fallbackMessage: "Error actualizando usuario",
    headers: { "Content-Type": "application/json" },
    method: "PATCH"
  });
}
