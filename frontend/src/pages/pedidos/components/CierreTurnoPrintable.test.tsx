// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import CierreTurnoPrintable, { formatTurnoDuration } from "./CierreTurnoPrintable";

afterEach(cleanup);

const emptySummary = {
  pedidosCancelados: 0,
  pedidosEntregados: 0,
  pedidosPendientes: 0,
  totalEfectivo: 0,
  totalPedidos: 0,
  totalPendiente: 0,
  totalTarjeta: 0,
  totalTransferencia: 0,
  totalVendido: 0
};

describe("CierreTurnoPrintable", () => {
  it.each([
    ["2026-08-16T22:15:00", "2026-08-16T22:45:00", "30 min"],
    ["2026-08-16T22:15:40", "2026-08-16T22:45:10", "30 min"],
    ["2026-08-16T22:15:00", "2026-08-16T23:15:00", "1 h"],
    ["2026-08-16T22:15:00", "2026-08-16T23:20:00", "1 h 5 min"],
    ["2026-08-16T23:30:00", "2026-08-17T00:30:00", "1 h"]
  ])("formatea la duración real entre %s y %s como %s", (start, end, expected) => {
    expect(formatTurnoDuration(start, end)).toBe(expected);
  });

  it.each([
    [undefined, "2026-08-16T22:45:00"],
    ["fecha-inválida", "2026-08-16T22:45:00"],
    ["2026-08-16T22:15:00", "fecha-inválida"],
    ["2026-08-16T22:45:00", "2026-08-16T22:15:00"]
  ])("muestra un valor seguro para una duración inválida", (start, end) => {
    expect(formatTurnoDuration(start, end)).toBe("—");
  });

  it("presenta correctamente un turno sin movimientos", () => {
    render(
      <CierreTurnoPrintable
        fechaCierre="2026-08-16T22:27:00.000Z"
        fechaInicio="2026-08-16T22:15:00.000Z"
        pedidos={[]}
        productosVendidos={[]}
        responsable={{ primaryLabel: "Responsable", primaryValue: "Cajero" }}
        summary={emptySummary}
      />
    );

    expect(screen.getByRole("heading", { name: "CIERRE DE TURNO" })).toBeTruthy();
    expect(screen.getByText("No se registraron productos vendidos durante este turno.")).toBeTruthy();
    expect(screen.getByText("No se registraron pedidos durante este turno.")).toBeTruthy();
    expect(screen.getByText("0 pedidos")).toBeTruthy();
    expect(screen.getAllByText("$0").length).toBeGreaterThanOrEqual(4);
  });

  it("calcula pedidos entregados por método y conserva estados y productos", () => {
    render(
      <CierreTurnoPrintable
        fechaCierre="2026-08-16T22:27:00.000Z"
        fechaInicio="2026-08-16T22:15:00.000Z"
        pedidos={[
          {
            clienteNombre: "Cliente con nombre suficientemente largo",
            createdAt: "2026-08-16T22:16:00.000Z",
            detalles: [
              {
                cantidad: 2,
                precioUnitario: 3500,
                productoId: 1,
                productoNombre: "Completo Hass Italiano especial",
                subtotal: 7000
              }
            ],
            estado: "entregado",
            id: 1,
            metodoPago: "efectivo",
            numeroTurno: 1,
            total: 7000
          },
          {
            clienteNombre: null,
            createdAt: "2026-08-16T22:20:00.000Z",
            detalles: [],
            estado: "cancelado",
            id: 2,
            metodoPago: "tarjeta",
            numeroTurno: 2,
            total: 5000
          }
        ]}
        productosVendidos={[
          { cantidad: 2, productoId: 1, productoNombre: "Completo Hass Italiano especial", total: 7000 }
        ]}
        responsable={{ primaryLabel: "Responsable", primaryValue: "Cajero" }}
        summary={{
          ...emptySummary,
          pedidosCancelados: 1,
          pedidosEntregados: 1,
          totalEfectivo: 7000,
          totalPedidos: 2,
          totalVendido: 7000
        }}
      />
    );

    expect(screen.getByText("Completo Hass Italiano especial")).toBeTruthy();
    expect(screen.getByText(/2× Completo Hass Italiano especial/)).toBeTruthy();
    expect(screen.getByText("Cancelado")).toBeTruthy();
    expect(screen.getByText("Sin nombre")).toBeTruthy();
    expect(screen.getAllByText("$7.000").length).toBeGreaterThanOrEqual(2);
  });
});
