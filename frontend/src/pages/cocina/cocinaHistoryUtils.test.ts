import { describe, expect, it } from "vitest";
import type { CierreTurno } from "../../types";
import { filterTurnosHistorial, getTurnoProductosVendidos, getTurnosHistorial } from "./cocinaHistoryUtils";

const cierre: CierreTurno = {
  fechaCierre: "2026-06-23T20:00:00.000Z",
  id: "turno-1",
  pedidos: [
    {
      createdAt: "2026-06-23T19:00:00.000Z",
      detalles: [
        {
          cantidad: 2,
          precioUnitario: 3900,
          productoId: 7,
          productoNombre: "Completo Italiano",
          subtotal: 7800
        }
      ],
      estado: "entregado",
      id: 10,
      metodoPago: "efectivo",
      observacion: "Sin cebolla",
      total: 7800
    }
  ],
  pedidosCancelados: 0,
  pedidosEntregados: 1,
  pedidosPendientes: 0,
  productosVendidos: [],
  totalEfectivo: 7800,
  totalPedidos: 1,
  totalPendiente: 0,
  totalTarjeta: 0,
  totalTransferencia: 0,
  totalVendido: 7800,
  usuarioId: "cajero"
};

describe("utilidades del historial de cocina", () => {
  it("busca sin depender de mayúsculas ni tildes", () => {
    const turnos = getTurnosHistorial([cierre]);
    const filtered = filterTurnosHistorial(turnos, {
      dateFilter: "all",
      estadoFilter: "todos",
      metodoFilter: "todos",
      searchTerm: "italiano"
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].pedidos[0].id).toBe(10);
  });

  it("reconstruye los productos vendidos cuando el cierre no trae el resumen", () => {
    const [turno] = getTurnosHistorial([cierre]);

    expect(getTurnoProductosVendidos(turno)).toEqual([
      {
        cantidad: 2,
        productoId: 7,
        productoNombre: "Completo Italiano",
        total: 7800
      }
    ]);
  });
});
