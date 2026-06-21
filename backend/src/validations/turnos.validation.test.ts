import { describe, expect, it } from "vitest";
import { validateTurnoCanClose } from "./turnos.validation";

describe("validaciones de turnos", () => {
  it("impide cerrar un turno que ya está cerrado", () => {
    expect(validateTurnoCanClose("cerrado", [])).toBe("El turno ya está cerrado");
  });

  it.each(["pendiente", "en_preparacion", "listo"])("impide cerrar con un pedido %s", (estado) => {
    expect(validateTurnoCanClose("abierto", ["entregado", estado])).toBe(
      "No puedes cerrar el turno mientras existan pedidos activos"
    );
  });

  it("permite cerrar cuando todos los pedidos terminaron", () => {
    expect(validateTurnoCanClose("abierto", ["entregado", "cancelado"])).toBeNull();
  });
});
