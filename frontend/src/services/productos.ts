import type { Producto } from "../types";
import { buildApiUrl } from "./api";

export async function getProductos(): Promise<Producto[]> {
  const res = await fetch(buildApiUrl("/api/productos"));
  if (!res.ok) {
    throw new Error("Error cargando productos");
  }

  const data = await res.json();
  return (data as any[]).map((p) => ({
    ...p,
    precio: typeof p.precio === "string" ? Number(p.precio) : p.precio
  }));
}
