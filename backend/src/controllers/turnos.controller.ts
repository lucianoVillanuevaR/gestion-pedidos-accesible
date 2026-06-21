import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/auth";

const turnoInclude = { usuario: { select: { username: true } }, pedidos: { select: { id: true } } } as const;
type TurnoWithRelations = Prisma.TurnoGetPayload<{ include: typeof turnoInclude }>;

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

  const turno = await prisma.turno.findUnique({ where: { id } });
  if (!turno) return res.status(404).json({ error: "Turno no encontrado" });
  if (turno.estado !== "abierto") return res.status(409).json({ error: "El turno ya está cerrado" });

  const resumen = req.body?.resumen as Prisma.InputJsonValue | undefined;
  const cerrado = await prisma.turno.update({
    where: { id },
    data: { estado: "cerrado", fechaCierre: new Date(), ...(resumen !== undefined && { resumen }) },
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
