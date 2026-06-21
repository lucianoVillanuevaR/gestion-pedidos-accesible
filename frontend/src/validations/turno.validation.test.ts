import { describe, expect, it } from "vitest";
import { validateTurnoClose } from "./turno.validation";

describe("validateTurnoClose", () => {
  it("permite cerrar un turno abierto", () => {
    expect(validateTurnoClose(true)).toBeNull();
  });

  it("impide cerrar nuevamente un turno cerrado", () => {
    expect(validateTurnoClose(false)).toBe("El turno ya está cerrado.");
  });
});
