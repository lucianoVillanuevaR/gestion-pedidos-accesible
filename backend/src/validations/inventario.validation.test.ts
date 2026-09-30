import { describe, expect, it } from "vitest";
import { validateInventarioUpdate } from "./inventario.validation";

describe("validateInventarioUpdate", () => {
  const expectedUpdatedAt = "2026-09-23T18:00:00.000Z";

  it.each([0, 1, 12, 2_147_483_647])("acepta el entero %s", (stockActual) => {
    expect(validateInventarioUpdate({ expectedUpdatedAt, stockActual })).toEqual({
      data: { expectedUpdatedAt: new Date(expectedUpdatedAt), stockActual }
    });
  });

  it.each(["", "12", null, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1, 1.5, {}, []])(
    "rechaza el valor inválido %s",
    (stockActual) => {
      expect(validateInventarioUpdate({ expectedUpdatedAt, stockActual })).toHaveProperty("error");
    }
  );

  it("rechaza enteros fuera del rango de PostgreSQL", () => {
    expect(validateInventarioUpdate({ expectedUpdatedAt, stockActual: 2_147_483_648 })).toEqual({
      error: "stockActual no puede superar 2147483647"
    });
  });

  it("valida stockMinimo con las mismas reglas estrictas", () => {
    expect(validateInventarioUpdate({ expectedUpdatedAt, stockMinimo: 12 })).toEqual({
      data: { expectedUpdatedAt: new Date(expectedUpdatedAt), stockMinimo: 12 }
    });
    expect(validateInventarioUpdate({ expectedUpdatedAt, stockMinimo: null })).toHaveProperty("error");
  });

  it("mantiene el error de actualización vacía", () => {
    expect(validateInventarioUpdate({ expectedUpdatedAt })).toEqual({
      error: "Debe enviar stockActual o stockMinimo"
    });
  });

  it.each([undefined, "", "fecha inválida", 123])("rechaza una versión inválida %s", (value) => {
    expect(validateInventarioUpdate({ expectedUpdatedAt: value, stockActual: 1 })).toHaveProperty("error");
  });
});
