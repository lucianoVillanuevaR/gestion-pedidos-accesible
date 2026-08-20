// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PedidoResponse } from "../../types";
import { NormalPedidoRow, PedidosActivosPanel, formatProductCount, getCreatedDateLabel } from "./PedidosNormalPage";
import { formatTime } from "./PedidosShared";

afterEach(cleanup);

function makePedido(cantidad: number, estado: PedidoResponse["estado"] = "entregado"): PedidoResponse {
  return {
    clienteNombre: "Sofía",
    createdAt: "2026-08-19T20:34:00.000Z",
    detalles: [
      {
        cantidad,
        id: 1,
        pedidoId: 3,
        precioUnitario: "7000",
        producto: { id: 7, nombre: "Completo Alemán", precio: 7000 },
        productoId: 7,
        subtotal: String(7000 * cantidad)
      }
    ],
    estado,
    id: 31,
    metodoPago: "transferencia",
    numeroTurno: 3,
    total: "14000"
  };
}

describe("fila normal de pedidos", () => {
  it.each([
    [1, "1 producto"],
    [2, "2 productos"]
  ])("pluraliza %i producto correctamente", (cantidad, expected) => {
    expect(formatProductCount(cantidad)).toBe(expected);
  });

  it("presenta Finalizado como estado no interactivo y mantiene Ver", () => {
    const onOpenModal = vi.fn();
    const pedido = makePedido(2);
    render(<NormalPedidoRow isUpdating={false} onEditPedido={vi.fn()} onOpenModal={onOpenModal} pedido={pedido} />);

    expect(screen.getByText("Finalizado")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Finalizado" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ver pedido #3" }));
    expect(onOpenModal).toHaveBeenCalledWith({ action: "detail", pedido });
  });

  it("conserva cliente, estado, total y método de pago", () => {
    const pedido = makePedido(1);
    render(<NormalPedidoRow isUpdating={false} onEditPedido={vi.fn()} onOpenModal={vi.fn()} pedido={pedido} />);

    expect(screen.getByText("Cliente: Sofía")).toBeTruthy();
    expect(screen.getByText("Entregado")).toBeTruthy();
    expect(screen.getByText("$14.000")).toBeTruthy();
    expect(screen.getByText("Transferencia")).toBeTruthy();
    expect(screen.getByText("1 producto")).toBeTruthy();
    expect(screen.getByText(/^Hace /)).toBeTruthy();
    expect(screen.getByText(formatTime(pedido.createdAt))).toBeTruthy();
  });

  it("omite el año actual y conserva un año anterior", () => {
    expect(getCreatedDateLabel("2026-08-19T20:34:00.000Z", 2026)).toBe("19 ago");
    expect(getCreatedDateLabel("2025-08-19T20:34:00.000Z", 2026)).toContain("2025");
  });
});

describe("cabecera y filtros de pedidos", () => {
  it("usa el título general y conserva filtros, búsqueda y actualización", () => {
    const setEstadoFilter = vi.fn();
    const setSearchTerm = vi.fn();
    const loadPedidos = vi.fn();
    render(
      <PedidosActivosPanel
        estadoFilter="todos"
        isHighContrast={false}
        isLoading={false}
        loadPedidos={loadPedidos}
        searchTerm=""
        setEstadoFilter={setEstadoFilter}
        setSearchTerm={setSearchTerm}
        summary={{
          entregados: 1,
          enPreparacion: 1,
          listos: 1,
          pendientes: 1,
          total: 5,
          totalPendiente: 0,
          totalVendido: 14000
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Pedidos" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Entregado/ }));
    expect(setEstadoFilter).toHaveBeenCalledWith("entregado");

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Sofía" } });
    expect(setSearchTerm).toHaveBeenCalledWith("Sofía");

    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(loadPedidos).toHaveBeenCalledOnce();
  });
});
