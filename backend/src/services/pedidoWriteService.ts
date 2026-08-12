import { Decimal } from "@prisma/client/runtime/library";
import type { Prisma } from "@prisma/client";
import { getErrorMessage, RequestError } from "../utils/httpErrors";
import { consumeStockRequirements } from "./pedidoStockService";
import { buildStockRequirements, getApplicableStockComponents, type StockProduct } from "./stockRequirementsService";

export type PersonalizacionPedido = {
  aderezos: string[];
  comentario?: string;
  combinacion?: {
    nombre: string;
    componentes: Array<{ componenteId: number; cantidad: number }>;
  };
};

export type PedidoDetalleInput = {
  productoId: number;
  cantidad: number;
  varianteId?: number;
  personalizacion?: PersonalizacionPedido;
};

type StockTransaction = Prisma.TransactionClient;

export function assertPedidoCanBeUpdated(estado: string, updatedAt: Date, expectedUpdatedAt: Date) {
  if (estado !== "pendiente") {
    throw new RequestError(409, "Solo se pueden modificar pedidos pendientes");
  }
  if (updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
    throw new RequestError(409, "El pedido fue modificado por otra persona. Recarga antes de guardar");
  }
}

export function shouldRestoreStockOnStateChange(currentState: string, nextState: string) {
  return currentState !== "cancelado" && nextState === "cancelado";
}

export function normalizePedidoDetalles(detalles: PedidoDetalleInput[]) {
  return detalles.map((detalle) => ({
    cantidad: Number(detalle.cantidad),
    productoId: Number(detalle.productoId),
    varianteId: detalle.varianteId === undefined ? undefined : Number(detalle.varianteId),
    personalizacion: detalle.personalizacion
      ? {
          aderezos: detalle.personalizacion.aderezos.map((item) => item.trim()),
          ...(detalle.personalizacion.comentario?.trim() && {
            comentario: detalle.personalizacion.comentario.trim()
          }),
          ...(detalle.personalizacion.combinacion && {
            combinacion: {
              nombre: detalle.personalizacion.combinacion.nombre.trim(),
              componentes: detalle.personalizacion.combinacion.componentes.map((item) => ({
                componenteId: Number(item.componenteId),
                cantidad: Number(item.cantidad)
              }))
            }
          })
        }
      : undefined
  }));
}

export async function preparePedidoWrite(tx: StockTransaction, detalles: PedidoDetalleInput[]) {
  const productos = await tx.producto.findMany({
    where: { id: { in: detalles.map((item) => item.productoId) } },
    include: {
      inventario: true,
      variantes: true,
      componentes: {
        include: { componente: { include: { inventario: true } } }
      }
    }
  });
  const productosById = new Map(productos.map((producto) => [producto.id, producto]));
  const detallesData: Array<{
    productoId: number;
    cantidad: number;
    precioUnitario: Decimal;
    subtotal: Decimal;
    varianteId?: number;
    personalizacion?: PersonalizacionPedido;
  }> = [];
  const productosStock: Array<{
    producto: StockProduct;
    cantidadVendida: number;
  }> = [];
  let total = new Decimal(0);

  for (const detalle of detalles) {
    const producto = productosById.get(detalle.productoId);
    if (!producto) throw new RequestError(404, `Producto con ID ${detalle.productoId} no encontrado`);
    if (!producto.disponible) throw new RequestError(400, `Producto "${producto.nombre}" no está disponible`);

    const variante = detalle.varianteId
      ? producto.variantes.find((item) => item.id === detalle.varianteId && item.disponible)
      : undefined;
    if (detalle.varianteId && !variante) {
      throw new RequestError(400, `La opción elegida no pertenece a "${producto.nombre}"`);
    }
    if (
      producto.componentes.some((item) => item.varianteId !== null) &&
      !variante &&
      !detalle.personalizacion?.combinacion
    ) {
      throw new RequestError(400, `Debes elegir una opción para "${producto.nombre}"`);
    }

    let componentesAplicables;
    try {
      componentesAplicables = getApplicableStockComponents(
        producto,
        variante?.id,
        detalle.personalizacion?.combinacion
      );
    } catch (error) {
      throw new RequestError(400, getErrorMessage(error, "La combinación no es válida"));
    }

    const personalizacion = detalle.personalizacion?.combinacion
      ? {
          ...detalle.personalizacion,
          combinacion: {
            ...detalle.personalizacion.combinacion,
            nombre: componentesAplicables
              .map((item) => `${item.cantidad === 1 ? "" : `${item.cantidad} × `}${item.componente.nombre}`)
              .join(" + ")
          }
        }
      : detalle.personalizacion;

    const subtotal = producto.precio.mul(detalle.cantidad);
    total = total.add(subtotal);
    detallesData.push({
      productoId: producto.id,
      cantidad: detalle.cantidad,
      precioUnitario: producto.precio,
      subtotal,
      varianteId: variante?.id,
      personalizacion
    });
    productosStock.push({
      producto: { ...producto, componentes: componentesAplicables },
      cantidadVendida: detalle.cantidad
    });
  }

  await consumeStockRequirements(tx, buildStockRequirements(productosStock));
  return { detallesData, total };
}

export async function restorePedidoStock(
  tx: StockTransaction,
  detalles: Array<{
    productoId: number;
    cantidad: number;
    varianteId: number | null;
    personalizacion: Prisma.JsonValue;
  }>
) {
  const productos = await tx.producto.findMany({
    where: { id: { in: detalles.map((item) => item.productoId) } },
    include: {
      inventario: true,
      variantes: true,
      componentes: {
        include: { componente: { include: { inventario: true } } }
      }
    }
  });
  const productosById = new Map(productos.map((producto) => [producto.id, producto]));
  const productosStock: Array<{
    producto: StockProduct;
    cantidadVendida: number;
  }> = [];

  for (const detalle of detalles) {
    const producto = productosById.get(detalle.productoId);
    if (!producto) continue;
    const personalizacion = detalle.personalizacion as unknown as PersonalizacionPedido | null;
    const componentes = getApplicableStockComponents(
      producto,
      detalle.varianteId ?? undefined,
      personalizacion?.combinacion
    );
    productosStock.push({
      producto: { ...producto, componentes },
      cantidadVendida: detalle.cantidad
    });
  }

  for (const [componenteId, consumo] of buildStockRequirements(productosStock)) {
    await tx.inventario.updateMany({
      where: { productoId: componenteId },
      data: { stockActual: { increment: consumo.cantidad } }
    });
  }
}
