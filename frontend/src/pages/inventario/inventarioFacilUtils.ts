import type { InventarioEstado, InventarioItem } from "../../types";
import { normalizeSearchText } from "../../utils/formatters";

export type InventarioFacilFilter = InventarioEstado | "todos";

export function countInventarioFacil(items: InventarioItem[]) {
  return {
    disponible: items.filter((item) => item.estado === "disponible").length,
    bajo_stock: items.filter((item) => item.estado === "bajo_stock").length,
    sin_stock: items.filter((item) => item.estado === "sin_stock").length
  };
}

export function getInventarioFacilEstadoLabel(estado: InventarioEstado) {
  if (estado === "sin_stock") return "Agotado";
  if (estado === "bajo_stock") return "Poco stock";
  return "Disponible";
}

export function filterInventarioFacil(items: InventarioItem[], filter: InventarioFacilFilter, searchTerm: string) {
  const normalizedSearch = normalizeSearchText(searchTerm);

  return items.filter(
    (item) =>
      (filter === "todos" || item.estado === filter) &&
      (!normalizedSearch || normalizeSearchText(item.productoNombre).includes(normalizedSearch))
  );
}

export function getInventarioFacilEmptyMessage(filter: InventarioFacilFilter, searchTerm: string) {
  if (searchTerm.trim()) return "No encontramos productos con ese nombre.";
  if (filter === "bajo_stock") return "No hay productos con poco stock.";
  if (filter === "sin_stock") return "No hay productos agotados.";
  return "No hay productos para mostrar.";
}
