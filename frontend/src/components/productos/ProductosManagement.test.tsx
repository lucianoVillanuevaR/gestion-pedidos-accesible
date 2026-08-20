// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AccessibilityProvider } from "../../contexts/AccessibilityContext";
import type { CategoriaCatalogo } from "../../pages/productos/ProductosShared";
import type { ProductoConCategoria } from "../../utils/pdv";
import { CategoriaDeleteModal } from "./CategoriaModals";
import { ProductoFormModal } from "./ProductoFormModal";
import { CategoriaBlock, type CategoriaGrupo } from "./ProductosCatalog";
import { ProductosToolbar } from "./ProductosToolbar";

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

afterEach(() => cleanup());

const producto: ProductoConCategoria = {
  categoria: "Completos",
  disponible: true,
  id: 1,
  nombre: "Completo Italiano",
  precio: 3900
};

const completos: CategoriaGrupo = {
  activa: true,
  id: 2,
  label: "Completos",
  productos: [producto],
  value: "Completos"
};

const categorias = [
  { activa: null, label: "Destacados", value: "Destacados" as const },
  { activa: true, label: "Completos", value: "Completos" as const },
  { activa: true, label: "Otros", value: "Otros" as const }
];

describe("acciones de gestión de productos", () => {
  it("muestra las acciones globales claras sin eliminar categoría", () => {
    const onCreateProduct = vi.fn();
    render(
      <ProductosToolbar
        activeCategory="Completos"
        grupos={[completos]}
        isLoading={false}
        onCreateCategory={vi.fn()}
        onCreateProduct={onCreateProduct}
        onRefresh={vi.fn()}
        onSearchChange={vi.fn()}
        onSelectCategory={vi.fn()}
        searchTerm=""
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Nuevo producto" }));
    expect(onCreateProduct).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Nueva categoría" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Eliminar categoría" })).toBeNull();
  });

  it("abre las opciones de la categoría correcta y solicita eliminarla", () => {
    const onDeleteCategory = vi.fn();
    render(
      <CategoriaBlock
        grupo={completos}
        isExpanded
        onAddProduct={vi.fn()}
        onDeleteCategory={onDeleteCategory}
        onEditProduct={vi.fn()}
        onToggle={vi.fn()}
        onToggleCategory={vi.fn()}
        onToggleAvailability={vi.fn()}
        updatingProductoId={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Opciones de categoría Completos" }));
    expect(screen.getByRole("button", { name: "Ocultar categoría Completos" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Eliminar categoría" }));
    expect(onDeleteCategory).toHaveBeenCalledOnce();
  });

  it("permite ocultar una categoría base y explica por qué no puede eliminarse", () => {
    const onToggleCategory = vi.fn();
    render(
      <CategoriaBlock
        deleteCategoryDisabledReason="Las categorías base del sistema no se pueden eliminar"
        grupo={completos}
        isExpanded={false}
        onAddProduct={vi.fn()}
        onEditProduct={vi.fn()}
        onToggle={vi.fn()}
        onToggleAvailability={vi.fn()}
        onToggleCategory={onToggleCategory}
        updatingProductoId={null}
      />
    );

    const categorySection = screen.getByRole("button", { name: "Opciones de categoría Completos" }).closest("section");
    expect(categorySection?.className).toContain("overflow-hidden");

    fireEvent.click(screen.getByRole("button", { name: "Opciones de categoría Completos" }));
    expect(categorySection?.className).toContain("overflow-visible");
    expect(
      screen
        .getByRole("button", {
          name: "Eliminar categoría no disponible: Las categorías base del sistema no se pueden eliminar"
        })
        .hasAttribute("disabled")
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Ocultar categoría Completos" }));
    expect(onToggleCategory).toHaveBeenCalledOnce();
  });

  it("cierra el menú de categoría al tocar fuera", () => {
    render(
      <div>
        <CategoriaBlock
          grupo={completos}
          isExpanded={false}
          onAddProduct={vi.fn()}
          onEditProduct={vi.fn()}
          onToggle={vi.fn()}
          onToggleAvailability={vi.fn()}
          onToggleCategory={vi.fn()}
          updatingProductoId={null}
        />
        <button type="button">Fuera del menú</button>
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Opciones de categoría Completos" }));
    expect(screen.getByRole("button", { name: "Ocultar categoría Completos" })).toBeTruthy();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Fuera del menú" }));
    expect(screen.queryByRole("button", { name: "Ocultar categoría Completos" })).toBeNull();
  });

  it("identifica una categoría oculta y permite mostrarla", () => {
    const onToggleCategory = vi.fn();
    render(
      <CategoriaBlock
        grupo={{ ...completos, activa: false }}
        isExpanded
        onAddProduct={vi.fn()}
        onEditProduct={vi.fn()}
        onToggle={vi.fn()}
        onToggleAvailability={vi.fn()}
        onToggleCategory={onToggleCategory}
        updatingProductoId={null}
      />
    );

    expect(screen.getByText("Oculta")).toBeTruthy();
    expect(screen.getByText("No visible en PDV mientras la categoría esté oculta.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Agregar producto en Completos" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Opciones de categoría Completos" }));
    fireEvent.click(screen.getByRole("button", { name: "Mostrar categoría Completos" }));
    expect(onToggleCategory).toHaveBeenCalledOnce();
  });

  it("permite ocultar Destacados y mantiene su eliminación bloqueada", () => {
    const onToggleCategory = vi.fn();
    render(
      <CategoriaBlock
        deleteCategoryDisabledReason="Destacados es una vista del sistema y no se puede eliminar"
        grupo={{ ...completos, label: "Destacados", value: "Destacados" }}
        isExpanded={false}
        onAddProduct={vi.fn()}
        onEditProduct={vi.fn()}
        onToggle={vi.fn()}
        onToggleCategory={onToggleCategory}
        onToggleAvailability={vi.fn()}
        updatingProductoId={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Opciones de categoría Destacados" }));
    fireEvent.click(screen.getByRole("button", { name: "Ocultar categoría Destacados" }));
    expect(onToggleCategory).toHaveBeenCalledOnce();
  });

  it("mantiene labels explícitos para editar y ocultar productos", () => {
    render(
      <CategoriaBlock
        grupo={completos}
        isExpanded
        onAddProduct={vi.fn()}
        onEditProduct={vi.fn()}
        onToggle={vi.fn()}
        onToggleAvailability={vi.fn()}
        updatingProductoId={null}
      />
    );

    expect(screen.getByRole("button", { name: "Editar producto Completo Italiano" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ocultar producto Completo Italiano" })).toBeTruthy();
  });
});

describe("modal contextual de categoría", () => {
  it("confirma la categoría específica y ejecuta su eliminación", () => {
    const onSubmit = vi.fn();
    render(
      <CategoriaDeleteModal
        categoria={{ activa: true, id: 9, label: "Bebidas frías", productosCount: 0, value: "Bebidas frías" }}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByRole("heading", { name: '¿Eliminar categoría "Bebidas frías"?' })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Eliminar categoría" }));
    expect(onSubmit).toHaveBeenCalledWith("Bebidas frías");
  });

  it("respeta el bloqueo de categorías con productos", () => {
    render(
      <CategoriaDeleteModal
        categoria={{ activa: true, id: 9, label: "Bebidas frías", productosCount: 2, value: "Bebidas frías" }}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Eliminar categoría" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("alert").textContent).toContain("contiene 2 productos");
  });
});

describe("formulario compartido de producto", () => {
  const renderProductModal = (defaultCategory: CategoriaCatalogo) =>
    render(
      <AccessibilityProvider>
        <ProductoFormModal
          availableProductos={[]}
          categoriasCatalogo={categorias}
          defaultCategory={defaultCategory}
          isSaving={false}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      </AccessibilityProvider>
    );

  it("permite selección manual en el alta global", () => {
    renderProductModal("Otros");
    const select = screen.getByRole("combobox", { name: "Categoría" }) as HTMLSelectElement;

    expect(select.value).toBe("Otros");
    fireEvent.change(select, { target: { value: "Completos" } });
    expect(select.value).toBe("Completos");
  });

  it("preselecciona la categoría contextual sin bloquear el selector", () => {
    renderProductModal("Completos");
    const select = screen.getByRole("combobox", { name: "Categoría" }) as HTMLSelectElement;

    expect(select.value).toBe("Completos");
    expect(select.hasAttribute("disabled")).toBe(false);
  });
});

describe("acordeones independientes", () => {
  function CatalogHarness() {
    const [expanded, setExpanded] = useState<Set<CategoriaCatalogo>>(new Set());
    const grupos: CategoriaGrupo[] = [
      { ...completos, productos: [] },
      { activa: true, label: "Sandwich", productos: [], value: "Sandwich" }
    ];

    return (
      <>
        {grupos.map((grupo) => (
          <CategoriaBlock
            key={grupo.value}
            grupo={grupo}
            isExpanded={expanded.has(grupo.value)}
            onAddProduct={vi.fn()}
            onEditProduct={vi.fn()}
            onToggle={() =>
              setExpanded((current) => {
                const next = new Set(current);
                if (next.has(grupo.value)) next.delete(grupo.value);
                else next.add(grupo.value);
                return next;
              })
            }
            onToggleAvailability={vi.fn()}
            updatingProductoId={null}
          />
        ))}
      </>
    );
  }

  it("permite mantener varias categorías abiertas", () => {
    render(<CatalogHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir Completos" }));
    fireEvent.click(screen.getByRole("button", { name: "Abrir Sandwich" }));

    expect(screen.getByRole("button", { name: "Cerrar Completos" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cerrar Sandwich" })).toBeTruthy();
  });
});
