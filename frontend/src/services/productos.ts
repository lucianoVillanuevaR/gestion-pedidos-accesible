import type { CreateProductoPayload, Producto, UpdateProductoPayload } from "../types";
import { resolveProductImage } from "../utils/productImages";
import { authenticatedFetch, buildApiUrl, throwApiError } from "./api";

function normalizeProducto(producto: Producto & { precio: number | string }): Producto {
  const imagen = resolveProductImage(producto);

  return {
    ...producto,
    precio: typeof producto.precio === "string" ? Number(producto.precio) : producto.precio,
    imagen: imagen ?? undefined,
    altText: producto.altText || `Imagen de ${producto.nombre}`
  };
}

async function readProductoResponse(res: Response, fallbackMessage: string) {
  if (!res.ok) {
    await throwApiError(res, fallbackMessage);
  }

  const producto = (await res.json()) as Producto & { precio: number | string };
  return normalizeProducto(producto);
}

export async function getProductos({ includeUnavailable = false }: { includeUnavailable?: boolean } = {}): Promise<
  Producto[]
> {
  const query = includeUnavailable ? "?includeUnavailable=true" : "";
  const res = await authenticatedFetch(buildApiUrl(`/api/productos${query}`));
  if (!res.ok) throw new Error("Error cargando productos");
  const data = (await res.json()) as Array<Producto & { precio: number | string }>;
  return data.map(normalizeProducto);
}

export async function createProducto(payload: CreateProductoPayload): Promise<Producto> {
  const res = await authenticatedFetch(buildApiUrl("/api/productos"), {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  return readProductoResponse(res, "Error creando producto");
}

export async function updateProducto(id: number, payload: UpdateProductoPayload): Promise<Producto> {
  const res = await authenticatedFetch(buildApiUrl(`/api/productos/${id}`), {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });

  return readProductoResponse(res, "Error actualizando producto");
}

export async function deleteProducto(id: number): Promise<void> {
  const res = await authenticatedFetch(buildApiUrl(`/api/productos/${id}`), {
    method: "DELETE"
  });

  if (!res.ok) {
    await throwApiError(res, "Error eliminando producto");
  }
}

export async function uploadProductImage(productId: number, file: File): Promise<Producto> {
  const formData = new FormData();
  formData.append("imagen", file);

  const res = await authenticatedFetch(buildApiUrl(`/api/productos/${productId}/imagen`), {
    body: formData,
    method: "POST"
  });

  return readProductoResponse(res, "No se pudo subir la imagen");
}

export async function deleteProductImage(productId: number): Promise<Producto> {
  const res = await authenticatedFetch(buildApiUrl(`/api/productos/${productId}/imagen`), {
    method: "DELETE"
  });

  return readProductoResponse(res, "No se pudo eliminar la imagen");
}
