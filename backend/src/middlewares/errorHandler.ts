import type { NextFunction, Request, Response } from "express";

export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  // Express identifica los handlers de error por recibir cuatro argumentos.
  void next;

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "JSON inválido" });
  }

  if (error instanceof Error && "type" in error && error.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload demasiado grande" });
  }

  console.error("Error no controlado:", error);
  return res.status(500).json({ error: "Error interno del servidor" });
}
