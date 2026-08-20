import { describe, expect, it } from "vitest";
import { normalizeProducto } from "./productos";

describe("normalización de productos", () => {
  it("conserva la categoría principal explícita aunque el nombre sugiera otra", () => {
    const producto = normalizeProducto({
      categoria: "Bebidas",
      categorias: [{ id: 2, nombre: "Sandwich" }],
      id: 1,
      nombre: "Completo líquido",
      precio: "2500"
    });

    expect(producto.categoria).toBe("Bebidas");
  });

  it("normaliza categorias[] solo como compatibilidad cuando falta categoria", () => {
    const producto = normalizeProducto({
      categorias: [{ id: 2, nombre: "Sandwich" }],
      id: 1,
      nombre: "Producto sin pista en el nombre",
      precio: 2500
    });

    expect(producto.categoria).toBe("Sandwich");
  });
});
