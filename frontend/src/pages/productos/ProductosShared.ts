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
export type CategoriaCatalogoOption = {
  activa: boolean | null;
  id?: number;
  label: string;
  value: CategoriaCatalogo;
};

export const CATEGORIAS_CATALOGO: CategoriaCatalogoOption[] = [
  { activa: null, label: "Destacados", value: "Destacados" },
  ...FILTROS.filter((filtro) => filtro.value !== "Todos" && filtro.value !== "Destacados").map((filtro) => ({
    activa: null,
    label: filtro.label,
    value: filtro.value as ProductoCategoria
  })),
  { activa: null, label: "Otros", value: "Otros" }
];

export const BASE_CATEGORY_NAMES = new Set<CategoriaCatalogo>([
  "Ahorros exclusivos",
  "Promociones",
  "Completos",
  "Sandwich",
  "Bebidas",
  "Otros"
]);

export function isCategoriaBase(categoria: CategoriaCatalogo) {
  return BASE_CATEGORY_NAMES.has(categoria);
}

const CATEGORIA_ALIASES: Record<string, CategoriaCatalogo> = {
  "Completos / Hot Dogs": "Completos",
  "Completos / Hot dogs": "Completos"
};

function normalizeCategoriaCatalogo(categoria: string): CategoriaCatalogo {
  const cleanCategoria = categoria.trim();
  return CATEGORIA_ALIASES[cleanCategoria] ?? (cleanCategoria as CategoriaCatalogo);
}

export function mergeCategorias(customCategorias: CategoriaCatalogoOption[]) {
  const categoriaMap = new Map<CategoriaCatalogo, CategoriaCatalogoOption>();

  [...CATEGORIAS_CATALOGO, ...customCategorias].forEach((categoria) => {
    const label = categoria.label.trim();
    const value = normalizeCategoriaCatalogo(String(categoria.value));
    const normalizedLabel = CATEGORIA_ALIASES[label] ?? label;

    if (label && value) {
      const current = categoriaMap.get(value);
      categoriaMap.set(value, {
        activa: categoria.activa ?? current?.activa ?? null,
        id: categoria.id ?? current?.id,
        label: normalizedLabel,
        value
      });
    }
  });

  return [...categoriaMap.values()];
}

export function buildCategoriasCatalogo(productos: Producto[], customCategorias: CategoriaCatalogoOption[] = []) {
  const categoriasProductos = productos
    .map((producto) => producto.categoria?.trim())
    .filter((categoria): categoria is string => Boolean(categoria))
    .map((categoria) => {
      const value = normalizeCategoriaCatalogo(categoria);
      return { activa: null, label: value, value };
    });

  return mergeCategorias([...customCategorias, ...categoriasProductos]);
}

export function isCategoriaActiva(categoria: CategoriaCatalogo, categorias: CategoriaCatalogoOption[]) {
  return categorias.find((item) => item.value === categoria)?.activa !== false;
}

export function filterProductosByCategoriasActivas(productos: Producto[], categorias: CategoriaCatalogoOption[]) {
  return withProductoCategoria(productos, categorias).filter((producto) =>
    isCategoriaActiva(producto.categoria, categorias)
  );
}

export function withProductoCategoria(productos: Producto[], categorias = CATEGORIAS_CATALOGO): ProductoConCategoria[] {
  const categoriasDisponibles = new Set(categorias.map((categoria) => categoria.value));

  return productos.map((producto) => {
    const categoria = producto.categoria ? normalizeCategoriaCatalogo(producto.categoria) : null;

    return {
      ...producto,
      categoria: categoria && categoriasDisponibles.has(categoria) ? categoria : detectCategoria(producto)
    };
  });
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

  return categorias
    .map((categoria) => ({
      ...categoria,
      productos:
        categoria.value === "Destacados"
          ? fallbackDestacados
          : productos.filter((producto) => producto.categoria === categoria.value)
    }))
    .filter((grupo) => grupo.productos.length > 0 || !categoriasBase.has(grupo.value));
}
