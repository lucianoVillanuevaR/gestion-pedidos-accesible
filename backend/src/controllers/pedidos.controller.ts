import { Request, Response } from "express";
import prisma from "../config/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { withProductImageUrl } from "../services/productImageService";
import {
  validateEstadoPedido,
  validateMetodoPago,
  validatePedidoDetalles
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

function withPedidoProductImageUrls<T extends { detalles?: Array<{ producto?: { imagenUrl?: string | null } | null }> }>(pedido: T) {
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

    const detallesError = validatePedidoDetalles(detalles);

    if (detallesError) {
      return res.status(400).json({ error: detallesError });
    }

    const productosData = [];
    let total = new Decimal(0);

    for (const detalle of detalles) {
      const producto = await prisma.producto.findUnique({
        where: { id: detalle.productoId }
      });

      if (!producto) {
        return res.status(404).json({
          error: `Producto con ID ${detalle.productoId} no encontrado`
        });
      }

      if (!producto.disponible) {
        return res.status(400).json({
          error: `Producto "${producto.nombre}" no está disponible`
        });
      }

      const subtotal = producto.precio.mul(new Decimal(detalle.cantidad));
      total = total.add(subtotal);

      productosData.push({
        producto,
        cantidad: detalle.cantidad,
        subtotal
      });
    }

    const pedido = await prisma.pedido.create({
      data: {
        total,
        estado: "pendiente",
        metodoPago,
        clienteNombre: clienteNombre?.trim() || null,
        observacion: observacion || null,
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

    res.status(201).json(withPedidoProductImageUrls(pedido));
  } catch (error) {
    console.error("Error al crear pedido:", error);
    res.status(500).json({ error: "Error al crear pedido" });
  }
};

export const getPedidos = async (_req: Request, res: Response) => {
  try {
    const pedidos = await prisma.pedido.findMany({
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
    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(id) },
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

    const estadoError = validateEstadoPedido(estado);

    if (estadoError) {
      return res.status(400).json({ error: estadoError });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(id) }
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const pedidoActualizado = await prisma.pedido.update({
      where: { id: Number(id) },
      data: { estado },
      include: PEDIDO_WITH_DETALLES_INCLUDE
    });

    res.json(withPedidoProductImageUrls(pedidoActualizado));
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    res.status(500).json({ error: "Error al actualizar estado del pedido" });
  }
};
