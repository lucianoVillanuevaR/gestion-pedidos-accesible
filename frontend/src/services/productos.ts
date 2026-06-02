import type { Producto } from "../types";
import { resolveProductImage } from "../utils/productImages";
import { buildApiUrl } from "./api";

export async function getProductos(): Promise<Producto[]> {
  const res = await fetch(buildApiUrl("/api/productos"));
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
