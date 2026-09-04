import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

vi.mock("../config/prisma", () => ({ default: {} }));

import router from "./admin.routes";

type RouteLayer = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: (request: Request, response: Response, next: NextFunction) => unknown }>;
  };
};

describe("rutas del dashboard administrativo", () => {
  const route = (router as unknown as { stack: RouteLayer[] }).stack.find(
    (layer) => layer.route?.path === "/dashboard"
  )?.route;

  it("registra únicamente GET con autenticación, rol y controlador", () => {
    expect(route?.methods.get).toBe(true);
    expect(route?.stack).toHaveLength(3);
  });

  it("impide que un rol no administrador alcance el controlador", () => {
    const status = vi.fn();
    const response = { json: vi.fn(), status };
    status.mockReturnValue(response);
    const next = vi.fn();

    route?.stack[1].handle(
      { authUser: { id: 2, role: "cajero", username: "caja" } } as unknown as Request,
      response as unknown as Response,
      next
    );

    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
