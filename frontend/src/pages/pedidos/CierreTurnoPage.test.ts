import { describe, expect, it } from "vitest";
import type { CierreTurno } from "../../types";
import { resolveCierreTurnoPrintable } from "./CierreTurnoPage";

const summaryVacio = {
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

describe("impresión del cierre de turno", () => {
  it("conserva el snapshot recién cerrado aunque los pedidos actuales ya estén vacíos", () => {
    const ultimoCierre: CierreTurno = {
      ...summaryVacio,
      fechaCierre: "2026-08-16T22:00:00.000Z",
      fechaInicio: "2026-08-16T18:00:00.000Z",
      id: "turno-7",
      pedidos: [
        {
          createdAt: "2026-08-16T19:00:00.000Z",
          detalles: [],
          estado: "entregado",
          id: 21,
          metodoPago: "efectivo",
          total: 3500
        }
      ],
      pedidosEntregados: 1,
      productosVendidos: [],
      totalEfectivo: 3500,
      totalPedidos: 1,
      totalVendido: 3500,
      usuario: { label: "Cajero antiguo", role: "cajero", username: "cajero" },
      usuarioId: "cajero"
    };
    const turnoActualVacio = {
      fechaCierre: "2026-08-16T22:01:00.000Z",
      pedidos: [],
      productosVendidos: [],
      responsable: { primaryLabel: "Responsable" as const, primaryValue: "Cajero" },
      summary: summaryVacio
    };

    const printable = resolveCierreTurnoPrintable(ultimoCierre, turnoActualVacio);

    expect(printable.fechaCierre).toBe(ultimoCierre.fechaCierre);
    expect(printable.pedidos.map((pedido) => pedido.id)).toEqual([21]);
    expect(printable.summary.totalVendido).toBe(3500);
    expect(printable.responsable.primaryValue).toBe("Cajero Antiguo");
  });
});
