import { Request, Response } from "express";
import prisma from "../config/prisma";
import type { AuthenticatedRequest } from "../middlewares/auth";
import { lockTurnOperations } from "../services/databaseLocks";
import { withProductImageUrl } from "../services/productImageService";
import {
  assertPedidoCanBeUpdated,
  normalizePedidoDetalles,
  preparePedidoWrite,
  restorePedidoStock,
  shouldRestoreStockOnStateChange,
  type PedidoDetalleInput,
} from "../services/pedidoWriteService";
import { RequestError } from "../utils/httpErrors";
import {
  parsePositiveIntegerId,
  validatePositiveIntegerId,
} from "../validations/common.validation";
import {
  validateEstadoPedido,
  validateIdempotencyKey,
  validateMetodoPago,
  validatePedidoDetalles,
  validatePedidoTextFields,
  validateTransicionEstadoPedido,
} from "../validations/pedidos.validation";

const PEDIDO_WITH_DETALLES_INCLUDE = {
  detalles: {
    include: {
      producto: { select: { id: true, imagenUrl: true, nombre: true } },
      variante: { select: { id: true, nombre: true, productoId: true } },
    },
  },
} as const;

interface CrearPedidoBody {
  detalles: PedidoDetalleInput[];
  idempotencyKey: string;
  metodoPago: string;
  clienteNombre: string;
  observacion?: string;
}

interface ActualizarEstadoBody {
  estado: string;
}

type ActualizarPedidoBody = CrearPedidoBody & { expectedUpdatedAt: string };

function withPedidoProductImageUrls<
  T extends {
    detalles?: Array<{ producto?: { imagenUrl?: string | null } | null }>;
  },
>(pedido: T) {
  return {
    ...pedido,
    detalles: pedido.detalles?.map((detalle) => ({
      ...detalle,
      producto: detalle.producto
        ? withProductImageUrl(detalle.producto)
        : detalle.producto,
    })),
  };
}

function pedidoAuditSnapshot(pedido: {
  clienteNombre: string | null;
  metodoPago: string;
  observacion: string | null;
  total: { toString(): string };
  detalles: Array<{
    productoId: number;
    cantidad: number;
    varianteId: number | null;
    personalizacion: unknown;
  }>;
}) {
  return {
    clienteNombre: pedido.clienteNombre,
    metodoPago: pedido.metodoPago,
    observacion: pedido.observacion,
    total: pedido.total.toString(),
    detalles: pedido.detalles.map(
      ({ cantidad, personalizacion, productoId, varianteId }) => ({
        cantidad,
        personalizacion,
        productoId,
        varianteId,
      }),
    ),
  };
}

