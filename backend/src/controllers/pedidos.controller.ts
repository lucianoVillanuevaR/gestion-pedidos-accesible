import { Request, Response } from "express";
import prisma from "../config/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { withProductImageUrl } from "../services/productImageService";
import { parsePositiveIntegerId, validatePositiveIntegerId } from "../validations/common.validation";
import {
  validateEstadoPedido,
  validateMetodoPago,
  validatePedidoDetalles,
  validatePedidoTextFields,
  validateTransicionEstadoPedido
} from "../validations/pedidos.validation";

const PEDIDO_WITH_DETALLES_INCLUDE = {
  detalles: {
    include: {
      producto: true
    }
  }
} as const;

interface CrearPedidoBody {
  detalles: Array<{
    productoId: number;
    cantidad: number;
  }>;
  metodoPago: string;
  clienteNombre?: string;
  observacion?: string;
}

interface ActualizarEstadoBody {
  estado: string;
}

class PedidoRequestError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

function withPedidoProductImageUrls<
  T extends { detalles?: Array<{ producto?: { imagenUrl?: string | null } | null }> }
>(pedido: T) {
  return {
    ...pedido,
    detalles: pedido.detalles?.map((detalle) => ({
      ...detalle,
      producto: detalle.producto ? withProductImageUrl(detalle.producto) : detalle.producto
    }))
  };
}

export const crearPedido = async (req: Request, res: Response) => {
  try {
    const { clienteNombre, detalles, metodoPago, observacion } = req.body as CrearPedidoBody;

    const metodoPagoError = validateMetodoPago(metodoPago);

    if (metodoPagoError) {
      return res.status(400).json({ error: metodoPagoError });
    }

    const textFieldsError = validatePedidoTextFields(clienteNombre, observacion);

    if (textFieldsError) {
      return res.status(400).json({ error: textFieldsError });
    }

    const detallesError = validatePedidoDetalles(detalles);

    if (detallesError) {
      return res.status(400).json({ error: detallesError });
    }

    const detallesNormalizados = detalles.map((detalle) => ({
      cantidad: Number(detalle.cantidad),
      productoId: Number(detalle.productoId)
    }));

    const pedido = await prisma.$transaction(async (tx) => {
      const turno = await tx.turno.findFirst({ where: { estado: "abierto" } });
      if (!turno) {
        throw new PedidoRequestError(409, "Debes abrir turno antes de registrar un pedido");
      }

      const productosData = [];
      let total = new Decimal(0);

      for (const detalle of detallesNormalizados) {
        const producto = await tx.producto.findUnique({
          include: {
            inventario: true
          },
          where: { id: detalle.productoId }
        });

        if (!producto) {
          throw new PedidoRequestError(404, `Producto con ID ${detalle.productoId} no encontrado`);
        }

        if (!producto.disponible) {
          throw new PedidoRequestError(400, `Producto "${producto.nombre}" no está disponible`);
        }

        const stockActual = producto.inventario?.stockActual ?? 0;

        if (stockActual < detalle.cantidad) {
          throw new PedidoRequestError(
            400,
            `Stock insuficiente para "${producto.nombre}". Disponible: ${stockActual}, solicitado: ${detalle.cantidad}`
          );
        }

        const subtotal = producto.precio.mul(new Decimal(detalle.cantidad));
        total = total.add(subtotal);

        productosData.push({
          producto,
          cantidad: detalle.cantidad,
          subtotal
        });
      }

      for (const item of productosData) {
        const inventarioActualizado = await tx.inventario.updateMany({
          data: {
            stockActual: {
              decrement: item.cantidad
            }
          },
          where: {
            productoId: item.producto.id,
            stockActual: {
              gte: item.cantidad
            }
          }
        });

        if (inventarioActualizado.count === 0) {
          throw new PedidoRequestError(
            409,
            `Stock insuficiente para "${item.producto.nombre}". Intenta nuevamente con una cantidad menor.`
          );
        }
      }

      return tx.pedido.create({
        data: {
          turnoId: turno.id,
          total,
          estado: "pendiente",
          metodoPago,
          clienteNombre: clienteNombre?.trim() || null,
          observacion: observacion?.trim() || null,
          detalles: {
            create: productosData.map((item) => ({
              productoId: item.producto.id,
              cantidad: item.cantidad,
              precioUnitario: item.producto.precio,
              subtotal: item.subtotal
            }))
          }
        },
        include: PEDIDO_WITH_DETALLES_INCLUDE
      });
    });

    res.status(201).json(withPedidoProductImageUrls(pedido));
  } catch (error) {
    if (error instanceof PedidoRequestError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Error al crear pedido:", error);
    res.status(500).json({ error: "Error al crear pedido" });
  }
};

export const getPedidos = async (_req: Request, res: Response) => {
  try {
    const turno = await prisma.turno.findFirst({ where: { estado: "abierto" }, select: { id: true } });
    if (!turno) {
      return res.json([]);
    }

    const pedidos = await prisma.pedido.findMany({
      where: { turnoId: turno.id },
      include: PEDIDO_WITH_DETALLES_INCLUDE,
      orderBy: { createdAt: "desc" }
    });
    res.json(pedidos.map(withPedidoProductImageUrls));
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
};

export const getPedidoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idError = validatePositiveIntegerId(id, "ID de pedido");

    if (idError) {
      return res.status(400).json({ error: idError });
    }

    const pedidoId = parsePositiveIntegerId(id);
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: PEDIDO_WITH_DETALLES_INCLUDE
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.json(withPedidoProductImageUrls(pedido));
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).json({ error: "Error al obtener pedido" });
  }
};

export const actualizarEstadoPedido = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body as ActualizarEstadoBody;
    const idError = validatePositiveIntegerId(id, "ID de pedido");

    if (idError) {
      return res.status(400).json({ error: idError });
    }

    const estadoError = validateEstadoPedido(estado);

    if (estadoError) {
      return res.status(400).json({ error: estadoError });
    }

    const pedidoId = parsePositiveIntegerId(id);
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId }
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const transicionError = validateTransicionEstadoPedido(pedido.estado, estado);

    if (transicionError) {
      return res.status(400).json({ error: transicionError });
    }

    const pedidoActualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado },
      include: PEDIDO_WITH_DETALLES_INCLUDE
    });

    res.json(withPedidoProductImageUrls(pedidoActualizado));
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    res.status(500).json({ error: "Error al actualizar estado del pedido" });
  }
};
