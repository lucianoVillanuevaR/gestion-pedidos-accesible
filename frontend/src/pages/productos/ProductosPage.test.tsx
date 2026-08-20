// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessibilityProvider } from "../../contexts/AccessibilityContext";

const categoryApi = vi.hoisted(() => ({
  createCategoria: vi.fn(),
  deleteCategoria: vi.fn(),
  getCategorias: vi.fn(),
  updateCategoriaActiva: vi.fn()
}));

const productApi = vi.hoisted(() => ({
  createProducto: vi.fn(),
  deleteProductImage: vi.fn(),
  deleteProducto: vi.fn(),
  getProductos: vi.fn(),
  updateProducto: vi.fn(),
  uploadProductImage: vi.fn()
}));

vi.mock("../../services/categorias", () => categoryApi);
vi.mock("../../services/productos", () => productApi);

import ProductosPage from "./ProductosPage";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn()
    }))
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  categoryApi.deleteCategoria.mockResolvedValue(undefined);
  categoryApi.getCategorias.mockResolvedValue([{ activa: true, id: 9, nombre: "Colaciones" }]);
  productApi.getProductos.mockResolvedValue([]);
});

afterEach(() => cleanup());

describe("eliminación de categorías desde ProductosPage", () => {
  it("elimina una categoría personalizada vacía, la retira y muestra confirmación", async () => {
    render(
      <AccessibilityProvider>
        <ProductosPage />
      </AccessibilityProvider>
    );

    const optionsButton = await screen.findByRole("button", { name: "Opciones de categoría Colaciones" });
    fireEvent.click(optionsButton);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar categoría" }));
    expect(screen.getByRole("heading", { name: '¿Eliminar categoría "Colaciones"?' })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar categoría" }));

    await waitFor(() => expect(categoryApi.deleteCategoria).toHaveBeenCalledWith(9));
    expect(await screen.findByText("Categoría eliminada. Colaciones.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Opciones de categoría Colaciones" })).toBeNull();
  });
});