export const crearPedido = async (req: Request, res: Response) => {
  try {
    const { clienteNombre, detalles, idempotencyKey, metodoPago, observacion } =
      req.body as CrearPedidoBody;

    const idempotencyKeyError = validateIdempotencyKey(idempotencyKey);

    if (idempotencyKeyError) {
      return res.status(400).json({ error: idempotencyKeyError });
    }

    const metodoPagoError = validateMetodoPago(metodoPago);

    if (metodoPagoError) {
      return res.status(400).json({ error: metodoPagoError });
    }

    const textFieldsError = validatePedidoTextFields(
      clienteNombre,
      observacion,
    );

    if (textFieldsError) {
      return res.status(400).json({ error: textFieldsError });
    }

    const detallesError = validatePedidoDetalles(detalles);

    if (detallesError) {
      return res.status(400).json({ error: detallesError });
    }

    const detallesNormalizados = normalizePedidoDetalles(detalles);

    let transactionResult;

    try {
      transactionResult = await prisma.$transaction(async (tx) => {
        await lockTurnOperations(tx);

        const pedidoExistente = await tx.pedido.findUnique({
          where: { idempotencyKey },
          include: PEDIDO_WITH_DETALLES_INCLUDE,
        });

        if (pedidoExistente) {
          const numeroTurno = await tx.pedido.count({
            where: {
              turnoId: pedidoExistente.turnoId,
              OR: [
                { createdAt: { lt: pedidoExistente.createdAt } },
                {
                  createdAt: pedidoExistente.createdAt,
                  id: { lte: pedidoExistente.id },
                },
              ],
            },
          });
          return {
            pedido: { ...pedidoExistente, numeroTurno },
            statusCode: 200,
          };
        }

        const turno = await tx.turno.findFirst({
          where: { estado: "abierto" },
        });
        if (!turno) {
          throw new RequestError(
            409,
            "Debes abrir turno antes de registrar un pedido",
          );
        }

        const { detallesData, total } = await preparePedidoWrite(
          tx,
          detallesNormalizados,
        );

        const pedidoCreado = await tx.pedido.create({
          data: {
            idempotencyKey,
            turnoId: turno.id,
            total,
            estado: "pendiente",
            metodoPago,
            clienteNombre: clienteNombre.trim(),
            observacion: observacion?.trim() || null,
            detalles: {
              create: detallesData,
            },
          },
          include: PEDIDO_WITH_DETALLES_INCLUDE,
        });

        const numeroTurno = await tx.pedido.count({
          where: { turnoId: turno.id },
        });
        return { pedido: { ...pedidoCreado, numeroTurno }, statusCode: 201 };
      });
    } catch (error) {
      const isIdempotencyConflict =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002";

      if (!isIdempotencyConflict) throw error;

      const pedidoExistente = await prisma.pedido.findUnique({
        where: { idempotencyKey },
        include: PEDIDO_WITH_DETALLES_INCLUDE,
      });

      if (!pedidoExistente) throw error;

      const numeroTurno = await prisma.pedido.count({
        where: {
          turnoId: pedidoExistente.turnoId,
          OR: [
            { createdAt: { lt: pedidoExistente.createdAt } },
            {
              createdAt: pedidoExistente.createdAt,
              id: { lte: pedidoExistente.id },
            },
          ],
        },
      });
      transactionResult = {
        pedido: { ...pedidoExistente, numeroTurno },
        statusCode: 200,
      };
    }

    res
      .status(transactionResult.statusCode)
      .json(withPedidoProductImageUrls(transactionResult.pedido));
  } catch (error) {
    if (error instanceof RequestError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Error al crear pedido:", error);
    res.status(500).json({ error: "Error al crear pedido" });
  }
};

export const getPedidos = async (_req: Request, res: Response) => {
  try {
    const turno = await prisma.turno.findFirst({
      where: { estado: "abierto" },
      select: { id: true },
    });
    if (!turno) {
      return res.json([]);
    }

    const pedidos = await prisma.pedido.findMany({
      where: { turnoId: turno.id },
      include: PEDIDO_WITH_DETALLES_INCLUDE,
      orderBy: { createdAt: "desc" },
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
      include: PEDIDO_WITH_DETALLES_INCLUDE,
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const numeroTurno = await prisma.pedido.count({
      where: {
        turnoId: pedido.turnoId,
        OR: [
          { createdAt: { lt: pedido.createdAt } },
          { createdAt: pedido.createdAt, id: { lte: pedido.id } },
        ],
      },
    });

    res.json(withPedidoProductImageUrls({ ...pedido, numeroTurno }));
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).json({ error: "Error al obtener pedido" });
  }
};

export const getPedidoHistorial = async (req: Request, res: Response) => {
  try {
    const idError = validatePositiveIntegerId(req.params.id, "ID de pedido");
    if (idError) return res.status(400).json({ error: idError });

    const pedidoId = parsePositiveIntegerId(req.params.id);
    const pedidoExiste = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { id: true },
    });
    if (!pedidoExiste)
      return res.status(404).json({ error: "Pedido no encontrado" });

    const historial = await prisma.pedidoHistorial.findMany({
      where: { pedidoId },
      include: { usuario: { select: { label: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(historial);
  } catch (error) {
    console.error("Error al obtener historial del pedido:", error);
    res.status(500).json({ error: "Error al obtener historial del pedido" });
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
    const usuarioId = (req as AuthenticatedRequest).authUser.id;
    const pedidoActualizado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: { detalles: true },
      });
      if (!pedido) throw new RequestError(404, "Pedido no encontrado");

      const transicionError = validateTransicionEstadoPedido(
        pedido.estado,
        estado,
      );
      if (transicionError) throw new RequestError(400, transicionError);
      if (pedido.estado === estado) {
        return tx.pedido.findUniqueOrThrow({
          where: { id: pedidoId },
          include: PEDIDO_WITH_DETALLES_INCLUDE,
        });
      }

      if (shouldRestoreStockOnStateChange(pedido.estado, estado)) {
        await restorePedidoStock(tx, pedido.detalles);
      }

      const updateResult = await tx.pedido.updateMany({
        where: {
          id: pedidoId,
          estado: pedido.estado,
          updatedAt: pedido.updatedAt,
        },
        data: { estado },
      });
      if (updateResult.count === 0) {
        throw new RequestError(
          409,
          "El pedido cambió mientras lo revisabas. Actualiza e intenta nuevamente",
        );
      }

      if (pedido.estado !== estado) {
        await tx.pedidoHistorial.create({
          data: {
            pedidoId,
            usuarioId,
            accion: "estado_modificado",
            cambios: { anterior: pedido.estado, nuevo: estado },
          },
        });
      }
      return tx.pedido.findUniqueOrThrow({
        where: { id: pedidoId },
        include: PEDIDO_WITH_DETALLES_INCLUDE,
      });
    });

    res.json(withPedidoProductImageUrls(pedidoActualizado));
  } catch (error) {
    if (error instanceof RequestError)
      return res.status(error.statusCode).json({ error: error.message });
    console.error("Error al actualizar estado del pedido:", error);
    res.status(500).json({ error: "Error al actualizar estado del pedido" });
  }
};

export const actualizarPedido = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      clienteNombre,
      detalles,
      expectedUpdatedAt,
      metodoPago,
      observacion,
    } = req.body as ActualizarPedidoBody;
    const idError = validatePositiveIntegerId(id, "ID de pedido");

    if (idError) return res.status(400).json({ error: idError });

    const validationError =
      validateMetodoPago(metodoPago) ||
      validatePedidoTextFields(clienteNombre, observacion) ||
      validatePedidoDetalles(detalles);

    if (validationError)
      return res.status(400).json({ error: validationError });
    const expectedUpdatedAtDate = new Date(expectedUpdatedAt);
    if (!expectedUpdatedAt || Number.isNaN(expectedUpdatedAtDate.getTime())) {
      return res
        .status(400)
        .json({ error: "La versión del pedido es requerida" });
    }

    const pedidoId = parsePositiveIntegerId(id);
    const usuarioId = (req as AuthenticatedRequest).authUser.id;
    const detallesNormalizados = normalizePedidoDetalles(detalles);

    const pedidoActualizado = await prisma.$transaction(async (tx) => {
      const pedidoActual = await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: { detalles: true },
      });

      if (!pedidoActual) throw new RequestError(404, "Pedido no encontrado");
      assertPedidoCanBeUpdated(
        pedidoActual.estado,
        pedidoActual.updatedAt,
        expectedUpdatedAtDate,
      );

      const versionLock = await tx.pedido.updateMany({
        where: {
          id: pedidoId,
          estado: "pendiente",
          updatedAt: expectedUpdatedAtDate,
        },
        data: { updatedAt: new Date() },
      });
      if (versionLock.count === 0) {
        throw new RequestError(
          409,
          "El pedido fue modificado por otra persona. Recarga antes de guardar",
        );
      }

      await restorePedidoStock(tx, pedidoActual.detalles);
      const { detallesData, total } = await preparePedidoWrite(
        tx,
        detallesNormalizados,
      );
      await tx.detallePedido.deleteMany({ where: { pedidoId } });

      const actualizado = await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          clienteNombre: clienteNombre.trim(),
          metodoPago,
          observacion: observacion?.trim() || null,
          total,
          detalles: { create: detallesData },
        },
        include: PEDIDO_WITH_DETALLES_INCLUDE,
      });
      await tx.pedidoHistorial.create({
        data: {
          pedidoId,
          usuarioId,
          accion: "pedido_modificado",
          cambios: JSON.parse(
            JSON.stringify({
              anterior: pedidoAuditSnapshot(pedidoActual),
              nuevo: pedidoAuditSnapshot(actualizado),
            }),
          ),
        },
      });
      return actualizado;
    });

    res.json(withPedidoProductImageUrls(pedidoActualizado));
  } catch (error) {
    if (error instanceof RequestError)
      return res.status(error.statusCode).json({ error: error.message });
    console.error("Error al modificar pedido:", error);
    res.status(500).json({ error: "Error al modificar pedido" });
  }
};
