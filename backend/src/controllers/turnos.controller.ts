import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/auth";
import { lockTurnOperations } from "../services/databaseLocks";
import { buildResumenTurno, turnoCloseInclude } from "../services/turnoSummaryService";
import { validateTurnoCanClose } from "../validations/turnos.validation";

const turnoInclude = {
  usuario: { select: { label: true, role: true, username: true } },
  pedidos: { select: { id: true } }
} as const;
type TurnoWithRelations = Prisma.TurnoGetPayload<{
  include: typeof turnoInclude;
}>;

function serializeTurno(turno: TurnoWithRelations) {
  const usuario = {
    label: turno.usuario.label,
    role: turno.usuario.role,
    username: turno.usuario.username
  };
  const resumen =
    turno.resumen && typeof turno.resumen === "object" && !Array.isArray(turno.resumen)
      ? {
          ...turno.resumen,
          usuario,
          usuarioId: "usuarioId" in turno.resumen ? turno.resumen.usuarioId : turno.usuario.username
        }
      : turno.resumen;

  return {
    id: turno.id,
    estado: turno.estado,
    fechaInicio: turno.fechaInicio.toISOString(),
    fechaCierre: turno.fechaCierre?.toISOString() ?? null,
    usuarioId: turno.usuario.username,
    usuario,
    pedidoIds: turno.pedidos.map((pedido) => pedido.id),
    resumen
  };
}

export async function getTurnoActual(_req: Request, res: Response) {
  const turno = await prisma.turno.findFirst({
    where: { estado: "abierto" },
    include: turnoInclude
  });
  return res.json({ turno: turno ? serializeTurno(turno) : null });
}

export async function abrirTurno(req: Request, res: Response) {
  const auth = (req as AuthenticatedRequest).authUser;
  try {
    const turno = await prisma.$transaction(async (tx) => {
      await lockTurnOperations(tx);
      const existing = await tx.turno.findFirst({
        where: { estado: "abierto" },
        include: turnoInclude
      });
      if (existing) {
        throw Object.assign(new Error("Ya existe un turno abierto"), {
          existing
        });
      }
      return tx.turno.create({
        data: { usuarioId: auth.id },
        include: turnoInclude
      });
    });
    return res.status(201).json({ turno: serializeTurno(turno) });
  } catch (error) {
    if (error instanceof Error && "existing" in error) {
      return res.status(409).json({
        error: error.message,
        turno: serializeTurno(error.existing as TurnoWithRelations)
      });
    }
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

  const result = await prisma.$transaction(async (tx) => {
    await lockTurnOperations(tx);
    const turno = await tx.turno.findUnique({
      where: { id },
      include: turnoCloseInclude
    });
    if (!turno) return { status: 404 as const, error: "Turno no encontrado" };
    const closeError = validateTurnoCanClose(
      turno.estado,
      turno.pedidos.map((pedido) => pedido.estado)
    );
    if (closeError) return { status: 409 as const, error: closeError };
    const fechaCierre = new Date();
    const resumen = buildResumenTurno(turno, fechaCierre);
    const cerrado = await tx.turno.update({
      where: { id },
      data: { estado: "cerrado", fechaCierre, resumen },
      include: turnoInclude
    });
    return { turno: cerrado };
  });
  if ("error" in result && result.status) return res.status(result.status).json({ error: result.error });
  return res.json({ turno: serializeTurno(result.turno) });
}

export async function getCierres(_req: Request, res: Response) {
  const turnos = await prisma.turno.findMany({
    where: { estado: "cerrado" },
    orderBy: { fechaCierre: "desc" },
    include: turnoInclude
  });
  return res.json({ turnos: turnos.map(serializeTurno) });
}
