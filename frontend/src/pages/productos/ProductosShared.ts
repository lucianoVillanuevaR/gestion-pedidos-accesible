import type { Producto } from "../../types";
import {
  detectCategoria,
  FILTROS,
  formatCurrency,
  type ProductoCategoria,
  type ProductoConCategoria
} from "../../utils/pdv";

export type CategoriaCatalogo = ProductoCategoria | "Destacados";

export const CATEGORIAS_CATALOGO: Array<{ label: string; value: CategoriaCatalogo }> = [
  { label: "Destacados", value: "Destacados" },
  ...FILTROS.filter((filtro) => filtro.value !== "Todos" && filtro.value !== "Destacados").map((filtro) => ({
    label: filtro.label,
    value: filtro.value as ProductoCategoria
  })),
  { label: "Otros", value: "Otros" }
];

export function withProductoCategoria(productos: Producto[]): ProductoConCategoria[] {
  return productos.map((producto) => ({
    ...producto,
    categoria: detectCategoria(producto)
  }));
}

export function filterCatalogoProductos(productos: ProductoConCategoria[], searchTerm: string) {
  const search = searchTerm.trim().toLowerCase();

  if (!search) {
    return productos;
  }

  return productos.filter((producto) => {
    const searchableText = [
      producto.nombre,
      producto.descripcion ?? "",
      producto.categoria,
      producto.destacado ? "destacado" : "",
      producto.disponible === false ? "oculto no disponible" : "disponible",
      String(producto.precio),
      formatCurrency(producto.precio)
    ].join(" ");

    return searchableText.toLowerCase().includes(search);
  });
}

export function groupProductosByCategoria(productos: ProductoConCategoria[]) {
  const destacados = productos.filter((producto) => producto.destacado);
  const fallbackDestacados = destacados.length > 0 ? destacados : productos.slice(0, 4);

  return CATEGORIAS_CATALOGO.map((categoria) => ({
    ...categoria,
    productos:
      categoria.value === "Destacados"
        ? fallbackDestacados
        : productos.filter((producto) => producto.categoria === categoria.value)
  })).filter((grupo) => grupo.productos.length > 0);
}

