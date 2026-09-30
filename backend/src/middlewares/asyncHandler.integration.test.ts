import express, { type Express } from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  turnoFindFirst: vi.fn(),
  usuarioFindFirst: vi.fn(),
  usuarioFindUnique: vi.fn()
}));

vi.mock("../config/prisma", () => ({
  default: {
    turno: { findFirst: mocks.turnoFindFirst },
    usuario: {
      findFirst: mocks.usuarioFindFirst,
      findUnique: mocks.usuarioFindUnique
    }
  }
}));

import { login, me } from "../controllers/auth.controller";
import { getTurnoActual } from "../controllers/turnos.controller";
import { asyncHandler } from "./asyncHandler";
import { errorHandler } from "./errorHandler";

let server: Server | null = null;

async function request(app: Express, path: string, init?: RequestInit) {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  return fetch(`http://127.0.0.1:${port}${path}`, init);
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post("/login", asyncHandler(login));
  app.get(
    "/me",
    (req, _res, next) => {
      Object.assign(req, { authUser: { id: 1, role: "admin", username: "admin" } });
      next();
    },
    asyncHandler(me)
  );
  app.get("/turno", asyncHandler(getTurnoActual));
  app.use(errorHandler);
  return app;
}

describe("propagación de errores async", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (server)
      await new Promise<void>((resolve, reject) => server?.close((error) => (error ? reject(error) : resolve())));
    server = null;
  });

  it("envía un rechazo de Prisma en login al middleware global", async () => {
    mocks.usuarioFindFirst.mockRejectedValue(new Error("database unavailable"));

    const response = await request(buildApp(), "/login", {
      body: JSON.stringify({ identifier: "admin", password: "clave" }),
      headers: { "content-type": "application/json" },
      method: "POST"
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Error interno del servidor" });
  });

  it("envía un rechazo de Prisma en me al middleware global", async () => {
    mocks.usuarioFindUnique.mockRejectedValue(new Error("database unavailable"));

    const response = await request(buildApp(), "/me");

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Error interno del servidor" });
  });

  it("envía un rechazo de Prisma en turnos al middleware global", async () => {
    mocks.turnoFindFirst.mockRejectedValue(new Error("database unavailable"));

    const response = await request(buildApp(), "/turno");

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Error interno del servidor" });
  });
});
