import { describe, expect, it } from "vitest";
import type { Producto } from "../../types";
import { buildCategoriasCatalogo, withProductoCategoria } from "./ProductosShared";

describe("categorías del catálogo", () => {
  it("unifica la categoría antigua de hot dogs bajo Completos", () => {
    const productos: Producto[] = [
      { id: 1, nombre: "Completo Italiano", precio: 3900, categoria: "Completos / Hot Dogs" },
      { id: 2, nombre: "Completo Alemán", precio: 2900, categoria: "Completos" }
    ];

    const categorias = buildCategoriasCatalogo(productos);
    const productosNormalizados = withProductoCategoria(productos, categorias);

    expect(categorias.filter((categoria) => categoria.value === "Completos")).toHaveLength(1);
    expect(categorias.some((categoria) => categoria.label.includes("Hot Dog"))).toBe(false);
    expect(productosNormalizados.map((producto) => producto.categoria)).toEqual(["Completos", "Completos"]);
  });
});
