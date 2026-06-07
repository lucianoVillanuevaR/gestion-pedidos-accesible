import type { ApiError, CreateProductoPayload, Producto, UpdateProductoPayload } from "../types";
import { resolveProductImage } from "../utils/productImages";
import { buildApiUrl } from "./api";

export async function getProductos({ includeUnavailable = false }: { includeUnavailable?: boolean } = {}): Promise<Producto[]> {
  const query = includeUnavailable ? "?includeUnavailable=true" : "";
  const res = await fetch(buildApiUrl(`/api/productos${query}`));
  if (!res.ok) {
    throw new Error("Error cargando productos");
  }

  const data = (await res.json()) as Array<Producto & { precio: number | string }>;
  return data.map((producto) => ({
    ...producto,
    precio: typeof producto.precio === "string" ? Number(producto.precio) : producto.precio,
    imagen: producto.imagen || resolveProductImage(producto.nombre),
    altText: producto.altText || producto.nombre
  }));
}

export async function createProducto(payload: CreateProductoPayload): Promise<Producto> {
  const res = await fetch(buildApiUrl("/api/productos"), {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as ApiError;
    throw new Error(errorData.error || errorData.message || "Error creando producto");
  }

  const producto = (await res.json()) as Producto & { precio: number | string };

  return {
    ...producto,
    precio: typeof producto.precio === "string" ? Number(producto.precio) : producto.precio,
    imagen: producto.imagen || resolveProductImage(producto.nombre),
    altText: producto.altText || producto.nombre
  };
}

export async function updateProducto(id: number, payload: UpdateProductoPayload): Promise<Producto> {
  const res = await fetch(buildApiUrl(`/api/productos/${id}`), {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as ApiError;
    throw new Error(errorData.error || errorData.message || "Error actualizando producto");
  }

  const producto = (await res.json()) as Producto & { precio: number | string };

  return {
    ...producto,
    precio: typeof producto.precio === "string" ? Number(producto.precio) : producto.precio,
    imagen: producto.imagen || resolveProductImage(producto.nombre),
    altText: producto.altText || producto.nombre
  };
}
