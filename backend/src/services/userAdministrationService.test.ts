import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  $executeRaw: vi.fn(),
  usuario: { findUnique: vi.fn(), count: vi.fn(), update: vi.fn() }
};
vi.mock("../config/prisma", () => ({ default: { $transaction: vi.fn((callback) => callback(tx)) } }));

import { updateUserSafely } from "./userAdministrationService";

describe("protección del último administrador", () => {
  beforeEach(() => vi.clearAllMocks());

  it("impide desactivar al único administrador activo", async () => {
    tx.usuario.findUnique.mockResolvedValue({ id: 1, role: "admin", activo: true });
    tx.usuario.count.mockResolvedValue(1);
    await expect(updateUserSafely(1, { activo: false })).rejects.toMatchObject({ statusCode: 409 });
    expect(tx.usuario.update).not.toHaveBeenCalled();
  });

  it("permite modificar un administrador cuando queda otro activo", async () => {
    tx.usuario.findUnique.mockResolvedValue({ id: 1, role: "admin", activo: true });
    tx.usuario.count.mockResolvedValue(2);
    tx.usuario.update.mockResolvedValue({ id: 1, role: "cajero", activo: true });
    await expect(updateUserSafely(1, { role: "cajero" })).resolves.toMatchObject({ role: "cajero" });
  });

  it("mantiene el funcionamiento habitual de usuarios normales", async () => {
    tx.usuario.findUnique.mockResolvedValue({ id: 2, role: "cajero", activo: true });
    tx.usuario.update.mockResolvedValue({ id: 2, role: "cajero", activo: false });
    await expect(updateUserSafely(2, { activo: false })).resolves.toMatchObject({ activo: false });
    expect(tx.usuario.count).not.toHaveBeenCalled();
  });
});
