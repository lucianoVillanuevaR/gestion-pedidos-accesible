import { Decimal } from "@prisma/client/runtime/library";
import { describe, expect, it, vi } from "vitest";
import { RequestError } from "../utils/httpErrors";
import {
  assertPedidoCanBeUpdated,
  preparePedidoWrite,
  restorePedidoStock,
  shouldRestoreStockOnStateChange
} from "./pedidoWriteService";

function normalProduct(id: number, nombre: string, precio: number) {
  return {
    id,
    nombre,
    precio: new Decimal(precio),
    disponible: true,
    tipo: "producto" as const,
    controlaStock: true,
    inventario: { stockActual: 20 },
    variantes: [],
    componentes: []
  };
}

describe("escritura de pedidos", () => {
  it("calcula cantidades, subtotales y total, y consume el stock requerido", async () => {
    const products = [normalProduct(1, "Completo", 2500), normalProduct(2, "Bebida", 1000)];
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      producto: {
        findMany: vi.fn().mockResolvedValue(products)
      },
      inventario: { updateMany }
    } as never;

    const result = await preparePedidoWrite(tx, [
      { productoId: 1, cantidad: 2 },
      { productoId: 2, cantidad: 3 }
    ]);

    expect(result.total.toString()).toBe("8000");
    expect(result.detallesData.map((detail) => detail.subtotal.toString())).toEqual(["5000", "3000"]);
    expect(tx.producto.findMany).toHaveBeenCalledTimes(2);
    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { stockActual: { decrement: 2 } } }));
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { stockActual: { decrement: 3 } } }));
  });

  it("devuelve al inventario los componentes consumidos por una promoción cancelada", async () => {
    const component = normalProduct(1, "Completo Italiano", 2500);
    const promo = {
      ...normalProduct(10, "Promo 2x1", 3900),
      tipo: "promo" as const,
      controlaStock: false,
      componentes: [
        {
          componenteId: 1,
          cantidad: 2,
          varianteId: null,
          componente: component
        }
      ]
    };
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      producto: { findMany: vi.fn().mockResolvedValue([promo]) },
      inventario: { updateMany }
    } as never;

    await restorePedidoStock(tx, [{ productoId: 10, cantidad: 2, varianteId: null, personalizacion: null }]);

    expect(updateMany).toHaveBeenCalledWith({
      where: { productoId: 1 },
      data: { stockActual: { increment: 4 } }
    });
  });

  it("solo devuelve stock cuando el nuevo estado es cancelado", () => {
    expect(shouldRestoreStockOnStateChange("pendiente", "cancelado")).toBe(true);
    expect(shouldRestoreStockOnStateChange("en_preparacion", "cancelado")).toBe(true);
    expect(shouldRestoreStockOnStateChange("pendiente", "en_preparacion")).toBe(false);
    expect(shouldRestoreStockOnStateChange("cancelado", "cancelado")).toBe(false);
  });

  it("rechaza pedidos que ya no están pendientes", () => {
    const version = new Date("2026-07-20T10:00:00.000Z");
    expect(() => assertPedidoCanBeUpdated("en_preparacion", version, version)).toThrow(
      "Solo se pueden modificar pedidos pendientes"
    );
  });

  it("rechaza una versión desactualizada para evitar sobrescrituras simultáneas", () => {
    try {
      assertPedidoCanBeUpdated("pendiente", new Date("2026-07-20T10:01:00.000Z"), new Date("2026-07-20T10:00:00.000Z"));
      throw new Error("Se esperaba un conflicto");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestError);
      expect((error as RequestError).statusCode).toBe(409);
      expect((error as Error).message).toContain("otra persona");
    }
  });
});
