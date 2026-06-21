import { describe, expect, it } from "vitest";
import { buildProductoPayload, validateProductoForm } from "./producto.validation";

describe("validateProductoForm", () => {
  it("rechaza un nombre vacío", () => {
    expect(validateProductoForm({ descripcion: "", nombre: "   ", precio: "1000" })).toBe(
      "Ingresa el nombre del producto"
    );
  });

  it("rechaza precios con más de dos decimales", () => {
    expect(validateProductoForm({ descripcion: "", nombre: "Completo", precio: "1000.123" })).toBe(
      "El precio debe tener como máximo 2 decimales"
    );
  });

  it("rechaza precios menores al mínimo permitido", () => {
    expect(validateProductoForm({ descripcion: "", nombre: "Completo", precio: "-1" })).toContain("entre 0 y");
  });

  it("acepta un producto válido", () => {
    expect(validateProductoForm({ descripcion: "Con tomate", nombre: "Completo", precio: "2500" })).toBeNull();
  });

  it("mantiene los límites de producto centralizados", () => {
    expect(validateProductoForm({ descripcion: "", nombre: "A".repeat(81), precio: "2500" })).toContain(
      "80 caracteres"
    );
    expect(validateProductoForm({ descripcion: "A".repeat(301), nombre: "Completo", precio: "2500" })).toContain(
      "300 caracteres"
    );
  });
});

describe("buildProductoPayload", () => {
  it("limpia textos y redondea el precio", () => {
    expect(
      buildProductoPayload({
        categoria: "Completos",
        descripcion: "  Con tomate  ",
        nombre: "  Completo italiano  ",
        precio: 2499.999
      })
    ).toEqual({
      categoria: "Completos",
      descripcion: "Con tomate",
      destacado: undefined,
      disponible: undefined,
      nombre: "Completo italiano",
      precio: 2500
    });
  });
});
