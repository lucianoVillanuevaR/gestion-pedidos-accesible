// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PdvViewProvider, type PdvViewContextValue } from "../PdvViewContext";
import PdvCatalogPanel from "./PdvCatalogPanel";

function buildContext(overrides: Partial<PdvViewContextValue> = {}): PdvViewContextValue {
  return {
    addProduct: vi.fn(),
    announceSearchBar: vi.fn(),
    categoryFilters: [
      { label: "Todos", value: "Todos" },
      { label: "Ahorros exclusivos", value: "Ahorros exclusivos" }
    ],
    decreaseProduct: vi.fn(),
    feedback: null,
    feedbackRef: createRef<HTMLDivElement>(),
    increaseProduct: vi.fn(),
    isHighContrast: false,
    isTurnoOpen: true,
    items: {},
    loadingError: null,
    loadingProductos: false,
    productosFiltrados: [],
    searchTerm: "",
    selectedCategory: "Ahorros exclusivos",
    selectCategory: vi.fn(),
    setSearchTerm: vi.fn(),
    ...overrides
  } as PdvViewContextValue;
}

function renderPanel(context: PdvViewContextValue) {
  return render(
    <PdvViewProvider value={context}>
      <PdvCatalogPanel />
    </PdvViewProvider>
  );
}

describe("PdvCatalogPanel", () => {
  afterEach(cleanup);

  it("mantiene la selección semántica y muestra nombres largos en hasta dos líneas", () => {
    renderPanel(buildContext());

    const categoryNavigation = screen.getByRole("navigation", {
      name: "Categorías de productos"
    });
    const selectedButton = within(categoryNavigation).getByRole("button", {
      name: /Ahorros exclusivos/i
    });
    const label = within(selectedButton).getByText("Ahorros exclusivos");

    expect(selectedButton.getAttribute("aria-pressed")).toBe("true");
    expect(selectedButton.getAttribute("aria-current")).toBe("page");
    expect(selectedButton.className).toContain("bg-[#FECE00]");
    expect(label.className).toContain("line-clamp-2");
    expect(label.className).not.toContain("truncate");
  });

  it("conserva la acción de filtrado en toda la fila", () => {
    const selectCategory = vi.fn();
    renderPanel(buildContext({ selectCategory }));

    const categoryNavigation = screen.getByRole("navigation", {
      name: "Categorías de productos"
    });
    const allProductsButton = within(categoryNavigation).getByRole("button", {
      name: "Todos"
    });

    expect(allProductsButton.className).toContain("w-full");
    expect(allProductsButton.className).toContain("hover:bg-[#111827]");
    fireEvent.click(allProductsButton);
    expect(selectCategory).toHaveBeenCalledWith("Todos", "Todos");
  });

  it("usa los estados de alto contraste sin perder el estado seleccionado", () => {
    renderPanel(buildContext({ isHighContrast: true }));

    const categoryNavigation = screen.getByRole("navigation", {
      name: "Categorías de productos"
    });
    const selectedButton = within(categoryNavigation).getByRole("button", {
      name: /Ahorros exclusivos/i
    });
    const unselectedButton = within(categoryNavigation).getByRole("button", {
      name: "Todos"
    });

    expect(selectedButton.className).toContain("contrast-button-primary");
    expect(unselectedButton.className).toContain("contrast-button-secondary");
    expect(selectedButton.getAttribute("aria-pressed")).toBe("true");
    expect(unselectedButton.getAttribute("aria-pressed")).toBe("false");
  });
});
