// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CierreTurnoFacilContent } from "./CierreTurnoPage";

const summary = {
  pedidosCancelados: 2,
  pedidosEntregados: 5,
  pedidosPendientes: 1,
  totalEfectivo: 8000,
  totalPedidos: 8,
  totalPendiente: 2500,
  totalTarjeta: 3000,
  totalTransferencia: 800,
  totalVendido: 11800
};

const pedidos = [
  {
    createdAt: "2026-08-19T18:42:00.000Z",
    detalles: [],
    estado: "entregado" as const,
    id: 6,
    metodoPago: "efectivo" as const,
    numeroTurno: 6,
    total: 11800
  }
];

function renderContent(isTurnoOpen: boolean) {
  const onAbrirTurno = vi.fn();
  const onCerrarTurno = vi.fn();

  render(
    <CierreTurnoFacilContent
      hasPedidosPendientes
      isHighContrast={false}
      isTurnoOpen={isTurnoOpen}
      onAbrirTurno={onAbrirTurno}
      onCerrarTurno={onCerrarTurno}
      panelClass="border border-slate-200 bg-white"
      pedidos={pedidos}
      productosVendidos={[{ cantidad: 3, productoId: 1, productoNombre: "Completo", total: 11800 }]}
      summary={summary}
    />
  );

  return { onAbrirTurno, onCerrarTurno };
}

describe("resumen de cierre de turno en modo fácil", () => {
  afterEach(cleanup);

  it("muestra el estado cerrado y permite abrir el turno", () => {
    const { onAbrirTurno } = renderContent(false);

    expect(screen.getByText("Turno cerrado")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Abrir turno" }));
    expect(onAbrirTurno).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Cerrar turno" })).toBeNull();
  });

  it("muestra el estado abierto y deja el cierre como acción final", () => {
    const { onCerrarTurno } = renderContent(true);

    expect(screen.getByText("Turno abierto")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Abrir turno" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar turno" }));
    expect(onCerrarTurno).toHaveBeenCalledOnce();
  });

  it("conserva las cuatro métricas calculadas", () => {
    renderContent(true);

    expect(screen.getByText("Total vendido")).toBeTruthy();
    expect(screen.getByText("$11.800")).toBeTruthy();
    expect(screen.getByText("Pedidos entregados").nextElementSibling?.textContent).toBe("5");
    expect(screen.getByText("Pedidos pendientes").nextElementSibling?.textContent).toBe("1");
    expect(screen.getByText("Cancelados").nextElementSibling?.textContent).toBe("2");
  });

  it.each([
    ["Métodos de pago", "Efectivo"],
    ["Productos vendidos", "Resumen por producto entregado."],
    ["Pedidos del turno", "#6"]
  ])("abre y cierra el acordeón %s actualizando aria-expanded", (buttonName, content) => {
    renderContent(true);
    const button = screen.getByRole("button", { name: buttonName });

    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText(content)).toBeNull();
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(content)).toBeTruthy();
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText(content)).toBeNull();
  });
});
