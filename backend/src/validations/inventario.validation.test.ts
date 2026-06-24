import { describe, expect, it } from "vitest";
import { validateInventarioUpdate } from "./inventario.validation";

describe("validateInventarioUpdate", () => {
  it("convierte valores numéricos válidos", () => {
    expect(validateInventarioUpdate({ stockActual: "12", stockMinimo: 3 })).toEqual({
      data: { stockActual: 12, stockMinimo: 3 }
    });
  });

  it("rechaza valores negativos y actualizaciones vacías", () => {
    expect(validateInventarioUpdate({ stockActual: -1 })).toEqual({
      error: "stockActual debe ser un número entero mayor o igual a 0"
    });
    expect(validateInventarioUpdate({})).toEqual({ error: "Debe enviar stockActual o stockMinimo" });
  });
});
