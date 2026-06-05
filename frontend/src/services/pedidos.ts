import type { ApiError, CreatePedidoPayload, EstadoPedido, PedidoResponse } from "../types";
import { buildApiUrl } from "./api";

async function parsePedidoError(res: Response, fallbackMessage: string) {
  const rawBody = await res.text();

  if (!rawBody) {
    throw new Error(fallbackMessage);
  }

  let errorBody: ApiError;

  try {
    errorBody = JSON.parse(rawBody) as ApiError;
  } catch {
    throw new Error(rawBody || fallbackMessage);
  }

  throw new Error(errorBody.message || errorBody.error || fallbackMessage);
}

export async function createPedido(payload: CreatePedidoPayload) {
  const res = await fetch(buildApiUrl("/api/pedidos"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    await parsePedidoError(res, "Error creando pedido");
  }

  return (await res.json()) as PedidoResponse;
}

export async function getPedidos(signal?: AbortSignal) {
  const res = await fetch(buildApiUrl("/api/pedidos"), { signal });

  if (!res.ok) {
    await parsePedidoError(res, "Error obteniendo pedidos");
  }

  return (await res.json()) as PedidoResponse[];
}

export async function updatePedidoEstado(id: number, estado: EstadoPedido) {
  const res = await fetch(buildApiUrl(`/api/pedidos/${id}/estado`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado })
  });

  if (!res.ok) {
    await parsePedidoError(res, "Error actualizando estado del pedido");
  }

  return (await res.json()) as PedidoResponse;
}
