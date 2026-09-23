// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { InventarioItem } from "../../types";
import { InventarioFacilRow } from "./InventarioPage";

const item: InventarioItem = {
  estado: "bajo_stock",
  imagenUrl: "/media/productos/completo-aleman.webp",
  productoDisponible: true,
  productoId: 1,
  productoNombre: "Completo Alemán",
  stockActual: 2,
  stockMinimo: 5
};

describe("fila de inventario fácil", () => {
  afterEach(cleanup);

  it("muestra una miniatura decorativa sin desplazar nombre, stock ni estado", () => {
    const { container } = render(<InventarioFacilRow item={item} isHighContrast={false} />);
    const image = container.querySelector("img");

    expect(image?.getAttribute("src")).toBe("/media/productos/completo-aleman.webp");
    expect(image?.getAttribute("alt")).toBe("");
    expect(image?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("Completo Alemán")).toBeTruthy();
    expect(screen.getByText("Stock: 2")).toBeTruthy();
    expect(screen.getByText("Poco stock")).toBeTruthy();
  });

  it("muestra un placeholder cuando el producto no tiene imagen", () => {
    const { container } = render(
      <InventarioFacilRow
        item={{ ...item, imagenUrl: null, productoNombre: "Producto sin fotografía" }}
        isHighContrast={false}
      />
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[aria-hidden='true'] svg")).toBeTruthy();
  });

  it("usa la foto local del catálogo cuando la API no entrega una URL", () => {
    const { container } = render(<InventarioFacilRow item={{ ...item, imagenUrl: null }} isHighContrast={false} />);
    const image = container.querySelector("img");

    expect(image).toBeTruthy();
    expect(decodeURIComponent(image?.getAttribute("src") ?? "")).toContain("Completo Aleman.webp");
  });

  it("reemplaza una imagen que falla por el placeholder", () => {
    const { container } = render(<InventarioFacilRow item={item} isHighContrast={false} />);
    const image = container.querySelector("img");

    expect(image).toBeTruthy();
    fireEvent.error(image as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[aria-hidden='true'] svg")).toBeTruthy();
  });

  it("conserva bordes visibles para la miniatura en contraste alto", () => {
    const { container } = render(<InventarioFacilRow item={item} isHighContrast />);

    expect(container.querySelector("article")?.className).toContain("contrast-panel");
    expect(container.querySelector("img")?.className).toContain("border-yellow-400");
  });
});
