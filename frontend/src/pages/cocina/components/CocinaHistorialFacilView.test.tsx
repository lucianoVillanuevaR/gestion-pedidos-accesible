// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HistorialPedidoDetalle } from "../cocinaHistoryUtils";
import { HistorialFacilView } from "./CocinaHistorialFacilView";

vi.mock("../../../components/EasyModeActions", () => ({
  default: () => <nav aria-label="Acciones del modo fácil" />
}));

vi.mock("./CocinaHistorialPedidoModal", () => ({
  HistorialPedidoModal: () => null
}));

const makePedido = (index: number, estado: HistorialPedidoDetalle["estado"] = "entregado") => ({
  createdAt: new Date(2026, 7, 19, 20, index).toISOString(),
  detalles: [],
  estado,
  fechaCierre: new Date(2026, 7, 19, 22).toISOString(),
  id: index,
  metodoPago: "efectivo" as const,
  numeroTurno: index,
  total: 11800 + index,
  turnoId: `turno-${index}`
});

function renderView(pedidos: HistorialPedidoDetalle[], dateFilter: "all" | "today" | "week" = "all") {
  const onDateFilterChange = vi.fn();
  const onOpenPedido = vi.fn();

  render(
    <HistorialFacilView
      dateFilter={dateFilter}
      isHighContrast={false}
      liveMessage=""
      onDateFilterChange={onDateFilterChange}
      onOpenPedido={onOpenPedido}
      onReadAction={vi.fn()}
      onRefresh={vi.fn()}
      pedidos={pedidos}
      selectedPedido={null}
    />
  );

  return { onDateFilterChange, onOpenPedido };
}

describe("Pedidos recientes en modo fácil", () => {
  afterEach(cleanup);

  it("muestra 10 pedidos inicialmente y otros 10 al pedir ver más", () => {
    renderView(Array.from({ length: 15 }, (_, index) => makePedido(index + 1)));

    expect(screen.getAllByRole("article")).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Ver más pedidos" }));
    expect(screen.getAllByRole("article")).toHaveLength(15);
  });

  it("mantiene estado, total y apertura de detalle", () => {
    const pedido = makePedido(6, "cancelado");
    const { onOpenPedido } = renderView([pedido]);

    expect(screen.getByText("Cancelado")).toBeTruthy();
    expect(screen.getByLabelText(/Total \$/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle" }));
    expect(onOpenPedido).toHaveBeenCalledWith(pedido);
  });

  it("mantiene los valores internos de los filtros y presenta el vacío correspondiente", () => {
    const { onDateFilterChange } = renderView([], "week");

    expect(screen.getByText("No hay pedidos registrados esta semana.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Recientes" }));
    expect(onDateFilterChange).toHaveBeenCalledWith("all");
  });
});
