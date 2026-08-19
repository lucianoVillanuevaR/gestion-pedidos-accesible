// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PdvViewProvider, type PdvViewContextValue } from "../PdvViewContext";
import PdvReceiptActions from "./PdvReceiptActions";

function buildContext(canPrintCurrentOrder: boolean): PdvViewContextValue {
  const noop = vi.fn();

  return {
    accessibleObservationPlaceholder: "",
    accessibleObservationType: "cocina",
    accessibleProductos: [],
    accessibleStep: 1,
    accessibleStepValidation: null,
    addProduct: noop,
    announceSearchBar: noop,
    bgWrapper: "",
    canPrintCurrentOrder,
    cancelEditingPedido: noop,
    cardBorder: "",
    categoryFilters: [],
    clienteNombre: "",
    decreaseProduct: noop,
    editingPedidoNumber: null,
    feedback: null,
    feedbackRef: createRef<HTMLDivElement>(),
    goNextAccessibleStep: noop,
    goPrevAccessibleStep: noop,
    handlePrint: noop,
    handlePrintKitchen: noop,
    handleReadPedidoSummary: noop,
    handleSubmit: noop,
    handleToggleTurno: noop,
    increaseProduct: noop,
    isAccessible: false,
    isEditingPedido: false,
    isHighContrast: false,
    isPanelOpen: false,
    isTurnoOpen: true,
    items: {},
    loadProductos: noop,
    loadingError: null,
    loadingProductos: false,
    metodoPago: "",
    navigate: noop,
    nextPedidoNumber: 1,
    observacion: "",
    openAccessibilityPanel: noop,
    openResetConfirm: noop,
    panelBg: "",
    pedidoDetalles: [],
    productosFiltrados: [],
    puedeRegistrar: false,
    quickActionButtonClass: "",
    quickActionIconButtonClass: "",
    removeProduct: noop,
    resetPedido: noop,
    searchTerm: "",
    selectedCategory: "Destacados",
    selectCategory: noop,
    selectMetodoPago: noop,
    sending: false,
    setAccessibleObservationType: noop,
    setAccessibleStep: noop,
    setClienteNombre: noop,
    setLoadingError: noop,
    setObservacion: noop,
    setSearchTerm: noop,
    setSelectedCategory: noop,
    setShowResetConfirm: noop,
    showResetConfirm: false,
    textColor: "",
    total: 0,
    totalItems: 0
  };
}

describe("PdvReceiptActions", () => {
  afterEach(cleanup);

  it("deshabilita la impresión cuando el pedido actual está vacío", () => {
    render(
      <PdvViewProvider value={buildContext(false)}>
        <PdvReceiptActions />
      </PdvViewProvider>
    );

    expect((screen.getByRole("button", { name: /Imprimir/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText(/Imprimir #/i)).toBeNull();
  });

  it("habilita ambos tickets únicamente para el pedido actual con productos", () => {
    render(
      <PdvViewProvider value={buildContext(true)}>
        <PdvReceiptActions />
      </PdvViewProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /Imprimir/i }));

    expect((screen.getByRole("button", { name: "Ticket de cocina" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: "Ticket de cliente" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
