// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CierrePedidoResumen } from "../../types";
import { paginatePedidosTurno, PedidosTurnoPanel } from "./CierreTurnoPage";

function makePedidos(total: number): CierrePedidoResumen[] {
  return Array.from({ length: total }, (_, index) => {
    const numero = index + 1;

    return {
      createdAt: new Date(Date.UTC(2026, 7, 19, 18, numero)).toISOString(),
      detalles: [],
      estado: "entregado",
      id: numero,
      metodoPago: "efectivo",
      numeroTurno: numero,
      total: numero * 1000,
    };
  });
}

describe("paginación de pedidos del turno", () => {
  afterEach(cleanup);

  it("muestra 10 pedidos recientes en la primera página y 7 en la segunda", () => {
    render(<PedidosTurnoPanel panelClass="border" pedidos={makePedidos(17)} />);

    expect(screen.getByLabelText("Página 1 de 2")).toBeTruthy();
    expect(screen.getAllByText("17 pedidos").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Mostrando 1–10 de 17 pedidos")).toBeTruthy();
    expect(screen.getByText("#17")).toBeTruthy();
    expect(screen.queryByText("#7")).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Ir a la página anterior" })
        .hasAttribute("disabled"),
    ).toBe(true);

    fireEvent.click(
      screen.getByRole("button", { name: "Ir a la página siguiente" }),
    );

    expect(screen.getByLabelText("Página 2 de 2")).toBeTruthy();
    expect(screen.getByText("Mostrando 11–17 de 17 pedidos")).toBeTruthy();
    expect(screen.getByText("#7")).toBeTruthy();
    expect(screen.queryByText("#17")).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Ir a la página siguiente" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("ajusta la página seleccionada cuando se reduce la lista", () => {
    const view = render(
      <PedidosTurnoPanel panelClass="border" pedidos={makePedidos(17)} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Ir a la página siguiente" }),
    );
    expect(screen.getByLabelText("Página 2 de 2")).toBeTruthy();

    view.rerender(
      <PedidosTurnoPanel panelClass="border" pedidos={makePedidos(7)} />,
    );

    expect(screen.getByLabelText("Página 1 de 1")).toBeTruthy();
    expect(screen.getByText("Mostrando 1–7 de 7 pedidos")).toBeTruthy();
    expect(screen.getByText("#7")).toBeTruthy();
  });

  it("mantiene el estado vacío sin controles de paginación", () => {
    render(<PedidosTurnoPanel panelClass="border" pedidos={[]} />);

    expect(
      screen.getByText("No hay pedidos registrados para el turno actual."),
    ).toBeTruthy();
    expect(screen.getByText("0 pedidos")).toBeTruthy();
    expect(
      screen.queryByRole("navigation", {
        name: "Paginación de pedidos del turno",
      }),
    ).toBeNull();
  });

  it("ordena del más reciente al más antiguo sin mutar la lista original", () => {
    const pedidos = makePedidos(3).reverse();
    const originalOrder = pedidos.map((pedido) => pedido.id);
    const pagination = paginatePedidosTurno(pedidos, 1);

    expect(pagination.items.map((pedido) => pedido.id)).toEqual([3, 2, 1]);
    expect(pedidos.map((pedido) => pedido.id)).toEqual(originalOrder);
  });
});
