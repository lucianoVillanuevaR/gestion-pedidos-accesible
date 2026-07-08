import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import prisma from "../config/prisma";
import { parsePositiveIntegerId, validatePositiveIntegerId } from "../validations/common.validation";
import { validateUsuarioCreate, validateUsuarioUpdate } from "../validations/usuarios.validation";

function toUsuarioResponse(user: {
  activo: boolean;
  email: string;
  id: number;
  label: string;
  role: string;
  username: string;
}) {
  return {
    activo: user.activo,
    email: user.email,
    id: user.id,
    label: user.label,
    role: user.role,
    username: user.username
  };
}

export async function getUsuarios(_req: Request, res: Response) {
  try {
    const usuarios = await prisma.usuario.findMany({ orderBy: [{ activo: "desc" }, { label: "asc" }] });
    res.json(usuarios.map(toUsuarioResponse));
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
}

export async function createUsuario(req: Request, res: Response) {
  try {
    const validation = validateUsuarioCreate(req.body);
    if (validation.error || !validation.data) return res.status(400).json({ error: validation.error });

    const { password, ...data } = validation.data;
    const usuario = await prisma.usuario.create({
      data: {
        ...data,
        passwordHash: await bcrypt.hash(password, 10)
      }
    });

    res.status(201).json(toUsuarioResponse(usuario));
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return res.status(409).json({ error: "Ya existe un usuario con ese nombre o email" });
    }
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
}

export async function updateUsuario(req: Request, res: Response) {
  try {
    const idError = validatePositiveIntegerId(req.params.id, "ID de usuario");
    if (idError) return res.status(400).json({ error: idError });

    const validation = validateUsuarioUpdate(req.body);
    if (validation.error || !validation.data) return res.status(400).json({ error: validation.error });

    const { password, ...data } = validation.data;
    const usuario = await prisma.usuario.update({
      data: {
        ...data,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {})
      },
      where: { id: parsePositiveIntegerId(req.params.id) }
    });

    res.json(toUsuarioResponse(usuario));
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return res.status(409).json({ error: "Ya existe un usuario con ese nombre o email" });
    }
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
}
