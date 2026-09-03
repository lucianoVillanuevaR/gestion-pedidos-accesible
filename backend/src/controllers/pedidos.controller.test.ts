import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lockTurnOperations: vi.fn(),
  pedidoCount: vi.fn(),
  pedidoFindUnique: vi.fn(),
  preparePedidoWrite: vi.fn(),
  transaction: vi.fn()
}));

vi.mock("../config/prisma", () => ({
  default: {
    $transaction: mocks.transaction,
    pedido: { count: mocks.pedidoCount, findUnique: mocks.pedidoFindUnique }
  }
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

  const idempotencyKey = "550e8400-e29b-41d4-a716-446655440000";

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
        findUnique: vi.fn().mockResolvedValue(null),
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
        idempotencyKey,
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
    expect(tx.pedido.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ idempotencyKey })
      })
    );
  });

  it("devuelve el mismo pedido sin volver a prepararlo ni crearlo cuando la clave ya existe", async () => {
    const pedidoExistente = {
      id: 42,
      createdAt: new Date("2026-08-18T18:25:00.000Z"),
      turnoId: 8,
      detalles: []
    };
    const tx = {
      turno: { findFirst: vi.fn() },
      pedido: {
        findUnique: vi.fn().mockResolvedValue(pedidoExistente),
        create: vi.fn(),
        count: vi.fn().mockResolvedValue(7)
      }
    };
    mocks.transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    const req = {
      body: {
        clienteNombre: "Ana",
        detalles: [{ productoId: 3, cantidad: 1 }],
        idempotencyKey,
        metodoPago: "tarjeta"
      }
    };
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    await crearPedido(req as never, { status } as never);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ id: 42, numeroTurno: 7 }));
    expect(mocks.preparePedidoWrite).not.toHaveBeenCalled();
    expect(tx.pedido.create).not.toHaveBeenCalled();
  });

  it("serializa dos peticiones simultáneas con la misma clave y descuenta stock una sola vez", async () => {
    const createdAt = new Date("2026-08-18T18:25:00.000Z");
    let pedidoGuardado: {
      id: number;
      createdAt: Date;
      turnoId: number;
      detalles: never[];
    } | null = null;
    const tx = {
      turno: { findFirst: vi.fn().mockResolvedValue({ id: 8 }) },
      pedido: {
        findUnique: vi.fn().mockImplementation(() => Promise.resolve(pedidoGuardado)),
        create: vi.fn().mockImplementation(() => {
          pedidoGuardado = { id: 42, createdAt, turnoId: 8, detalles: [] };
          return Promise.resolve(pedidoGuardado);
        }),
        count: vi.fn().mockResolvedValue(1)
      }
    };
    let queue = Promise.resolve();
    mocks.transaction.mockImplementation((callback: (client: typeof tx) => unknown) => {
      const result = queue.then(() => callback(tx));
      queue = result.then(() => undefined);
      return result;
    });
    mocks.preparePedidoWrite.mockResolvedValue({
      detallesData: [{}],
      total: "3500"
    });
    const request = {
      body: {
        clienteNombre: "Ana",
        detalles: [{ productoId: 3, cantidad: 1 }],
        idempotencyKey,
        metodoPago: "tarjeta"
      }
    };
    const firstJson = vi.fn();
    const secondJson = vi.fn();
    const firstStatus = vi.fn().mockReturnValue({ json: firstJson });
    const secondStatus = vi.fn().mockReturnValue({ json: secondJson });

    await Promise.all([
      crearPedido(request as never, { status: firstStatus } as never),
      crearPedido(request as never, { status: secondStatus } as never)
    ]);

    expect(firstStatus).toHaveBeenCalledWith(201);
    expect(secondStatus).toHaveBeenCalledWith(200);
    expect(firstJson).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }));
    expect(secondJson).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }));
    expect(mocks.preparePedidoWrite).toHaveBeenCalledTimes(1);
    expect(tx.pedido.create).toHaveBeenCalledTimes(1);
  });

  it("permite que claves diferentes creen pedidos diferentes", async () => {
    let nextId = 40;
    const tx = {
      turno: { findFirst: vi.fn().mockResolvedValue({ id: 8 }) },
      pedido: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(() =>
          Promise.resolve({
            id: ++nextId,
            createdAt: new Date(),
            turnoId: 8,
            detalles: []
          })
        ),
        count: vi.fn().mockImplementation(() => Promise.resolve(nextId - 40))
      }
    };
    mocks.transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    mocks.preparePedidoWrite.mockResolvedValue({
      detallesData: [{}],
      total: "3500"
    });
    const createRequest = (key: string) => ({
      body: {
        clienteNombre: "Ana",
        detalles: [{ productoId: 3, cantidad: 1 }],
        idempotencyKey: key,
        metodoPago: "tarjeta"
      }
    });
    const firstJson = vi.fn();
    const secondJson = vi.fn();

    await crearPedido(
      createRequest(idempotencyKey) as never,
      {
        status: vi.fn().mockReturnValue({ json: firstJson })
      } as never
    );
    await crearPedido(
      createRequest("6ba7b810-9dad-41d1-80b4-00c04fd430c8") as never,
      {
        status: vi.fn().mockReturnValue({ json: secondJson })
      } as never
    );

    expect(firstJson).toHaveBeenCalledWith(expect.objectContaining({ id: 41 }));
    expect(secondJson).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }));
    expect(tx.pedido.create).toHaveBeenCalledTimes(2);
  });

  it("no consume la clave si falla la transacción y permite reintentar", async () => {
    const tx = {
      turno: { findFirst: vi.fn().mockResolvedValue({ id: 8 }) },
      pedido: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 42,
          createdAt: new Date(),
          turnoId: 8,
          detalles: []
        }),
        count: vi.fn().mockResolvedValue(1)
      }
    };
    mocks.transaction
      .mockRejectedValueOnce(new Error("fallo transaccional"))
      .mockImplementationOnce((callback: (client: typeof tx) => unknown) => callback(tx));
    mocks.preparePedidoWrite.mockResolvedValue({
      detallesData: [{}],
      total: "3500"
    });
    const req = {
      body: {
        clienteNombre: "Ana",
        detalles: [{ productoId: 3, cantidad: 1 }],
        idempotencyKey,
        metodoPago: "tarjeta"
      }
    };
    const firstStatus = vi.fn().mockReturnValue({ json: vi.fn() });
    const secondStatus = vi.fn().mockReturnValue({ json: vi.fn() });

    await crearPedido(req as never, { status: firstStatus } as never);
    await crearPedido(req as never, { status: secondStatus } as never);

    expect(firstStatus).toHaveBeenCalledWith(500);
    expect(secondStatus).toHaveBeenCalledWith(201);
    expect(tx.pedido.create).toHaveBeenCalledTimes(1);
  });

  it("recupera el pedido existente cuando el índice UNIQUE produce P2002", async () => {
    const pedidoExistente = {
      id: 42,
      createdAt: new Date("2026-08-18T18:25:00.000Z"),
      turnoId: 8,
      detalles: []
    };
    mocks.transaction.mockRejectedValue({ code: "P2002" });
    mocks.pedidoFindUnique.mockResolvedValue(pedidoExistente);
    mocks.pedidoCount.mockResolvedValue(7);
    const req = {
      body: {
        clienteNombre: "Ana",
        detalles: [{ productoId: 3, cantidad: 1 }],
        idempotencyKey,
        metodoPago: "tarjeta"
      }
    };
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    await crearPedido(req as never, { status } as never);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ id: 42, numeroTurno: 7 }));
  });
});
