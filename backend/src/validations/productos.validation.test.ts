import { describe, expect, it } from "vitest";
import { validateProductoCreate, validateProductoUpdate } from "./productos.validation";

describe("validaciones de productos", () => {
  it("exige el nombre al crear un producto", () => {
    expect(validateProductoCreate({ precio: 2500 })).toEqual({
      error: "El nombre del producto es obligatorio"
    });
    expect(validateProductoCreate({ nombre: "   ", precio: 2500 })).toEqual({
      error: "El nombre del producto es obligatorio"
    });
  });

  it("rechaza un nombre que no sea texto", () => {
    expect(validateProductoCreate({ nombre: 123, precio: 2500 })).toEqual({
      error: "El nombre del producto debe ser texto"
    });
  });

  it("normaliza un producto nuevo y aplica valores predeterminados", () => {
    expect(validateProductoCreate({ nombre: "  Completo italiano  ", precio: "2500" })).toEqual({
      data: {
        categoria: "Otros",
        descripcion: null,
        destacado: false,
        disponible: true,
        nombre: "Completo italiano",
        precio: 2500,
        tipo: "producto",
        controlaStock: true,
        componentes: []
      }
    });
  });

  it("rechaza categorías con caracteres no permitidos", () => {
    expect(validateProductoCreate({ categoria: "Completos!", nombre: "Completo", precio: 2500 })).toEqual({
      error: "La categoría solo puede incluir letras, números, espacios, guiones y guiones bajos"
    });
  });

  it("rechaza precios menores al mínimo permitido", () => {
    expect(validateProductoCreate({ nombre: "Completo", precio: -1 }).error).toContain("entre 0 y");
  });

  it("exige al menos un campo al actualizar", () => {
    expect(validateProductoUpdate({})).toEqual({ error: "Debe enviar al menos un campo para actualizar" });
  });

  it("no permite borrar el nombre al actualizar", () => {
    expect(validateProductoUpdate({ nombre: "   " })).toEqual({
      error: "El nombre del producto es obligatorio"
    });
  });

  it("normaliza una promoción con componentes", () => {
    expect(
      validateProductoCreate({
        nombre: "2x1 Completo italiano",
        precio: 3900,
        tipo: "promo",
        controlaStock: false,
        componentes: [{ componenteId: "7", cantidad: "2" }]
      })
    ).toMatchObject({
      data: { tipo: "promo", controlaStock: false, componentes: [{ componenteId: 7, cantidad: 2 }] }
    });
  });

  it("rechaza cantidades inválidas y stock propio en promos", () => {
    expect(validateProductoUpdate({ componentes: [{ componenteId: 7, cantidad: 0 }] }).error).toContain(
      "entero positivo"
    );
    expect(validateProductoUpdate({ tipo: "combo", controlaStock: true })).toEqual({
      error: "Las promociones y combos no pueden controlar stock propio"
    });
  });

  it("mantiene los límites de producto centralizados", () => {
    expect(validateProductoCreate({ nombre: "A".repeat(81), precio: 2500 }).error).toContain("80 caracteres");
    expect(validateProductoCreate({ descripcion: "A".repeat(301), nombre: "Completo", precio: 2500 }).error).toContain(
      "300 caracteres"
    );
  });
});
