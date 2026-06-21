import type { CreateProductoPayload, Producto, UpdateProductoPayload } from "../types";
import { resolveProductImage } from "../utils/productImages";
import { apiRequest } from "./api";

function normalizeProducto(producto: Producto & { precio: number | string }): Producto {
  const imagen = resolveProductImage(producto);

  return {
    ...producto,
    precio: typeof producto.precio === "string" ? Number(producto.precio) : producto.precio,
    imagen: imagen ?? undefined,
    altText: producto.altText || `Imagen de ${producto.nombre}`
  };
}

async function readProductoResponse(path: string, fallbackMessage: string, init?: RequestInit) {
  const producto = await apiRequest<Producto & { precio: number | string }>(path, { ...init, fallbackMessage });
  return normalizeProducto(producto);
}

export async function getProductos({ includeUnavailable = false }: { includeUnavailable?: boolean } = {}): Promise<
  Producto[]
> {
  const query = includeUnavailable ? "?includeUnavailable=true" : "";
  const data = await apiRequest<Array<Producto & { precio: number | string }>>(`/api/productos${query}`, {
    fallbackMessage: "Error cargando productos"
  });
  return data.map(normalizeProducto);
}

export async function createProducto(payload: CreateProductoPayload): Promise<Producto> {
  return readProductoResponse("/api/productos", "Error creando producto", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
}

export async function updateProducto(id: number, payload: UpdateProductoPayload): Promise<Producto> {
  return readProductoResponse(`/api/productos/${id}`, "Error actualizando producto", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });
}

export async function deleteProducto(id: number): Promise<void> {
  await apiRequest<void>(`/api/productos/${id}`, { fallbackMessage: "Error eliminando producto", method: "DELETE" });
}

export async function uploadProductImage(productId: number, file: File): Promise<Producto> {
  const formData = new FormData();
  formData.append("imagen", file);

  return readProductoResponse(`/api/productos/${productId}/imagen`, "No se pudo subir la imagen", {
    body: formData,
    method: "POST"
  });
}

export async function deleteProductImage(productId: number): Promise<Producto> {
  return readProductoResponse(`/api/productos/${productId}/imagen`, "No se pudo eliminar la imagen", {
    method: "DELETE"
  });
}
