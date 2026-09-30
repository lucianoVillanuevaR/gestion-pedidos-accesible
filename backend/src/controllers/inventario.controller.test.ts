import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  inventarioFindUniqueOrThrow: vi.fn(),
  inventarioUpdateMany: vi.fn(),
  productoFindMany: vi.fn(),
  productoFindUnique: vi.fn(),
  withProductImageUrl: vi.fn((producto: { imagenUrl?: string | null }) => ({
    ...producto,
    imagenPublicUrl: producto.imagenUrl ? `/media/productos/${producto.imagenUrl}` : null
  }))
}));

vi.mock("../config/prisma", () => ({
  default: {
    inventario: {
      findUniqueOrThrow: mocks.inventarioFindUniqueOrThrow,
      updateMany: mocks.inventarioUpdateMany
    },
    producto: { findMany: mocks.productoFindMany, findUnique: mocks.productoFindUnique }
  }
}));

vi.mock("../services/productImageService", () => ({
  withProductImageUrl: mocks.withProductImageUrl
}));

import { getInventario, updateInventarioProducto } from "./inventario.controller";

describe("getInventario", () => {
  beforeEach(() => vi.clearAllMocks());

  it("incluye la URL pública de imagen en la misma consulta de inventario", async () => {
    mocks.productoFindMany.mockResolvedValue([
      {
        controlaStock: true,
        disponible: true,
        id: 1,
        imagenUrl: "completo-aleman.webp",
        inventario: { stockActual: 27, stockMinimo: 5, updatedAt: new Date("2026-09-23T18:00:00.000Z") },
        nombre: "Completo Alemán",
        tipo: "producto"
      },
      {
        controlaStock: true,
        disponible: true,
        id: 2,
        imagenUrl: null,
        inventario: { stockActual: 2, stockMinimo: 3, updatedAt: new Date("2026-09-23T18:01:00.000Z") },
        nombre: "Barros Luco",
        tipo: "producto"
      }
    ]);
    const json = vi.fn();

    await getInventario({} as never, { json } as never);

    expect(mocks.productoFindMany).toHaveBeenCalledOnce();
    expect(mocks.productoFindMany).toHaveBeenCalledWith({
      include: { inventario: true },
      orderBy: { nombre: "asc" },
      where: { controlaStock: true, tipo: "producto" }
    });
    expect(json).toHaveBeenCalledWith([
      {
        controlaStock: true,
        estado: "disponible",
        imagenUrl: "/media/productos/completo-aleman.webp",
        productoDisponible: true,
        productoId: 1,
        productoNombre: "Completo Alemán",
        stockActual: 27,
        stockMinimo: 5,
        tipo: "producto",
        updatedAt: "2026-09-23T18:00:00.000Z"
      },
      {
        controlaStock: true,
        estado: "bajo_stock",
        imagenUrl: null,
        productoDisponible: true,
        productoId: 2,
        productoNombre: "Barros Luco",
        stockActual: 2,
        stockMinimo: 3,
        tipo: "producto",
        updatedAt: "2026-09-23T18:01:00.000Z"
      }
    ]);
    expect(mocks.withProductImageUrl).toHaveBeenCalledTimes(2);
  });

  it("conserva la URL pública de imagen al actualizar stock", async () => {
    mocks.productoFindUnique.mockResolvedValue({
      controlaStock: true,
      disponible: true,
      id: 1,
      imagenUrl: "completo-aleman.webp",
      nombre: "Completo Alemán",
      tipo: "producto"
    });
    mocks.inventarioUpdateMany.mockResolvedValue({ count: 1 });
    mocks.inventarioFindUniqueOrThrow.mockResolvedValue({
      stockActual: 4,
      stockMinimo: 5,
      updatedAt: new Date("2026-09-23T18:05:00.000Z")
    });
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    await updateInventarioProducto(
      {
        body: {
          expectedUpdatedAt: "2026-09-23T18:00:00.000Z",
          stockActual: 4,
          stockMinimo: 5
        },
        params: { productoId: "1" }
      } as never,
      { json, status } as never
    );

    expect(mocks.productoFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mocks.inventarioUpdateMany).toHaveBeenCalledOnce();
    expect(mocks.inventarioUpdateMany.mock.calls[0][0]).toMatchObject({
      data: { stockActual: 4, stockMinimo: 5 },
      where: { productoId: 1, updatedAt: new Date("2026-09-23T18:00:00.000Z") }
    });
    expect(json).toHaveBeenCalledWith({
      controlaStock: true,
      estado: "bajo_stock",
      imagenUrl: "/media/productos/completo-aleman.webp",
      productoDisponible: true,
      productoId: 1,
      productoNombre: "Completo Alemán",
      stockActual: 4,
      stockMinimo: 5,
      tipo: "producto",
      updatedAt: "2026-09-23T18:05:00.000Z"
    });
    expect(status).not.toHaveBeenCalled();
  });

  it("rechaza con 409 una segunda edición basada en una versión obsoleta", async () => {
    mocks.productoFindUnique.mockResolvedValue({
      controlaStock: true,
      disponible: true,
      id: 1,
      imagenUrl: null,
      nombre: "Completo Alemán",
      tipo: "producto"
    });
    mocks.inventarioUpdateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    mocks.inventarioFindUniqueOrThrow.mockResolvedValueOnce({
      stockActual: 15,
      stockMinimo: 5,
      updatedAt: new Date("2026-09-23T18:05:00.000Z")
    });
    const firstJson = vi.fn();
    const firstStatus = vi.fn().mockReturnValue({ json: firstJson });
    const secondJson = vi.fn();
    const secondStatus = vi.fn().mockReturnValue({ json: secondJson });
    const staleBody = { expectedUpdatedAt: "2026-09-23T18:00:00.000Z", stockActual: 15 };

    await updateInventarioProducto(
      { body: staleBody, params: { productoId: "1" } } as never,
      { json: firstJson, status: firstStatus } as never
    );
    await updateInventarioProducto(
      { body: { ...staleBody, stockActual: 18 }, params: { productoId: "1" } } as never,
      { json: secondJson, status: secondStatus } as never
    );

    expect(firstStatus).not.toHaveBeenCalled();
    expect(firstJson).toHaveBeenCalledWith(expect.objectContaining({ stockActual: 15 }));
    expect(secondStatus).toHaveBeenCalledWith(409);
    expect(secondJson).toHaveBeenCalledWith({
      error: "El inventario cambió mientras lo revisabas. Actualiza e intenta nuevamente."
    });
    expect(mocks.inventarioFindUniqueOrThrow).toHaveBeenCalledOnce();
  });

  it("detecta como conflicto una versión invalidada por un cambio de stock de pedido", async () => {
    mocks.productoFindUnique.mockResolvedValue({ controlaStock: true, id: 1, tipo: "producto" });
    mocks.inventarioUpdateMany.mockResolvedValue({ count: 0 });
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    await updateInventarioProducto(
      {
        body: { expectedUpdatedAt: "2026-09-23T18:00:00.000Z", stockMinimo: 8 },
        params: { productoId: "1" }
      } as never,
      { json, status } as never
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(mocks.inventarioFindUniqueOrThrow).not.toHaveBeenCalled();
  });
});
