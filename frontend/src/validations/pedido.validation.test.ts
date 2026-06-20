import { describe, expect, it } from "vitest";
import { validatePedidoSubmit } from "./pedido.validation";

describe("validatePedidoSubmit", () => {
  it("exige abrir el turno antes de crear pedidos", () => {
    expect(validatePedidoSubmit({ isTurnoOpen: false, metodoPago: "efectivo", totalProductos: 1 })).toBe(
      "Debes abrir turno antes de registrar un pedido."
    );
  });

  it("exige productos y método de pago", () => {
    expect(validatePedidoSubmit({ isTurnoOpen: true, metodoPago: "", totalProductos: 0 })).toBe(
      "No hay productos seleccionados"
    );
    expect(validatePedidoSubmit({ isTurnoOpen: true, metodoPago: "", totalProductos: 1 })).toBe(
      "Selecciona método de pago"
    );
  });

  it("acepta un pedido válido", () => {
    expect(
      validatePedidoSubmit({
        clienteNombre: "Ana",
        isTurnoOpen: true,
        metodoPago: "tarjeta",
        observacion: "Sin cebolla",
        totalProductos: 2
      })
    ).toBeNull();
  });
});
