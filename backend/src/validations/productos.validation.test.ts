import { describe, expect, it } from "vitest";
import { validateProductoCreate, validateProductoUpdate } from "./productos.validation";

describe("validaciones de productos", () => {
  it("normaliza un producto nuevo y aplica valores predeterminados", () => {
    expect(validateProductoCreate({ nombre: "  Completo italiano  ", precio: "2500" })).toEqual({
      data: {
        categoria: "Otros",
        descripcion: null,
        destacado: false,
        disponible: true,
        nombre: "Completo italiano",
        precio: 2500
      }
    });
  });

  it("rechaza categorías con caracteres no permitidos", () => {
    expect(validateProductoCreate({ categoria: "Completos!", nombre: "Completo", precio: 2500 })).toEqual({
      error: "La categoría solo puede incluir letras, números, espacios, guiones y guiones bajos"
    });
  });

  it("exige al menos un campo al actualizar", () => {
    expect(validateProductoUpdate({})).toEqual({ error: "Debe enviar al menos un campo para actualizar" });
  });
});
