// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminUser } from "../../types";
import { createUsuario, getUsuarios, updateUsuario } from "../../services/usuarios";
import AdminPage from "./AdminPage";

const feedbackMocks = vi.hoisted(() => ({
  error: vi.fn(),
  speak: vi.fn(),
  success: vi.fn()
}));

vi.mock("../../contexts/AccessibilityContext", () => ({
  useAccessibilityContext: () => ({
    isSoundEnabled: true,
    isVoiceEnabled: true,
    soundVolume: "normal"
  })
}));
vi.mock("../../hooks/useSoundFeedback", () => ({
  useSoundFeedback: () => ({ error: feedbackMocks.error, success: feedbackMocks.success })
}));
vi.mock("../../hooks/useVoice", () => ({
  default: () => ({ speak: feedbackMocks.speak })
}));
vi.mock("../../services/usuarios", () => ({
  createUsuario: vi.fn(),
  getUsuarios: vi.fn(),
  updateUsuario: vi.fn()
}));

const usuario: AdminUser = {
  id: 7,
  activo: true,
  email: "ana@example.com",
  label: "Ana",
  role: "cajero",
  username: "ana"
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

async function renderUsers(users: AdminUser[] = []) {
  vi.mocked(getUsuarios).mockResolvedValue(users);
  render(<AdminPage mode="usuarios" />);
  await screen.findByText(
    new RegExp(`^${users.length} usuarios · ${users.filter((item) => item.activo).length} activos`)
  );
}

async function fillCreateForm() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Agregar usuario" }));
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cerrar" }));
  await user.type(screen.getByLabelText("Nombre"), "Bea");
  await user.type(screen.getByLabelText("Nombre de usuario"), "bea");
  await user.type(screen.getByLabelText("Correo electrónico"), "bea@example.com");
  await user.type(screen.getByLabelText("Contraseña"), "12345678");
  return user;
}

describe("gestión de usuarios", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("crea un usuario con feedback específico y semántica modal", async () => {
    await renderUsers();
    vi.mocked(createUsuario).mockResolvedValue({ ...usuario, label: "Bea", username: "bea", id: 8 });
    const user = await fillCreateForm();

    const dialog = screen.getByRole("dialog", { name: "Crear usuario" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.parentElement?.className).toContain("!mt-0");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Usuario creado correctamente.")).toBeTruthy();
    expect(feedbackMocks.success).toHaveBeenCalledOnce();
    expect(feedbackMocks.speak).toHaveBeenCalledWith("Usuario creado correctamente.", expect.any(Object));
  });

  it("diferencia la actualización de un usuario", async () => {
    await renderUsers([usuario]);
    vi.mocked(updateUsuario).mockResolvedValue({ ...usuario, label: "Ana actualizada" });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.clear(screen.getByLabelText("Nombre"));
    await user.type(screen.getByLabelText("Nombre"), "Ana actualizada");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Usuario actualizado correctamente.")).toBeTruthy();
    expect(feedbackMocks.speak).toHaveBeenCalledWith("Usuario actualizado correctamente.", expect.any(Object));
  });

  it("marca el formulario ocupado y bloquea el doble submit", async () => {
    await renderUsers();
    const pending = deferred<AdminUser>();
    vi.mocked(createUsuario).mockReturnValue(pending.promise);
    await fillCreateForm();
    const dialog = screen.getByRole("dialog", { name: "Crear usuario" });

    fireEvent.submit(dialog);
    fireEvent.submit(dialog);

    expect(createUsuario).toHaveBeenCalledOnce();
    await waitFor(() => expect(dialog.getAttribute("aria-busy")).toBe("true"));
    expect((screen.getByRole("button", { name: "Guardando..." }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Cerrar" }) as HTMLButtonElement).disabled).toBe(true);

    pending.resolve({ ...usuario, id: 8 });
    await screen.findByText("Usuario creado correctamente.");
  });

  it("mantiene abierto el modal y conserva los datos cuando falla el guardado", async () => {
    await renderUsers();
    vi.mocked(createUsuario).mockRejectedValue(new Error("El correo electrónico ya está registrado."));
    const user = await fillCreateForm();
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect((await screen.findByRole("alert")).textContent).toContain("El correo electrónico ya está registrado.");
    expect(screen.getByRole("dialog", { name: "Crear usuario" })).toBeTruthy();
    expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Bea");
    expect(feedbackMocks.error).toHaveBeenCalledOnce();
    expect(feedbackMocks.speak).toHaveBeenCalledWith("No se pudo guardar el usuario.", expect.any(Object));
  });

  it("informa al desactivar y volver a activar un usuario", async () => {
    await renderUsers([usuario]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(updateUsuario)
      .mockResolvedValueOnce({ ...usuario, activo: false })
      .mockResolvedValueOnce({ ...usuario, activo: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Desactivar" }));
    expect(await screen.findByText("Usuario desactivado correctamente.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Activar" }));
    expect(await screen.findByText("Usuario activado correctamente.")).toBeTruthy();
    expect(feedbackMocks.success).toHaveBeenCalledTimes(2);
  });
});
