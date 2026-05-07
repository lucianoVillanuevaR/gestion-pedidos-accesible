import type { MetodoPago, Producto } from "../types";

export type ProductoCategoria = "Sandwich" | "Bebidas" | "Extras" | "Otros";
export type FiltroCategoria = ProductoCategoria | "Destacados" | "Todos";

export interface PedidoDetalleCalculado {
  producto: Producto;
  productoId: number;
  cantidad: number;
  subtotal: number;
}

export const FILTROS: Array<{ value: FiltroCategoria; label: string }> = [
  { value: "Todos", label: "Todos" },
  { value: "Sandwich", label: "Sandwich" },
  { value: "Bebidas", label: "Bebidas" },
  { value: "Extras", label: "Extras" },
  { value: "Destacados", label: "Destacados" }
];

function normalizeText(value: string) {
  return value.toLowerCase();
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);
}

export function detectCategoria(producto: Pick<Producto, "nombre">): ProductoCategoria {
  const nombre = normalizeText(producto.nombre);

  if (
    nombre.includes("hamburguesa") ||
    nombre.includes("sandwich") ||
    nombre.includes("completo") ||
    nombre.includes("chacarero") ||
    nombre.includes("luco")
  ) {
    return "Sandwich";
  }

  if (nombre.includes("bebida") || nombre.includes("jugo") || nombre.includes("agua") || nombre.includes("te")) {
    return "Bebidas";
  }

  if (nombre.includes("papas") || nombre.includes("extra") || nombre.includes("postre") || nombre.includes("ensalada")) {
    return "Extras";
  }

  return "Otros";
}

export function getCategoriaLabel(categoria: ProductoCategoria) {
  switch (categoria) {
    case "Sandwich":
      return "Sandwich";
    case "Bebidas":
      return "Bebidas";
    case "Extras":
      return "Extras";
    default:
      return "Otros";
  }
}

export function getPaymentLabel(value: MetodoPago | "") {
  if (value === "efectivo") return "Efectivo";
  if (value === "tarjeta") return "Tarjeta";
  if (value === "transferencia") return "Transferencia";
  return "Pendiente";
}

export function buildPedidoSummary(items: Record<number, number>, productos: Producto[]) {
  const detalles = Object.entries(items)
    .map(([productoId, cantidad]) => {
      const producto = productos.find((item) => item.id === Number(productoId));
      if (!producto) {
        return null;
      }

      return {
        producto,
        productoId: producto.id,
        cantidad,
        subtotal: producto.precio * cantidad
      };
    })
    .filter(Boolean) as PedidoDetalleCalculado[];

  const total = detalles.reduce((accumulator, item) => accumulator + item.subtotal, 0);
  const cantidad = detalles.reduce((accumulator, item) => accumulator + item.cantidad, 0);

  return { detalles, total, cantidad };
}
