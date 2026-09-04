// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Login from "./Login";

const login = vi.fn();

vi.mock("../contexts/AuthContext", () => ({
  useAuthContext: () => ({ login })
}));
vi.mock("../contexts/AccessibilityContext", () => ({
  useAccessibilityContext: () => ({
    isAccessible: false,
    isHighContrast: false,
    isPanelOpen: false,
    isVoiceEnabled: false,
    isSoundEnabled: false,
    soundVolume: "soft",
    openAccessibilityPanel: vi.fn()
  })
}));
vi.mock("../hooks/useVoice", () => ({ default: () => ({ speak: vi.fn() }) }));
vi.mock("../hooks/useSoundFeedback", () => ({
  useSoundFeedback: () => ({ error: vi.fn(), success: vi.fn() })
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

async function renderFilledLogin() {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
  await user.type(screen.getByLabelText("Usuario o correo"), "admin");
  await user.type(screen.getByLabelText("Contraseña", { exact: true }), "12345678");
  return user;
}

describe("Login", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("bloquea doble submit y presenta el estado de carga accesible", async () => {
    const pending = deferred<{ ok: false; message: string }>();
    login.mockReturnValue(pending.promise);
    const user = await renderFilledLogin();
    const button = screen.getByRole("button", { name: "Ingresar al sistema" });

    await user.dblClick(button);

    expect(login).toHaveBeenCalledOnce();
    expect(
      (
        screen.getByRole("button", {
          name: "Ingresando..."
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    expect(button.closest("form")?.getAttribute("aria-busy")).toBe("true");

    pending.resolve({ ok: false, message: "Credenciales inválidas" });
    expect(
      (
        (await screen.findByRole("button", {
          name: "Ingresar al sistema"
        })) as HTMLButtonElement
      ).disabled
    ).toBe(false);
  });

  it("vuelve a permitir un intento después de un fallo", async () => {
    login.mockResolvedValue({ ok: false, message: "Credenciales inválidas" });
    const user = await renderFilledLogin();
    const button = screen.getByRole("button", { name: "Ingresar al sistema" });

    await user.click(button);
    await user.click(button);

    expect(login).toHaveBeenCalledTimes(2);
  });
});
