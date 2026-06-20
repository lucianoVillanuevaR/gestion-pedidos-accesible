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
    expect(
      validatePedidoDetalles([
        { cantidad: 1, productoId: 4 },
        { cantidad: 2, productoId: 4 }
      ])
    ).toBe("No se puede repetir el mismo producto en el pedido");
    expect(validatePedidoDetalles([{ cantidad: 0, productoId: 4 }])).toContain("Detalle inválido");
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
});
