import { Prisma } from "@prisma/client";
import { RequestError } from "../utils/httpErrors";
import type { StockRequirement } from "./stockRequirementsService";

type StockTransaction = Prisma.TransactionClient;

export async function consumeStockRequirements(tx: StockTransaction, consumos: Map<number, StockRequirement>) {
  if (consumos.size === 0) return;

  const componentes = await tx.producto.findMany({
    where: { id: { in: [...consumos.keys()] } },
    include: { inventario: true }
  });
  const componentesById = new Map(componentes.map((componente) => [componente.id, componente]));

  for (const [componenteId, consumo] of consumos) {
    const componente = componentesById.get(componenteId);
    const stockActual = componente?.inventario?.stockActual ?? 0;

    if (!componente || stockActual < consumo.cantidad) {
      throw new RequestError(
        400,
        `Stock insuficiente en componente "${consumo.componenteNombre}" para "${[...consumo.productosVendidos].join(", ")}". Disponible: ${stockActual}, requerido: ${consumo.cantidad}`
      );
    }
  }

  for (const [componenteId, consumo] of consumos) {
    const inventarioActualizado = await tx.inventario.updateMany({
      data: {
        stockActual: {
          decrement: consumo.cantidad
        }
      },
      where: {
        productoId: componenteId,
        stockActual: {
          gte: consumo.cantidad
        }
      }
    });

    if (inventarioActualizado.count === 0) {
      throw new RequestError(
        409,
        `Stock insuficiente en componente "${consumo.componenteNombre}". El stock cambió; intenta nuevamente.`
      );
    }
  }
}
