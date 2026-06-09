import type { Producto } from "../../types";
import {
  detectCategoria,
  FILTROS,
  formatCurrency,
  type ProductoCategoriaCatalogo,
  type ProductoCategoria,
  type ProductoConCategoria
} from "../../utils/pdv";

export type CategoriaCatalogo = ProductoCategoriaCatalogo | "Destacados";
export type CategoriaCatalogoOption = { label: string; value: CategoriaCatalogo };

export const CATEGORIAS_CATALOGO: CategoriaCatalogoOption[] = [
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
    categoria: producto.categoria?.trim() || detectCategoria(producto)
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

export function groupProductosByCategoria(productos: ProductoConCategoria[], categorias = CATEGORIAS_CATALOGO) {
  const destacados = productos.filter((producto) => producto.destacado);
  const fallbackDestacados = destacados.length > 0 ? destacados : productos.slice(0, 4);
  const categoriasBase = new Set(CATEGORIAS_CATALOGO.map((categoria) => categoria.value));

  return categorias.map((categoria) => ({
    ...categoria,
    productos:
      categoria.value === "Destacados"
        ? fallbackDestacados
        : productos.filter((producto) => producto.categoria === categoria.value)
  })).filter((grupo) => grupo.productos.length > 0 || !categoriasBase.has(grupo.value));
}
