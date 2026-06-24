import type { InventarioItem, UpdateInventarioPayload } from "../types";
import { apiRequest } from "./api";

export async function getInventario(signal?: AbortSignal): Promise<InventarioItem[]> {
  const items = await apiRequest<InventarioItem[]>("/inventario", {
    fallbackMessage: "Error cargando inventario",
    signal
  });
  return items.filter((item) => item.controlaStock !== false && item.tipo !== "promo" && item.tipo !== "combo");
}

export async function updateInventario(productoId: number, payload: UpdateInventarioPayload): Promise<InventarioItem> {
  return apiRequest<InventarioItem>(`/inventario/${productoId}`, {
    fallbackMessage: "Error actualizando inventario",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });
}
