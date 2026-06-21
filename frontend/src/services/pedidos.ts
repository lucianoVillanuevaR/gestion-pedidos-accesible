import type { CreatePedidoPayload, EstadoPedido, PedidoResponse } from "../types";
import { apiRequest } from "./api";

export async function createPedido(payload: CreatePedidoPayload) {
  return apiRequest<PedidoResponse>("/api/pedidos", {
    fallbackMessage: "Error creando pedido",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function getPedidos(signal?: AbortSignal) {
  return apiRequest<PedidoResponse[]>("/api/pedidos", { fallbackMessage: "Error obteniendo pedidos", signal });
}

export async function updatePedidoEstado(id: number, estado: EstadoPedido) {
  return apiRequest<PedidoResponse>(`/api/pedidos/${id}/estado`, {
    fallbackMessage: "Error actualizando estado del pedido",
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado })
  });
}
