// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InventarioItem } from "../../types";
import { InventarioRow } from "./InventarioPage";

const item: InventarioItem = {
  estado: "disponible",
  productoDisponible: true,
  productoId: 1,
  productoNombre: "Completo Alemán",
  stockActual: 30,
  stockMinimo: 10
};

function renderRow(draftValues = { stockActual: "30", stockMinimo: "10" }) {
  const onSave = vi.fn();
  const onStockChange = vi.fn();
  const onMinimumChange = vi.fn();
  const onDraftChange = vi.fn((_productoId: number, field: "stockActual" | "stockMinimo") =>
    field === "stockActual" ? onStockChange : onMinimumChange
  );

  const view = render(
    <InventarioRow
      draftValues={draftValues}
      isSaving={false}
      item={item}
      onDraftChange={onDraftChange}
      onSave={onSave}
    />
  );

  return { onMinimumChange, onSave, onStockChange, ...view };
}

describe("fila de inventario normal", () => {
  afterEach(cleanup);

  it("muestra Guardado deshabilitado cuando no existen cambios", () => {
    const { onSave } = renderRow();
    const button = screen.getByRole("button", { name: "Guardado" });

    expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.click(button);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("activa Guardar cambios cuando cambia stock", () => {
    const { onSave } = renderRow({ stockActual: "31", stockMinimo: "10" });
    const button = screen.getByRole("button", { name: "Guardar cambios" });

    expect(button.hasAttribute("disabled")).toBe(false);
    fireEvent.click(button);
    expect(onSave).toHaveBeenCalledWith(item);
  });

  it("activa Guardar cambios cuando cambia stock mínimo y conserva inputs accesibles", () => {
    renderRow({ stockActual: "30", stockMinimo: "11" });

    expect(screen.getByRole("button", { name: "Guardar cambios" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByLabelText("Stock de Completo Alemán")).toBeTruthy();
    expect(screen.getByLabelText("Stock mínimo de Completo Alemán")).toBeTruthy();
  });
});
