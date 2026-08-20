import type { InventarioEstado, InventarioItem } from "../../types";
import { normalizeSearchText } from "../../utils/formatters";

export type InventarioNormalFilter = InventarioEstado | "todos";
export type InventarioDraft = { stockActual: string; stockMinimo: string };

function parseDraftStock(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function hasInventarioDraftChanges(item: InventarioItem, draft?: InventarioDraft) {
  if (!draft) return false;

  const stockActual = parseDraftStock(draft.stockActual);
  const stockMinimo = parseDraftStock(draft.stockMinimo);

  if (stockActual === null || stockMinimo === null) return true;
  return stockActual !== item.stockActual || stockMinimo !== item.stockMinimo;
}

export function filterInventarioNormal(
  items: InventarioItem[],
  filter: InventarioNormalFilter,
  searchTerm: string,
  getEstadoLabel: (estado: InventarioEstado) => string
) {
  const normalizedSearch = normalizeSearchText(searchTerm);

  return items.filter((item) => {
    if (filter !== "todos" && item.estado !== filter) return false;
    if (!normalizedSearch) return true;

    return [item.productoNombre, getEstadoLabel(item.estado), String(item.stockActual), String(item.stockMinimo)].some(
      (value) => normalizeSearchText(value).includes(normalizedSearch)
    );
  });
}
