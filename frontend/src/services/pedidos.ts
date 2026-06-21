import type { CreatePedidoPayload, EstadoPedido, PedidoResponse } from "../types";
import { authenticatedFetch, buildApiUrl, throwApiError } from "./api";

export async function createPedido(payload: CreatePedidoPayload) {
  const res = await authenticatedFetch(buildApiUrl("/api/pedidos"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    await throwApiError(res, "Error creando pedido");
  }

  return (await res.json()) as PedidoResponse;
}

export async function getPedidos(signal?: AbortSignal) {
  const res = await authenticatedFetch(buildApiUrl("/api/pedidos"), { signal });

  if (!res.ok) {
    await throwApiError(res, "Error obteniendo pedidos");
  }

  return (await res.json()) as PedidoResponse[];
}

export async function updatePedidoEstado(id: number, estado: EstadoPedido) {
  const res = await authenticatedFetch(buildApiUrl(`/api/pedidos/${id}/estado`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado })
  });

  if (!res.ok) {
    await throwApiError(res, "Error actualizando estado del pedido");
  }

  return (await res.json()) as PedidoResponse;
}
