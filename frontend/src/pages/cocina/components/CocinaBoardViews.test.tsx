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
    isFullscreen: false,
    isHighContrast: false,
    isLoading: false,
    onAdvanceVisible: vi.fn(),
    onEstadoChange: vi.fn(),
    onFullscreenToggle: vi.fn(),
    onOpenModal: vi.fn(),
    onRefresh: vi.fn(),
    pedidos: [pedidoPendiente],
    role: "cocina",
    updatingPedidoId: null,
    urgentCount: 1,
    ...overrides
  };

  render(<CocinaNormalView {...props} />);
  return props;
}

describe("vista normal de preparación", () => {
  afterEach(cleanup);

  it("oculta el control de actualización automática y conserva los controles manuales", () => {
    renderNormalView();

    expect(screen.queryByText("Actualización automática activa")).toBeNull();
    expect(screen.queryByRole("button", { name: "Actualización automática activa" })).toBeNull();
    expect(screen.getByRole("button", { name: "Actualizar preparación" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pantalla completa" })).toBeTruthy();
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

  it("mantiene la vista de cocina en solo lectura para administración", () => {
    renderNormalView({ role: "admin" });

    expect(screen.queryByRole("button", { name: "Avanzar todos" })).toBeNull();
    expect(screen.queryByRole("button", { name: "En preparación" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Listo" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Entregar" })).toBeNull();
  });
});
