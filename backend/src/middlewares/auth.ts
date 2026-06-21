import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type AuthenticatedRequest = Request & {
  authUser: { id: number; role: string; username: string };
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Debes iniciar sesión" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    (req as AuthenticatedRequest).authUser = {
      id: Number(payload.sub),
      role: String(payload.role),
      username: String(payload.username)
    };
    next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida o vencida" });
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
