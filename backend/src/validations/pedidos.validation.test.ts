import { describe, expect, it } from "vitest";
import {
  validateMetodoPago,
  validatePedidoDetalles,
  validatePedidoTextFields,
  validateTransicionEstadoPedido
} from "./pedidos.validation";

describe("validaciones de pedidos", () => {
  it("valida métodos de pago", () => {
    expect(validateMetodoPago("efectivo")).toBeNull();
    expect(validateMetodoPago("cheque")).toContain("Método de pago inválido");
  });

  it("rechaza productos repetidos y cantidades inválidas", () => {
    expect(validatePedidoDetalles([])).toBe("El pedido debe tener al menos un detalle");
    expect(
      validatePedidoDetalles([
        { cantidad: 1, productoId: 4 },
        { cantidad: 2, productoId: 4 }
      ])
    ).toBe("No se puede repetir el mismo producto con la misma opción y personalización en el pedido");
    expect(validatePedidoDetalles([{ cantidad: 0, productoId: 4 }])).toContain("Detalle inválido");
    expect(validatePedidoDetalles([{ cantidad: 100, productoId: 4 }])).toContain("entre 1 y 99");
  });

  it("permite el mismo producto con opciones diferentes", () => {
    expect(
      validatePedidoDetalles([
        { cantidad: 1, productoId: 4, varianteId: 10 },
        { cantidad: 1, productoId: 4, varianteId: 11 }
      ])
    ).toBeNull();
  });

  it("valida aderezos y comentarios por detalle", () => {
    expect(
      validatePedidoDetalles([
        { cantidad: 1, productoId: 4, personalizacion: { aderezos: ["Mostaza", "Mayonesa"], comentario: "Sin sal" } }
      ])
    ).toBeNull();
    expect(
      validatePedidoDetalles([{ cantidad: 1, productoId: 4, personalizacion: { aderezos: ["A", "B", "C", "D"] } }])
    ).toContain("hasta 3 aderezos");
  });

  it("permite el mismo producto con personalizaciones diferentes", () => {
    expect(
      validatePedidoDetalles([
        { cantidad: 1, productoId: 4, personalizacion: { aderezos: ["Mostaza"] } },
        { cantidad: 1, productoId: 4, personalizacion: { aderezos: ["Ketchup"] } }
      ])
    ).toBeNull();
  });

  it("permite solamente transiciones de estado válidas", () => {
    expect(validateTransicionEstadoPedido("pendiente", "en_preparacion")).toBeNull();
    expect(validateTransicionEstadoPedido("pendiente", "entregado")).toBe(
      "Cambio de estado no permitido: pendiente → entregado"
    );
  });

  it("valida los tipos de los campos de texto", () => {
    expect(validatePedidoTextFields(123, "Observación")).toBe("El nombre del cliente debe ser texto");
    expect(validatePedidoTextFields("Ana", "Sin cebolla")).toBeNull();
  });

  it("acepta nombres con tildes y rechaza números en el nombre del cliente", () => {
    expect(validatePedidoTextFields("María José O'Connor", "Sin cebolla")).toBeNull();
    expect(validatePedidoTextFields("Cliente 4", "Sin cebolla")).toBe(
      "El nombre del cliente solo puede contener letras"
    );
  });

  it("limita el nombre y la observación", () => {
    expect(validatePedidoTextFields("A".repeat(81), "")).toContain("80 caracteres");
    expect(validatePedidoTextFields("Ana", "A".repeat(301))).toContain("300 caracteres");
  });
});
