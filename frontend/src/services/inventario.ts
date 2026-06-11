import type { ApiError, InventarioItem, UpdateInventarioPayload } from "../types";
import { buildApiUrl } from "./api";

async function parseInventarioError(res: Response, fallbackMessage: string) {
  const errorData = (await res.json().catch(() => ({}))) as ApiError;
  throw new Error(errorData.error || errorData.message || fallbackMessage);
}

export async function getInventario(signal?: AbortSignal): Promise<InventarioItem[]> {
  const res = await fetch(buildApiUrl("/api/inventario"), { signal });

  if (!res.ok) {
    await parseInventarioError(res, "Error cargando inventario");
  }

  return (await res.json()) as InventarioItem[];
}

export async function updateInventario(productoId: number, payload: UpdateInventarioPayload): Promise<InventarioItem> {
  const res = await fetch(buildApiUrl(`/api/inventario/${productoId}`), {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });

  if (!res.ok) {
    await parseInventarioError(res, "Error actualizando inventario");
  }

  return (await res.json()) as InventarioItem;
}
