import type { InventarioItem, UpdateInventarioPayload } from "../types";
import { apiRequest } from "./api";

export async function getInventario(signal?: AbortSignal): Promise<InventarioItem[]> {
  return apiRequest<InventarioItem[]>("/api/inventario", { fallbackMessage: "Error cargando inventario", signal });
}

export async function updateInventario(productoId: number, payload: UpdateInventarioPayload): Promise<InventarioItem> {
  return apiRequest<InventarioItem>(`/api/inventario/${productoId}`, {
    fallbackMessage: "Error actualizando inventario",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });
}
