import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  inventarioUpsert: vi.fn(),
  productoFindMany: vi.fn(),
  productoFindUnique: vi.fn(),
  withProductImageUrl: vi.fn((producto: { imagenUrl?: string | null }) => ({
    ...producto,
    imagenPublicUrl: producto.imagenUrl ? `/media/productos/${producto.imagenUrl}` : null
  }))
}));

vi.mock("../config/prisma", () => ({
  default: {
    inventario: { upsert: mocks.inventarioUpsert },
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
        inventario: { stockActual: 27, stockMinimo: 5 },
        nombre: "Completo Alemán",
        tipo: "producto"
      },
      {
        controlaStock: true,
        disponible: true,
        id: 2,
        imagenUrl: null,
        inventario: { stockActual: 2, stockMinimo: 3 },
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
        tipo: "producto"
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
        tipo: "producto"
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
    mocks.inventarioUpsert.mockResolvedValue({ stockActual: 4, stockMinimo: 5 });
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    await updateInventarioProducto(
      { body: { stockActual: 4, stockMinimo: 5 }, params: { productoId: "1" } } as never,
      { json, status } as never
    );

    expect(mocks.productoFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mocks.inventarioUpsert).toHaveBeenCalledOnce();
    expect(json).toHaveBeenCalledWith({
      controlaStock: true,
      estado: "bajo_stock",
      imagenUrl: "/media/productos/completo-aleman.webp",
      productoDisponible: true,
      productoId: 1,
      productoNombre: "Completo Alemán",
      stockActual: 4,
      stockMinimo: 5,
      tipo: "producto"
    });
    expect(status).not.toHaveBeenCalled();
  });
});
