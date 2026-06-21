import type { InventarioItem, UpdateInventarioPayload } from "../types";
import { authenticatedFetch, buildApiUrl, throwApiError } from "./api";

export async function getInventario(signal?: AbortSignal): Promise<InventarioItem[]> {
  const res = await authenticatedFetch(buildApiUrl("/api/inventario"), { signal });

  if (!res.ok) {
    await throwApiError(res, "Error cargando inventario");
  }

  return (await res.json()) as InventarioItem[];
}

export async function updateInventario(productoId: number, payload: UpdateInventarioPayload): Promise<InventarioItem> {
  const res = await authenticatedFetch(buildApiUrl(`/api/inventario/${productoId}`), {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });

  if (!res.ok) {
    await throwApiError(res, "Error actualizando inventario");
  }

  return (await res.json()) as InventarioItem;
}
