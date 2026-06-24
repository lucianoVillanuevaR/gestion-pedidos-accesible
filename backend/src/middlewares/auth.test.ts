import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/prisma", () => ({
  default: { usuario: { findUnique: vi.fn() } }
}));

vi.mock("../config/env", () => ({ env: { jwtSecret: "test-secret" } }));

import prisma from "../config/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "./auth";

function responseStub() {
  const response = {
    json: vi.fn(),
    status: vi.fn()
  };
  response.status.mockReturnValue(response);
  return response;
}

describe("middleware de autenticación", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rechaza requests sin token", async () => {
    const response = responseStub();
    const next = vi.fn();

    await requireAuth({ header: vi.fn() } as never, response as never, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("revalida usuario activo y rol contra la base de datos", async () => {
    const token = jwt.sign({ role: "cocina", username: "antiguo" }, "test-secret", { subject: "7" });
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      activo: true,
      id: 7,
      role: "admin",
      username: "actual"
    } as never);
    const request = { header: vi.fn().mockReturnValue(`Bearer ${token}`) } as unknown as AuthenticatedRequest;
    const next = vi.fn();

    await requireAuth(request, responseStub() as never, next);

    expect(request.authUser).toEqual({ id: 7, role: "admin", username: "actual" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("rechaza un usuario desactivado aunque su token sea válido", async () => {
    const token = jwt.sign({}, "test-secret", { subject: "7" });
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({ activo: false } as never);
    const response = responseStub();

    await requireAuth({ header: vi.fn().mockReturnValue(`Bearer ${token}`) } as never, response as never, vi.fn());

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Usuario no disponible" });
  });

  it("aplica roles usando el usuario autenticado", () => {
    const response = responseStub();
    const next = vi.fn();

    requireRole("admin")({ authUser: { id: 1, role: "cajero", username: "caja" } } as never, response as never, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
