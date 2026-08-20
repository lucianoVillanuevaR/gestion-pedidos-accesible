/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CierreTurno } from "../../../types";
import { getTurnosHistorial } from "../cocinaHistoryUtils";
import { HistorialTurnoCard } from "./CocinaHistorialTurnoCard";

const cierre: CierreTurno = {
  fechaCierre: "2026-06-23T22:00:00.000Z",
  fechaInicio: "2026-06-23T18:00:00.000Z",
  id: "turno-1",
  pedidos: [
    {
      createdAt: "2026-06-23T19:00:00.000Z",
      detalles: [
        {
          cantidad: 1,
          precioUnitario: 3900,
          productoId: 7,
          productoNombre: "Completo Italiano",
          subtotal: 3900
        }
      ],
      estado: "entregado",
      id: 101,
      metodoPago: "efectivo",
      total: 3900
    },
    {
      createdAt: "2026-06-23T20:00:00.000Z",
      detalles: [
        {
          cantidad: 1,
          precioUnitario: 5500,
          productoId: 8,
          productoNombre: "Arma tu sandwich",
          subtotal: 5500
        }
      ],
      estado: "entregado",
      id: 102,
      metodoPago: "tarjeta",
      total: 5500
    }
  ],
  pedidosCancelados: 0,
  pedidosEntregados: 2,
  pedidosPendientes: 0,
  productosVendidos: [],
  totalEfectivo: 3900,
  totalPedidos: 2,
  totalPendiente: 0,
  totalTarjeta: 5500,
  totalTransferencia: 0,
  totalVendido: 9400,
  usuarioId: "cajero"
};

describe("HistorialTurnoCard", () => {
  afterEach(cleanup);

  it("imprime el turno original completo aunque la tarjeta muestre pedidos filtrados", () => {
    const [printTurno] = getTurnosHistorial([cierre]);
    const turnoFiltrado = { ...printTurno, pedidos: [printTurno.pedidos[0]] };
    const { container } = render(
      <HistorialTurnoCard
        isExpanded={false}
        isHighContrast={false}
        isPrintTarget
        onOpenModal={vi.fn()}
        onPrint={vi.fn()}
        onReadAction={vi.fn()}
        onToggle={vi.fn()}
        printTurno={printTurno}
        selectedView="resumen"
        turno={turnoFiltrado}
      />
    );

    const reporte = container.querySelector(".cierre-turno-print");

    expect(reporte).not.toBeNull();
    expect(reporte?.textContent).toContain("#101");
    expect(reporte?.textContent).toContain("#102");
    expect(reporte?.textContent).toContain("Arma tu sandwich");
    expect(reporte?.textContent).toContain("$9.400");
  });

  it("muestra un único resumen compacto y conserva sus tres acciones", () => {
    const [turno] = getTurnosHistorial([cierre]);
    const onPrint = vi.fn();
    const onToggle = vi.fn();
    render(
      <HistorialTurnoCard
        isExpanded={false}
        isHighContrast={false}
        isPrintTarget={false}
        onOpenModal={vi.fn()}
        onPrint={onPrint}
        onReadAction={vi.fn()}
        onToggle={onToggle}
        printTurno={turno}
        selectedView="resumen"
        turno={turno}
      />
    );

    expect(screen.getByText("2 pedidos · 2 entregados · 0 pendientes · 0 cancelados")).toBeTruthy();
    expect(screen.queryByText("Pedidos entregados")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Resumen" }));
    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));
    fireEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(onToggle).toHaveBeenNthCalledWith(1, "resumen");
    expect(onToggle).toHaveBeenNthCalledWith(2, "pedidos");
    expect(onPrint).toHaveBeenCalledWith(turno.id);
  });
});
