import { Request, Response } from "express";
import prisma from "../config/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { withProductImageUrl } from "../services/productImageService";
import {
  buildStockRequirements,
  getApplicableStockComponents,
  type StockProduct
} from "../services/stockRequirementsService";
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
      producto: true,
      variante: true
    }
  }
} as const;

interface CrearPedidoBody {
  detalles: Array<{
    productoId: number;
    cantidad: number;
    varianteId?: number;
    personalizacion?: PersonalizacionPedido;
  }>;
  metodoPago: string;
  clienteNombre: string;
  observacion?: string;
}

type PersonalizacionPedido = {
  aderezos: string[];
  comentario?: string;
  combinacion?: {
    nombre: string;
    componentes: Array<{ componenteId: number; cantidad: number }>;
  };
};

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
      productoId: Number(detalle.productoId),
      varianteId: detalle.varianteId === undefined ? undefined : Number(detalle.varianteId),
      personalizacion: detalle.personalizacion
        ? {
            aderezos: detalle.personalizacion.aderezos.map((item) => item.trim()),
            ...(detalle.personalizacion.comentario?.trim() && { comentario: detalle.personalizacion.comentario.trim() }),
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

    const pedido = await prisma.$transaction(async (tx) => {
      const turno = await tx.turno.findFirst({ where: { estado: "abierto" } });
      if (!turno) {
        throw new PedidoRequestError(409, "Debes abrir turno antes de registrar un pedido");
      }

      const productosData: Array<{
        producto: { id: number; nombre: string; precio: Decimal };
        cantidad: number;
        subtotal: Decimal;
        varianteId?: number;
        personalizacion?: PersonalizacionPedido;
      }> = [];
      const productosStock: Array<{ producto: StockProduct; cantidadVendida: number }> = [];
      let total = new Decimal(0);

      const productos = await tx.producto.findMany({
        where: { id: { in: detallesNormalizados.map((item) => item.productoId) } },
        include: {
          inventario: true,
          variantes: true,
          componentes: { include: { componente: { include: { inventario: true } } } }
        }
      });

      for (const detalle of detallesNormalizados) {
        const producto = productos.find((item) => item.id === detalle.productoId);

        if (!producto) {
          throw new PedidoRequestError(404, `Producto con ID ${detalle.productoId} no encontrado`);
        }

        if (!producto.disponible) {
          throw new PedidoRequestError(400, `Producto "${producto.nombre}" no está disponible`);
        }

        const variante = detalle.varianteId
          ? producto.variantes.find((item) => item.id === detalle.varianteId && item.disponible)
          : undefined;
        if (detalle.varianteId && !variante) {
          throw new PedidoRequestError(400, `La opción elegida no pertenece a "${producto.nombre}"`);
        }
        const requiereVariante = producto.componentes.some((item) => item.varianteId !== null);
        if (requiereVariante && !variante && !detalle.personalizacion?.combinacion) {
          throw new PedidoRequestError(400, `Debes elegir una opción para "${producto.nombre}"`);
        }
        let componentesAplicables;
        try {
          componentesAplicables = getApplicableStockComponents(
            producto,
            variante?.id,
            detalle.personalizacion?.combinacion
          );
        } catch (error) {
          throw new PedidoRequestError(400, error instanceof Error ? error.message : "La combinación no es válida");
        }
        if (detalle.personalizacion?.combinacion) {
          const nombreCantidad = (cantidad: number, nombre: string) =>
            cantidad === 1 ? nombre : `${cantidad} × ${nombre}`;
          detalle.personalizacion.combinacion.nombre = componentesAplicables
            .map((item) => nombreCantidad(item.cantidad, item.componente.nombre))
            .join(" + ");
        }

        const subtotal = producto.precio.mul(new Decimal(detalle.cantidad));
        total = total.add(subtotal);

        productosData.push({
          producto,
          cantidad: detalle.cantidad,
          subtotal,
          varianteId: variante?.id,
          personalizacion: detalle.personalizacion
        });
        productosStock.push({
          producto: { ...producto, componentes: componentesAplicables },
          cantidadVendida: detalle.cantidad
        });
      }

      const consumos = buildStockRequirements(productosStock);

      for (const [componenteId, consumo] of consumos) {
        const componente = await tx.producto.findUnique({ where: { id: componenteId }, include: { inventario: true } });
        const stockActual = componente?.inventario?.stockActual ?? 0;
        if (!componente || stockActual < consumo.cantidad) {
          throw new PedidoRequestError(
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
          throw new PedidoRequestError(
            409,
            `Stock insuficiente en componente "${consumo.componenteNombre}". El stock cambió; intenta nuevamente.`
          );
        }
      }

      return tx.pedido.create({
        data: {
          turnoId: turno.id,
          total,
          estado: "pendiente",
          metodoPago,
          clienteNombre: clienteNombre.trim(),
          observacion: observacion?.trim() || null,
          detalles: {
            create: productosData.map((item) => ({
              productoId: item.producto.id,
              cantidad: item.cantidad,
              precioUnitario: item.producto.precio,
              subtotal: item.subtotal,
              varianteId: item.varianteId,
              personalizacion: item.personalizacion
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
