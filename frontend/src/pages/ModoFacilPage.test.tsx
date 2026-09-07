// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessibilityProvider } from "../contexts/AccessibilityContext";
import ModoFacilPage from "./ModoFacilPage";

vi.mock("../hooks/useActionVoice", () => ({
  default: () => ({ speakAction: vi.fn() })
}));

describe("panel principal de Modo Fácil", () => {
  beforeEach(() => {
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

  it("dirige todas sus acciones a rutas fáciles", () => {
    render(
      <MemoryRouter initialEntries={["/modo-facil"]}>
        <AccessibilityProvider>
          <ModoFacilPage />
        </AccessibilityProvider>
      </MemoryRouter>
    );

    const expectedPaths = [
      "/pdv/facil",
      "/pedidos/facil",
      "/preparacion/facil",
      "/inventario/facil",
      "/historial-pedidos/facil",
      "/cierre-turno/facil"
    ];
    const actionLinks = screen.getAllByRole("link");

    expect(actionLinks.map((link) => link.getAttribute("href"))).toEqual(expectedPaths);
    expect(screen.getByRole("link", { name: "Ver pedidos recientes" }).getAttribute("href")).toBe(
      "/historial-pedidos/facil"
    );
  });
});
