// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PedidoResponse } from "../../../types";
import { CocinaNormalView, type CocinaViewProps } from "./CocinaBoardViews";

const pedidoPendiente: PedidoResponse = {
  createdAt: new Date().toISOString(),
  detalles: [],
  estado: "pendiente",
  id: 1,
  metodoPago: "efectivo",
  total: "3500"
};

function renderNormalView(overrides: Partial<CocinaViewProps> = {}) {
  const props: CocinaViewProps = {
    activeModal: null,
    counts: { enPreparacion: 0, entregados: 0, listos: 0, pendientes: 1, total: 1 },
    error: null,
    isAutoRefreshEnabled: true,
    isFullscreen: false,
    isHighContrast: false,
    isLoading: false,
    onAdvanceVisible: vi.fn(),
    onAutoRefreshToggle: vi.fn(),
    onEstadoChange: vi.fn(),
    onFullscreenToggle: vi.fn(),
    onOpenModal: vi.fn(),
    onRefresh: vi.fn(),
    pedidos: [pedidoPendiente],
    updatingPedidoId: null,
    urgentCount: 1,
    ...overrides
  };

  render(<CocinaNormalView {...props} />);
  return props;
}

describe("vista normal de preparación", () => {
  afterEach(cleanup);

  it("muestra una sola indicación de actualización automática y conserva el control", () => {
    const props = renderNormalView();

    expect(screen.getAllByText("Actualización automática activa")).toHaveLength(1);
    expect(screen.queryByText("Los tickets nuevos entran solos a cocina.")).toBeNull();
    const toggle = screen.getByRole("button", { name: "Actualización automática activa" });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(toggle);
    expect(props.onAutoRefreshToggle).toHaveBeenCalledOnce();
  });

  it("aclara la acción masiva sin cambiar su callback", () => {
    const props = renderNormalView();

    fireEvent.click(screen.getByRole("button", { name: "Avanzar todos" }));
    expect(props.onAdvanceVisible).toHaveBeenCalledOnce();
    expect(screen.queryByText("Marcar todas")).toBeNull();
  });

  it("explica el criterio urgente y conserva actualización y pantalla completa", () => {
    const props = renderNormalView();

    expect(screen.getByText("Urgentes")).toBeTruthy();
    expect(screen.getByText("Más de 20 min")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Actualizar preparación" }));
    fireEvent.click(screen.getByRole("button", { name: "Pantalla completa" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle del pedido 1" }));
    expect(props.onRefresh).toHaveBeenCalledOnce();
    expect(props.onFullscreenToggle).toHaveBeenCalledOnce();
    expect(props.onOpenModal).toHaveBeenCalledWith({ action: "detail", pedido: pedidoPendiente });
  });

  it("anuncia la salida cuando ya está en pantalla completa", () => {
    renderNormalView({ isFullscreen: true });

    expect(screen.getByRole("button", { name: "Salir de pantalla completa" })).toBeTruthy();
  });
});
