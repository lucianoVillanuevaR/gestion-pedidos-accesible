import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/auth";
import { validateTurnoCanClose } from "../validations/turnos.validation";

const turnoInclude = { usuario: { select: { username: true } }, pedidos: { select: { id: true } } } as const;
type TurnoWithRelations = Prisma.TurnoGetPayload<{ include: typeof turnoInclude }>;

const turnoCloseInclude = {
  usuario: { select: { username: true } },
  pedidos: {
    include: { detalles: { include: { producto: { select: { nombre: true } } } } },
    orderBy: { createdAt: "asc" }
  }
} as const;
type TurnoForClose = Prisma.TurnoGetPayload<{ include: typeof turnoCloseInclude }>;

function serializeTurno(turno: TurnoWithRelations) {
  return {
    id: turno.id,
    estado: turno.estado,
    fechaInicio: turno.fechaInicio.toISOString(),
    fechaCierre: turno.fechaCierre?.toISOString() ?? null,
    usuarioId: turno.usuario.username,
    pedidoIds: turno.pedidos.map((pedido) => pedido.id),
    resumen: turno.resumen
  };
}

function buildResumenTurno(turno: TurnoForClose, fechaCierre: Date): Prisma.InputJsonValue {
  const pedidosEntregados = turno.pedidos.filter((pedido) => pedido.estado === "entregado");
  const pedidosCancelados = turno.pedidos.filter((pedido) => pedido.estado === "cancelado");
  const totalPorMetodo = { efectivo: 0, tarjeta: 0, transferencia: 0 };
  const productos = new Map<number, { cantidad: number; productoId: number; productoNombre: string; total: number }>();

  for (const pedido of pedidosEntregados) {
    if (pedido.metodoPago in totalPorMetodo) {
      totalPorMetodo[pedido.metodoPago as keyof typeof totalPorMetodo] += pedido.total.toNumber();
    }

    for (const detalle of pedido.detalles) {
      const current = productos.get(detalle.productoId);
      productos.set(detalle.productoId, {
        cantidad: (current?.cantidad ?? 0) + detalle.cantidad,
        productoId: detalle.productoId,
        productoNombre: detalle.producto.nombre,
        total: (current?.total ?? 0) + detalle.subtotal.toNumber()
      });
    }
  }

  return {
    id: `turno-${turno.id}`,
    fechaInicio: turno.fechaInicio.toISOString(),
    fechaCierre: fechaCierre.toISOString(),
    usuarioId: turno.usuario.username,
    pedidos: turno.pedidos.map((pedido, index) => ({
      id: pedido.id,
      numeroTurno: index + 1,
      clienteNombre: pedido.clienteNombre,
      createdAt: pedido.createdAt.toISOString(),
      estado: pedido.estado,
      metodoPago: pedido.metodoPago,
      observacion: pedido.observacion,
      total: pedido.total.toNumber(),
      detalles: pedido.detalles.map((detalle) => ({
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario.toNumber(),
        productoId: detalle.productoId,
        productoNombre: detalle.producto.nombre,
        subtotal: detalle.subtotal.toNumber()
      }))
    })),
    productosVendidos: [...productos.values()].sort((left, right) => right.cantidad - left.cantidad),
    totalPedidos: turno.pedidos.length,
    pedidosEntregados: pedidosEntregados.length,
    pedidosCancelados: pedidosCancelados.length,
    pedidosPendientes: 0,
    totalVendido: totalPorMetodo.efectivo + totalPorMetodo.tarjeta + totalPorMetodo.transferencia,
    totalEfectivo: totalPorMetodo.efectivo,
    totalPendiente: 0,
    totalTarjeta: totalPorMetodo.tarjeta,
    totalTransferencia: totalPorMetodo.transferencia
  };
}

export async function getTurnoActual(_req: Request, res: Response) {
  const turno = await prisma.turno.findFirst({ where: { estado: "abierto" }, include: turnoInclude });
  return res.json({ turno: turno ? serializeTurno(turno) : null });
}

export async function abrirTurno(req: Request, res: Response) {
  const auth = (req as AuthenticatedRequest).authUser;
  const existing = await prisma.turno.findFirst({ where: { estado: "abierto" }, include: turnoInclude });

  if (existing) {
    return res.status(409).json({ error: "Ya existe un turno abierto", turno: serializeTurno(existing) });
  }

  try {
    const turno = await prisma.turno.create({ data: { usuarioId: auth.id }, include: turnoInclude });
    return res.status(201).json({ turno: serializeTurno(turno) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ error: "Ya existe un turno abierto" });
    }
    throw error;
  }
}

export async function cerrarTurno(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID de turno inválido" });
  }

  const turno = await prisma.turno.findUnique({
    where: { id },
    include: turnoCloseInclude
  });
  if (!turno) return res.status(404).json({ error: "Turno no encontrado" });

  const closeError = validateTurnoCanClose(
    turno.estado,
    turno.pedidos.map((pedido) => pedido.estado)
  );
  if (closeError) return res.status(409).json({ error: closeError });

  const fechaCierre = new Date();
  const resumen = buildResumenTurno(turno, fechaCierre);
  const cerrado = await prisma.turno.update({
    where: { id },
    data: { estado: "cerrado", fechaCierre, resumen },
    include: turnoInclude
  });
  return res.json({ turno: serializeTurno(cerrado) });
}

export async function getCierres(_req: Request, res: Response) {
  const turnos = await prisma.turno.findMany({
    where: { estado: "cerrado" },
    orderBy: { fechaCierre: "desc" },
    include: turnoInclude
  });
  return res.json({ turnos: turnos.map(serializeTurno) });
}
