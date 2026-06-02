import type { ApiError, CreatePedidoPayload, PedidoResponse } from "../types";
import { buildApiUrl } from "./api";

export async function createPedido(payload: CreatePedidoPayload) {
  const res = await fetch(buildApiUrl("/api/pedidos"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const fallbackMessage = "Error creando pedido";
    const rawBody = await res.text();

    if (!rawBody) {
      throw new Error(fallbackMessage);
    }

    try {
      const errorBody = JSON.parse(rawBody) as ApiError;
      throw new Error(errorBody.message || errorBody.error || fallbackMessage);
    } catch {
      throw new Error(rawBody || fallbackMessage);
    }
  }

  return (await res.json()) as PedidoResponse;
}
