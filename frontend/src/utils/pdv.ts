import type { MetodoPago, PersonalizacionProducto, Producto } from "../types";

export type ProductoCategoria = "Sandwich" | "Completos" | "Bebidas" | "Otros";
export type ProductoCategoriaCatalogo = ProductoCategoria | (string & {});
export type FiltroCategoria = ProductoCategoriaCatalogo | "Destacados" | "Todos";
export type ProductoConCategoria = Producto & { categoria: ProductoCategoriaCatalogo };

interface PedidoDetalleCalculado {
  itemKey: string;
  producto: Producto;
  productoId: number;
  cantidad: number;
  subtotal: number;
  variante?: NonNullable<Producto["variantes"]>[number];
  personalizacion?: PersonalizacionProducto;
}

export const FILTROS: Array<{ value: FiltroCategoria; label: string }> = [
  { value: "Destacados", label: "Destacados" },
  { value: "Completos", label: "Completos" },
  { value: "Sandwich", label: "Sandwich" },
  { value: "Bebidas", label: "Bebidas" },
  { value: "Todos", label: "Todos" }
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

export function getCategoriaLabel(categoria: ProductoCategoriaCatalogo) {
  switch (categoria) {
    case "Sandwich":
      return "Sandwich";
    case "Completos":
      return "Completos";
    case "Bebidas":
      return "Bebidas";
    case "Otros":
      return "Otros";
    default:
      return categoria;
  }
}

export function getPaymentLabel(value: MetodoPago | "") {
  if (value === "efectivo") return "Efectivo";
  if (value === "tarjeta") return "Tarjeta";
  if (value === "transferencia") return "Transferencia";
  return "Pendiente";
}

export function buildPedidoSummary(
  items: Record<string, number>,
  productos: Producto[],
  personalizaciones: Record<string, PersonalizacionProducto> = {}
) {
  const detalles = Object.entries(items)
    .map(([itemKey, cantidad]) => {
      const [productoId, varianteId] = itemKey.split(":").map(Number);
      const producto = productos.find((item) => item.id === productoId);
      if (!producto) {
        return null;
      }

      return {
        itemKey,
        producto,
        productoId: producto.id,
        cantidad,
        subtotal: producto.precio * cantidad,
        variante: varianteId ? producto.variantes?.find((item) => item.id === varianteId) : undefined,
        personalizacion: personalizaciones[itemKey]
      };
    })
    .filter(Boolean) as PedidoDetalleCalculado[];

  const total = detalles.reduce((accumulator, item) => accumulator + item.subtotal, 0);
  const cantidad = detalles.reduce((accumulator, item) => accumulator + item.cantidad, 0);

  return { detalles, total, cantidad };
}

export function filterProductosByCategory(productos: ProductoConCategoria[], selectedCategory: FiltroCategoria) {
  if (selectedCategory === "Todos") {
    return productos;
  }

  if (selectedCategory === "Destacados") {
    const destacados = productos.filter((producto) => producto.destacado);
    return destacados.length > 0 ? destacados : productos.slice(0, 4);
  }

  return productos.filter((producto) => producto.categoria === selectedCategory);
}

export function filterProductosBySearch(productos: ProductoConCategoria[], searchTerm: string) {
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
