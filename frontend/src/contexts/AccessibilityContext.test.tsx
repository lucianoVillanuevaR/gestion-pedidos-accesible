// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESSIBILITY_MODE_STORAGE_KEY } from "../constants/accessibility";
import { AccessibilityProvider, useAccessibilityContext } from "./AccessibilityContext";

function ContextProbe() {
  const navigate = useNavigate();
  const { isAccessible } = useAccessibilityContext();

  return (
    <>
      <output aria-label="modo fácil efectivo">{String(isAccessible)}</output>
      <button type="button" onClick={() => navigate("/admin")}>
        Admin
      </button>
      <button type="button" onClick={() => navigate("/pdv")}>
        PDV
      </button>
      <button type="button" onClick={() => navigate("/pdv/facil")}>
        PDV fácil
      </button>
    </>
  );
}

describe("AccessibilityContext por ruta", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(ACCESSIBILITY_MODE_STORAGE_KEY, "true");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    });
  });

  afterEach(cleanup);

  it("aplica modo fácil solo en rutas fáciles sin borrar la preferencia", () => {
    render(
      <MemoryRouter initialEntries={["/pdv/facil"]}>
        <AccessibilityProvider>
          <ContextProbe />
        </AccessibilityProvider>
      </MemoryRouter>
    );

    expect(screen.getByLabelText("modo fácil efectivo").textContent).toBe("true");

    act(() => screen.getByRole("button", { name: "Admin" }).click());
    expect(screen.getByLabelText("modo fácil efectivo").textContent).toBe("false");
    expect(window.localStorage.getItem(ACCESSIBILITY_MODE_STORAGE_KEY)).toBe("true");

    act(() => screen.getByRole("button", { name: "PDV" }).click());
    expect(screen.getByLabelText("modo fácil efectivo").textContent).toBe("false");

    act(() => screen.getByRole("button", { name: "PDV fácil" }).click());
    expect(screen.getByLabelText("modo fácil efectivo").textContent).toBe("true");
  });
});
