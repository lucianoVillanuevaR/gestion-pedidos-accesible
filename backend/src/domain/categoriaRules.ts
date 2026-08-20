export const BASE_CATEGORY_NAMES = [
  "Ahorros exclusivos",
  "Promociones",
  "Completos",
  "Sandwich",
  "Bebidas",
  "Otros"
] as const;

export const DERIVED_CATEGORY_NAME = "Destacados";

const protectedCategoryNames = new Set<string>([...BASE_CATEGORY_NAMES, DERIVED_CATEGORY_NAME]);

export function isBaseCategory(nombre: string) {
  return BASE_CATEGORY_NAMES.includes(nombre as (typeof BASE_CATEGORY_NAMES)[number]);
}

export function isProtectedCategory(nombre: string) {
  return protectedCategoryNames.has(nombre);
}
