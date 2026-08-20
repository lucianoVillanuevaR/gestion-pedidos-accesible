import { describe, expect, it } from "vitest";
import type { MetodoPago } from "../../types";
import { validatePedidoSubmit } from "../../validations/pedido.validation";
import { getAcceptHelpMessage } from "./pdvAcceptHelp";

function getHelp({
  clienteNombre = "",
  isTurnoOpen = true,
  metodoPago = "" as MetodoPago | "",
  sending = false,
  totalProductos = 1
} = {}) {
  const validationError = validatePedidoSubmit({
    clienteNombre,
    isTurnoOpen,
    metodoPago,
    totalProductos
  });

  return getAcceptHelpMessage({ clienteNombre, metodoPago, sending, validationError });
}

describe("ayuda contextual de Aceptar", () => {
  it("prioriza agregar un producto cuando el pedido está vacío", () => {
    expect(getHelp({ totalProductos: 0 })).toBe("Agrega al menos un producto para continuar.");
  });

  it("indica cuando solo falta el cliente", () => {
    expect(getHelp({ metodoPago: "efectivo" })).toBe("Ingresa el nombre del cliente para continuar.");
  });

  it("indica cuando solo falta el método de pago", () => {
    expect(getHelp({ clienteNombre: "Ana" })).toBe("Selecciona un método de pago para continuar.");
  });

  it("combina cliente y pago cuando ambos faltan", () => {
    expect(getHelp()).toBe("Ingresa el nombre del cliente y selecciona un método de pago.");
  });

  it("desaparece cuando la validación permite aceptar", () => {
    expect(getHelp({ clienteNombre: "Ana", metodoPago: "tarjeta" })).toBeNull();
  });

  it("no muestra una indicación anterior durante el registro", () => {
    expect(getHelp({ sending: true, totalProductos: 0 })).toBeNull();
    expect(getHelp({ totalProductos: 0 })).toBe("Agrega al menos un producto para continuar.");
  });

  it("refleja que un turno cerrado también bloquea la acción", () => {
    expect(getHelp({ isTurnoOpen: false })).toBe("Abre el turno para continuar.");
  });
});
