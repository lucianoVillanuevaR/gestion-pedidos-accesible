import type { MetodoPago, Producto } from "../types";

export type ProductoCategoria = "Sandwich" | "Completos" | "Bebidas" | "Otros";
export type FiltroCategoria = ProductoCategoria | "Destacados" | "Todos";
export type ProductoConCategoria = Producto & { categoria: ProductoCategoria };

export interface PedidoDetalleCalculado {
  producto: Producto;
  productoId: number;
  cantidad: number;
  subtotal: number;
}

export const FILTROS: Array<{ value: FiltroCategoria; label: string }> = [
  { value: "Todos", label: "Todos" },
  { value: "Sandwich", label: "Sandwich" },
  { value: "Completos", label: "Completos" },
  { value: "Bebidas", label: "Bebidas" },
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

  if (nombre.includes("completo")) {
    return "Completos";
  }

  if (
    nombre.includes("hamburguesa") ||
    nombre.includes("sandwich") ||
    nombre.includes("chacarero") ||
    nombre.includes("luco")
  ) {
    return "Sandwich";
  }

  if (nombre.includes("bebida") || nombre.includes("jugo") || nombre.includes("agua") || nombre.includes("te")) {
    return "Bebidas";
  }

  return "Otros";
}

export function getCategoriaLabel(categoria: ProductoCategoria) {
  switch (categoria) {
    case "Sandwich":
      return "Sandwich";
    case "Completos":
      return "Completos";
    case "Bebidas":
      return "Bebidas";
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

export function filterProductosByCategory(
  productos: ProductoConCategoria[],
  selectedCategory: FiltroCategoria,
  items: Record<number, number>
) {
  if (selectedCategory === "Todos") {
    return productos;
  }

  if (selectedCategory === "Destacados") {
    const destacados = productos.filter((producto) => (items[producto.id] || 0) > 0);
    return destacados.length > 0 ? destacados : productos.slice(0, 4);
  }

  return productos.filter((producto) => producto.categoria === selectedCategory);
}

export function filterProductosBySearch(
  productos: ProductoConCategoria[],
  searchTerm: string
) {
  if (!searchTerm.trim()) {
    return productos;
  }

  const search = searchTerm.toLowerCase();

  return productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(search) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(search))
  );
}
