import type { Request, Response } from "express";

export function getHealth(_request: Request, response: Response) {
  response.json({
    status: "ok",
    message: "Backend running"
  });
}

