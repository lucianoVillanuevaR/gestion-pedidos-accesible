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
    try {
      const errorBody = (await res.json()) as ApiError;
      throw new Error(errorBody.message || errorBody.error || fallbackMessage);
    } catch {
      const text = await res.text();
      throw new Error(text || fallbackMessage);
    }
  }

  return (await res.json()) as PedidoResponse;
}
