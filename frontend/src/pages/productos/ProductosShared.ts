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

export const CUSTOM_CATEGORIES_STORAGE_KEY = "riquisimo-custom-product-categories";

export const CATEGORIAS_CATALOGO: CategoriaCatalogoOption[] = [
  { label: "Destacados", value: "Destacados" },
  ...FILTROS.filter((filtro) => filtro.value !== "Todos" && filtro.value !== "Destacados").map((filtro) => ({
    label: filtro.label,
    value: filtro.value as ProductoCategoria
  })),
  { label: "Otros", value: "Otros" }
];

export function loadCustomCategorias(): CategoriaCatalogoOption[] {
  try {
    const storedCategorias = window.localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);

    if (!storedCategorias) {
      return [];
    }

    const parsedCategorias = JSON.parse(storedCategorias) as CategoriaCatalogoOption[];

    if (!Array.isArray(parsedCategorias)) {
      return [];
    }

    return parsedCategorias.filter((categoria) => typeof categoria?.label === "string" && typeof categoria?.value === "string");
  } catch {
    return [];
  }
}

export function saveCustomCategorias(categorias: CategoriaCatalogoOption[]) {
  window.localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(categorias));
}

export function mergeCategorias(customCategorias: CategoriaCatalogoOption[]) {
  const categoriaMap = new Map<CategoriaCatalogo, CategoriaCatalogoOption>();

  [...CATEGORIAS_CATALOGO, ...customCategorias].forEach((categoria) => {
    const label = categoria.label.trim();
    const value = String(categoria.value).trim() as CategoriaCatalogo;

    if (label && value && !categoriaMap.has(value)) {
      categoriaMap.set(value, { label, value });
    }
  });

  return [...categoriaMap.values()];
}

export function withProductoCategoria(productos: Producto[], categorias = CATEGORIAS_CATALOGO): ProductoConCategoria[] {
  const categoriasDisponibles = new Set(categorias.map((categoria) => categoria.value));

  return productos.map((producto) => ({
    ...producto,
    categoria: producto.categoria?.trim() && categoriasDisponibles.has(producto.categoria.trim() as CategoriaCatalogo)
      ? (producto.categoria.trim() as CategoriaCatalogo)
      : detectCategoria(producto)
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
