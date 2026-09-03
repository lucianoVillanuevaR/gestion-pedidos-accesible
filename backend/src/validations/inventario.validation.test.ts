import { describe, expect, it } from "vitest";
import { validateInventarioUpdate } from "./inventario.validation";

describe("validateInventarioUpdate", () => {
  it.each([0, 1, 12, 2_147_483_647])("acepta el entero %s", (stockActual) => {
    expect(validateInventarioUpdate({ stockActual })).toEqual({
      data: { stockActual },
    });
  });

  it.each([
    "",
    "12",
    null,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -1,
    1.5,
    {},
    [],
  ])("rechaza el valor inválido %s", (stockActual) => {
    expect(validateInventarioUpdate({ stockActual })).toHaveProperty("error");
  });

  it("rechaza enteros fuera del rango de PostgreSQL", () => {
    expect(validateInventarioUpdate({ stockActual: 2_147_483_648 })).toEqual({
      error: "stockActual no puede superar 2147483647",
    });
  });

  it("valida stockMinimo con las mismas reglas estrictas", () => {
    expect(validateInventarioUpdate({ stockMinimo: 12 })).toEqual({
      data: { stockMinimo: 12 },
    });
    expect(validateInventarioUpdate({ stockMinimo: null })).toHaveProperty(
      "error",
    );
  });

  it("mantiene el error de actualización vacía", () => {
    expect(validateInventarioUpdate({})).toEqual({
      error: "Debe enviar stockActual o stockMinimo",
    });
  });
});
