import { describe, expect, it } from "vitest";
import type { InventarioItem } from "../../types";
import {
  countInventarioFacil,
  filterInventarioFacil,
  getInventarioFacilEmptyMessage,
  getInventarioFacilEstadoLabel
} from "./inventarioFacilUtils";

const items: InventarioItem[] = [
  {
    estado: "disponible",
    productoDisponible: true,
    productoId: 1,
    productoNombre: "Completo Alemán",
    stockActual: 12,
    stockMinimo: 3
  },
  {
    estado: "bajo_stock",
    productoDisponible: true,
    productoId: 2,
    productoNombre: "Completo italiano",
    stockActual: 2,
    stockMinimo: 3
  },
  {
    estado: "sin_stock",
    productoDisponible: false,
    productoId: 3,
    productoNombre: "Barros Luco",
    stockActual: 0,
    stockMinimo: 2
  }
];

describe("inventarioFacilUtils", () => {
  it("busca por nombre ignorando mayúsculas y acentos", () => {
    expect(filterInventarioFacil(items, "todos", "aleman").map((item) => item.productoId)).toEqual([1]);
  });

  it("mantiene todos los productos con el filtro Todos", () => {
    expect(filterInventarioFacil(items, "todos", "")).toHaveLength(3);
  });

  it("filtra usando los estados reales de poco stock y agotado", () => {
    expect(filterInventarioFacil(items, "bajo_stock", "").map((item) => item.productoId)).toEqual([2]);
    expect(filterInventarioFacil(items, "sin_stock", "").map((item) => item.productoId)).toEqual([3]);
  });

  it("cuenta y representa los estados reales recibidos del inventario", () => {
    expect(countInventarioFacil(items)).toEqual({ disponible: 1, bajo_stock: 1, sin_stock: 1 });
    expect(getInventarioFacilEstadoLabel("disponible")).toBe("Disponible");
    expect(getInventarioFacilEstadoLabel("bajo_stock")).toBe("Poco stock");
    expect(getInventarioFacilEstadoLabel("sin_stock")).toBe("Agotado");
  });

  it("genera mensajes vacíos claros según búsqueda y filtro", () => {
    expect(getInventarioFacilEmptyMessage("todos", "pizza")).toBe("No encontramos productos con ese nombre.");
    expect(getInventarioFacilEmptyMessage("bajo_stock", "")).toBe("No hay productos con poco stock.");
    expect(getInventarioFacilEmptyMessage("sin_stock", "")).toBe("No hay productos agotados.");
  });
});
