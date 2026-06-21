import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import prisma from "../config/prisma";

export type AuthenticatedRequest = Request & {
  authUser: { id: number; role: string; username: string };
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Debes iniciar sesión" });
  }

  let payload: jwt.JwtPayload;

  try {
    payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
  } catch {
    return res.status(401).json({ error: "Sesión inválida o vencida" });
  }

  const userId = Number(payload.sub);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({ error: "Sesión inválida o vencida" });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { activo: true, id: true, role: true, username: true }
    });

    if (!user?.activo) {
      return res.status(401).json({ error: "Usuario no disponible" });
    }

    (req as AuthenticatedRequest).authUser = {
      id: user.id,
      role: user.role,
      username: user.username
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).authUser;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "No tienes permisos para realizar esta acción" });
    }
    next();
  };
}
