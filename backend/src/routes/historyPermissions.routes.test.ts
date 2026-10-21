import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

vi.mock("../config/prisma", () => ({ default: {} }));

import pedidosRouter from "./pedidos.routes";
import turnosRouter from "./turnos.routes";

type RouteLayer = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{
      handle: (request: Request, response: Response, next: NextFunction) => unknown;
    }>;
  };
};

function route(router: unknown, path: string) {
  return (router as { stack: RouteLayer[] }).stack.find((layer) => layer.route?.path === path)?.route;
}

function responseStub() {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  return response;
}

describe("permisos de historiales", () => {
  it.each(["cajero", "cocina"])("rechaza historial detallado de pedido para %s", (role) => {
    const response = responseStub();
    const next = vi.fn();
    route(pedidosRouter, "/:id/historial")?.stack[1].handle(
      { authUser: { id: 2, role, username: role } } as never,
      response as never,
      next
    );
    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("permite el historial administrativo completo", () => {
    const next = vi.fn();
    route(pedidosRouter, "/:id/historial")?.stack[1].handle(
      { authUser: { id: 1, role: "admin", username: "admin" } } as never,
      responseStub() as never,
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it.each(["/actual", "/cierres"])("permite %s a caja y administración, pero no a cocina", (path) => {
    const roleMiddleware = route(turnosRouter, path)?.stack[1].handle;
    for (const role of ["cajero", "admin"]) {
      const next = vi.fn();
      roleMiddleware?.({ authUser: { id: 1, role, username: role } } as never, responseStub() as never, next);
      expect(next).toHaveBeenCalledOnce();
    }
    const response = responseStub();
    const next = vi.fn();
    roleMiddleware?.({ authUser: { id: 3, role: "cocina", username: "cocina" } } as never, response as never, next);
    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
