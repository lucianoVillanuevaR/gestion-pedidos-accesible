import { describe, expect, it } from "vitest";
import { buildPedidoPrintSnapshot } from "./pedidoPrintSnapshot";

describe("buildPedidoPrintSnapshot", () => {
  it("usa exclusivamente el número, fecha y detalles confirmados por el backend", () => {
    const snapshot = buildPedidoPrintSnapshot({
      id: 42,
      numeroTurno: 7,
      createdAt: "2026-08-18T18:25:00.000Z",
      estado: "pendiente",
      metodoPago: "tarjeta",
      clienteNombre: "Ana",
      observacion: "Sin cebolla",
      total: "3500",
      detalles: [
        {
          id: 91,
          pedidoId: 42,
          productoId: 3,
          cantidad: 1,
          precioUnitario: "3500",
          subtotal: "3500",
          producto: { id: 3, nombre: "Completo", precio: 0 }
        }
      ]
    });

    expect(snapshot.numeroPedido).toBe(7);
    expect(snapshot.createdAt).toBe("2026-08-18T18:25:00.000Z");
    expect(snapshot.pedidoDetalles).toEqual([
      expect.objectContaining({
        itemKey: "pedido-42-detalle-91",
        subtotal: 3500
      })
    ]);
    expect(snapshot.pedidoDetalles[0].producto.precio).toBe(3500);
  });

  it("rechaza respuestas sin identificador definitivo", () => {
    expect(() =>
      buildPedidoPrintSnapshot({
        id: 1,
        estado: "pendiente",
        metodoPago: "efectivo",
        total: "1000"
      })
    ).toThrow(/número de turno o fecha/);
  });
});
