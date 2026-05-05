import { Request, Response } from "express";
import prisma from "../config/prisma";
import { Decimal } from "@prisma/client/runtime/library";

const ESTADOS_VALIDOS = ["pendiente", "en_preparacion", "listo", "entregado", "cancelado"];
const METODOS_PAGO_VALIDOS = ["efectivo", "tarjeta", "transferencia"];

interface CrearPedidoBody {
  detalles: Array<{
    productoId: number;
    cantidad: number;
  }>;
  metodoPago: string;
  observacion?: string;
}

interface ActualizarEstadoBody {
  estado: string;
}

export const crearPedido = async (req: Request, res: Response) => {
  try {
    const { detalles, metodoPago, observacion } = req.body as CrearPedidoBody;

    // Validar método de pago
    if (!METODOS_PAGO_VALIDOS.includes(metodoPago)) {
      return res.status(400).json({
        error: `Método de pago inválido. Debe ser uno de: ${METODOS_PAGO_VALIDOS.join(", ")}`
      });
    }

    // Validar detalles
    if (!detalles || detalles.length === 0) {
      return res.status(400).json({ error: "El pedido debe tener al menos un detalle" });
    }

    // Validar cantidades y disponibilidad
    const productosData = [];
    let total = new Decimal(0);

    for (const detalle of detalles) {
      if (!detalle.productoId || detalle.cantidad <= 0) {
        return res.status(400).json({
          error: `Detalle inválido: productoId y cantidad (>0) son requeridos`
        });
      }

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

    // Crear pedido con detalles
    const pedido = await prisma.pedido.create({
      data: {
        total,
        estado: "pendiente",
        metodoPago,
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
      include: {
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    res.status(201).json(pedido);
  } catch (error) {
    console.error("Error al crear pedido:", error);
    res.status(500).json({ error: "Error al crear pedido" });
  }
};

export const getPedidos = async (req: Request, res: Response) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        detalles: {
          include: {
            producto: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(pedidos);
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
      include: {
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.json(pedido);
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).json({ error: "Error al obtener pedido" });
  }
};

export const actualizarEstadoPedido = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body as ActualizarEstadoBody;

    // Validar estado
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`
      });
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
      include: {
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    res.json(pedidoActualizado);
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    res.status(500).json({ error: "Error al actualizar estado del pedido" });
  }
};
