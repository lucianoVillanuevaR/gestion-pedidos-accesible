import { describe, expect, it } from "vitest";
import type { InventarioItem } from "../../types";
import { filterInventarioNormal, hasInventarioDraftChanges } from "./inventarioNormalUtils";

const items: InventarioItem[] = [
  {
    estado: "disponible",
    productoDisponible: true,
    productoId: 1,
    productoNombre: "Completo Alemán",
    stockActual: 30,
    stockMinimo: 10
  },
  {
    estado: "bajo_stock",
    productoDisponible: true,
    productoId: 2,
    productoNombre: "Barros Luco",
    stockActual: 2,
    stockMinimo: 5
  },
  {
    estado: "sin_stock",
    productoDisponible: false,
    productoId: 3,
    productoNombre: "Chacarero",
    stockActual: 0,
    stockMinimo: 4
  }
];

const estadoLabel = (estado: InventarioItem["estado"]) =>
  ({ bajo_stock: "Bajo stock", disponible: "Disponible", sin_stock: "Sin stock" })[estado];

describe("utilidades del inventario normal", () => {
  it("detecta cambios reales en stock y stock mínimo", () => {
    const item = items[0];

    expect(hasInventarioDraftChanges(item, { stockActual: "30", stockMinimo: "10" })).toBe(false);
    expect(hasInventarioDraftChanges(item, { stockActual: "030", stockMinimo: "10" })).toBe(false);
    expect(hasInventarioDraftChanges(item, { stockActual: "31", stockMinimo: "10" })).toBe(true);
    expect(hasInventarioDraftChanges(item, { stockActual: "30", stockMinimo: "11" })).toBe(true);
    expect(hasInventarioDraftChanges(item, { stockActual: "", stockMinimo: "10" })).toBe(true);
  });

  it("mantiene Todos y los filtros de estado reales", () => {
    expect(filterInventarioNormal(items, "todos", "", estadoLabel)).toHaveLength(3);
    expect(filterInventarioNormal(items, "sin_stock", "", estadoLabel).map((item) => item.productoId)).toEqual([3]);
    expect(filterInventarioNormal(items, "bajo_stock", "", estadoLabel).map((item) => item.productoId)).toEqual([2]);
    expect(filterInventarioNormal(items, "disponible", "", estadoLabel).map((item) => item.productoId)).toEqual([1]);
  });

  it("busca por producto, estado y valores de stock", () => {
    expect(filterInventarioNormal(items, "todos", "aleman", estadoLabel).map((item) => item.productoId)).toEqual([1]);
    expect(filterInventarioNormal(items, "todos", "bajo stock", estadoLabel).map((item) => item.productoId)).toEqual([
      2
    ]);
    expect(filterInventarioNormal(items, "todos", "30", estadoLabel).map((item) => item.productoId)).toEqual([1]);
  });
});
