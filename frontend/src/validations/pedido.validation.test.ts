import { describe, expect, it } from "vitest";
import { sanitizeClienteNombreInput, validatePedidoSubmit } from "./pedido.validation";

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

  it("permite letras, tildes y separadores habituales en el nombre", () => {
    expect(
      validatePedidoSubmit({
        clienteNombre: "María José O'Connor",
        isTurnoOpen: true,
        metodoPago: "efectivo",
        totalProductos: 1
      })
    ).toBeNull();
  });

  it("rechaza números y símbolos en el nombre del cliente", () => {
    expect(
      validatePedidoSubmit({
        clienteNombre: "Juan 4!",
        isTurnoOpen: true,
        metodoPago: "efectivo",
        totalProductos: 1
      })
    ).toBe("El nombre del cliente solo puede contener letras");
    expect(sanitizeClienteNombreInput("Juan 4! Pérez")).toBe("Juan Pérez");
  });

  it("aplica los límites de texto como validación de UX", () => {
    expect(
      validatePedidoSubmit({
        clienteNombre: "A".repeat(81),
        isTurnoOpen: true,
        metodoPago: "efectivo",
        totalProductos: 1
      })
    ).toContain("80 caracteres");
    expect(
      validatePedidoSubmit({
        isTurnoOpen: true,
        metodoPago: "efectivo",
        observacion: "A".repeat(301),
        totalProductos: 1
      })
    ).toContain("300 caracteres");
  });
});
