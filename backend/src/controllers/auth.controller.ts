import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/auth";
import { validateLoginInput } from "../validations/auth.validation";

function publicUser(user: { email: string; label: string; role: string; username: string }) {
  return { email: user.email, label: user.label, role: user.role, username: user.username };
}

export async function login(req: Request, res: Response) {
  const validation = validateLoginInput(req.body);

  if (validation.error || !validation.data) {
    return res.status(400).json({ error: validation.error });
  }

  const { identifier, password } = validation.data;
  const user = await prisma.usuario.findFirst({
    where: { activo: true, OR: [{ username: identifier }, { email: identifier }] }
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  const token = jwt.sign({ role: user.role, username: user.username }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: "8h"
  });

  return res.json({ token, user: publicUser(user) });
}

export async function me(req: Request, res: Response) {
  const auth = (req as AuthenticatedRequest).authUser;
  const user = await prisma.usuario.findUnique({ where: { id: auth.id } });

  if (!user?.activo) {
    return res.status(401).json({ error: "Usuario no disponible" });
  }

  return res.json({ user: publicUser(user) });
}
