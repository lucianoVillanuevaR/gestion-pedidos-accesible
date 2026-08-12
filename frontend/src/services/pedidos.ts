import type { CreatePedidoPayload, EstadoPedido, PedidoResponse, UpdatePedidoPayload } from "../types";
import { apiRequest } from "./api";

export async function createPedido(payload: CreatePedidoPayload) {
  return apiRequest<PedidoResponse>("/pedidos", {
    fallbackMessage: "Error creando pedido",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function getPedidos(signal?: AbortSignal) {
  return apiRequest<PedidoResponse[]>("/pedidos", {
    fallbackMessage: "Error obteniendo pedidos",
    signal
  });
}

export async function getPedido(id: number, signal?: AbortSignal) {
  return apiRequest<PedidoResponse>(`/pedidos/${id}`, {
    fallbackMessage: "Error obteniendo pedido",
    signal
  });
}

export async function updatePedido(id: number, payload: UpdatePedidoPayload) {
  return apiRequest<PedidoResponse>(`/pedidos/${id}`, {
    fallbackMessage: "Error modificando pedido",
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updatePedidoEstado(id: number, estado: EstadoPedido) {
  return apiRequest<PedidoResponse>(`/pedidos/${id}/estado`, {
    fallbackMessage: "Error actualizando estado del pedido",
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado })
  });
}
