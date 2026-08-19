import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lockTurnOperations: vi.fn(),
  preparePedidoWrite: vi.fn(),
  transaction: vi.fn()
}));

vi.mock("../config/prisma", () => ({
  default: { $transaction: mocks.transaction }
}));
vi.mock("../services/databaseLocks", () => ({
  lockTurnOperations: mocks.lockTurnOperations
}));
vi.mock("../services/productImageService", () => ({
  withProductImageUrl: (producto: unknown) => producto
}));
vi.mock("../services/pedidoWriteService", () => ({
  assertPedidoCanBeUpdated: vi.fn(),
  normalizePedidoDetalles: (detalles: unknown) => detalles,
  preparePedidoWrite: mocks.preparePedidoWrite,
  restorePedidoStock: vi.fn(),
  shouldRestoreStockOnStateChange: vi.fn()
}));

import { crearPedido } from "./pedidos.controller";

describe("crearPedido", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve el número definitivo, la fecha y el detalle creado en la misma transacción", async () => {
    const createdAt = new Date("2026-08-18T18:25:00.000Z");
    const detalle = {
      id: 91,
      pedidoId: 42,
      productoId: 3,
      cantidad: 1,
      precioUnitario: "3500",
      subtotal: "3500",
      producto: { id: 3, nombre: "Completo", imagenUrl: null },
      variante: null,
      personalizacion: null
    };
    const tx = {
      turno: { findFirst: vi.fn().mockResolvedValue({ id: 8 }) },
      pedido: {
        create: vi.fn().mockResolvedValue({
          id: 42,
          createdAt,
          estado: "pendiente",
          metodoPago: "tarjeta",
          clienteNombre: "Ana",
          observacion: null,
          total: "3500",
          detalles: [detalle]
        }),
        count: vi.fn().mockResolvedValue(7)
      }
    };
    mocks.preparePedidoWrite.mockResolvedValue({
      detallesData: [{}],
      total: "3500"
    });
    mocks.transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    const req = {
      body: {
        clienteNombre: "Ana",
        detalles: [{ productoId: 3, cantidad: 1 }],
        metodoPago: "tarjeta"
      }
    };
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    await crearPedido(req as never, { status } as never);

    expect(tx.pedido.count).toHaveBeenCalledWith({ where: { turnoId: 8 } });
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 42,
        numeroTurno: 7,
        createdAt,
        detalles: [detalle]
      })
    );
  });
});
