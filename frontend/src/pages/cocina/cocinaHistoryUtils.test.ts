import { describe, expect, it } from "vitest";
import type { CierreTurno } from "../../types";
import {
  filterTurnosHistorial,
  formatHistorialPedidoTime,
  getPedidosRecientes,
  getTurnoProductosVendidos,
  getTurnosHistorial,
  groupHistorialPedidosByDate,
  paginateTurnosHistorial
} from "./cocinaHistoryUtils";

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

  it("mantiene separados dos turnos cerrados el mismo día", () => {
    const segundoCierre: CierreTurno = {
      ...cierre,
      fechaCierre: "2026-06-23T23:00:00.000Z",
      id: "turno-2",
      pedidos: [
        {
          ...cierre.pedidos[0],
          createdAt: "2026-06-23T22:00:00.000Z",
          id: 20,
          total: 8300
        }
      ],
      totalEfectivo: 8300,
      totalVendido: 8300
    };

    const turnos = getTurnosHistorial([cierre, segundoCierre]);

    expect(turnos).toHaveLength(2);
    expect(turnos.find((turno) => turno.id === "turno-1")?.pedidos.map((pedido) => pedido.id)).toEqual([10]);
    expect(turnos.find((turno) => turno.id === "turno-2")?.pedidos.map((pedido) => pedido.id)).toEqual([20]);
    expect(turnos.find((turno) => turno.id === "turno-1")?.totalVendido).toBe(7800);
    expect(turnos.find((turno) => turno.id === "turno-2")?.totalVendido).toBe(8300);
  });

  it("conserva los turnos sin pedidos para poder imprimir un cierre vacío", () => {
    const turnoVacio: CierreTurno = {
      ...cierre,
      id: "turno-vacio",
      pedidos: [],
      pedidosEntregados: 0,
      productosVendidos: [],
      totalEfectivo: 0,
      totalPedidos: 0,
      totalVendido: 0
    };

    const turnos = getTurnosHistorial([turnoVacio]);

    expect(turnos).toHaveLength(1);
    expect(turnos[0].pedidos).toEqual([]);
  });

  it("mantiene los filtros Hoy, Esta semana y Recientes sobre los cierres", () => {
    const now = new Date(2026, 5, 24, 12);
    const today = { ...cierre, fechaCierre: new Date(2026, 5, 24, 10).toISOString(), id: "hoy" };
    const thisWeek = { ...cierre, fechaCierre: new Date(2026, 5, 22, 10).toISOString(), id: "semana" };
    const previousWeek = { ...cierre, fechaCierre: new Date(2026, 5, 14, 10).toISOString(), id: "anterior" };
    const turnos = getTurnosHistorial([previousWeek, thisWeek, today]);

    const applyFilter = (dateFilter: "all" | "today" | "week") =>
      filterTurnosHistorial(turnos, {
        dateFilter,
        estadoFilter: "todos",
        metodoFilter: "todos",
        searchTerm: ""
      }).map((turno) => turno.id);

    const originalDate = Date;
    globalThis.Date = class extends originalDate {
      constructor(value?: string | number | Date) {
        super(value === undefined ? now : value);
      }
    } as DateConstructor;

    try {
      expect(applyFilter("today")).toEqual(["hoy"]);
      expect(applyFilter("week")).toEqual(["hoy", "semana"]);
      expect(applyFilter("all")).toEqual(["hoy", "semana", "anterior"]);
    } finally {
      globalThis.Date = originalDate;
    }
  });

  it("agrupa por fecha y da contexto temporal sin alterar números repetidos", () => {
    const todayPedido = {
      ...getTurnosHistorial([cierre])[0].pedidos[0],
      createdAt: "2026-06-23T18:42:00.000Z",
      numeroTurno: 6
    };
    const yesterdayPedido = {
      ...todayPedido,
      createdAt: "2026-06-22T21:10:00.000Z",
      fechaCierre: "2026-06-22T22:00:00.000Z",
      turnoId: "turno-2"
    };
    const now = new Date("2026-06-23T23:00:00.000Z");
    const groups = groupHistorialPedidosByDate([todayPedido, yesterdayPedido], now);

    expect(groups.map((group) => group.label)).toEqual(["Hoy · 23 de junio", "Ayer · 22 de junio"]);
    expect(formatHistorialPedidoTime(todayPedido, now)).toMatch(/^Hoy · \d{2}:\d{2}$/);
    expect(formatHistorialPedidoTime(yesterdayPedido, now)).toMatch(/^Ayer · \d{2}:\d{2}$/);
    expect(groups.flatMap((group) => group.pedidos.map((pedido) => pedido.numeroTurno))).toEqual([6, 6]);
  });

  it("devuelve todos los pedidos recientes ordenados para permitir carga incremental", () => {
    const turnos = Array.from({ length: 15 }, (_, index) => ({
      ...getTurnosHistorial([cierre])[0],
      id: `turno-${index}`,
      pedidos: [
        {
          ...getTurnosHistorial([cierre])[0].pedidos[0],
          createdAt: new Date(2026, 5, 23, index).toISOString(),
          id: index,
          turnoId: `turno-${index}`
        }
      ]
    }));

    expect(getPedidosRecientes(turnos)).toHaveLength(15);
    expect(getPedidosRecientes(turnos)[0].id).toBe(14);
  });

  it("pagina ocho turnos después de conservar el orden filtrado", () => {
    const baseTurno = getTurnosHistorial([cierre])[0];
    const turnos = Array.from({ length: 19 }, (_, index) => ({ ...baseTurno, id: `turno-${index}` }));

    const firstPage = paginateTurnosHistorial(turnos, 1);
    const secondPage = paginateTurnosHistorial(turnos, 2);

    expect(firstPage).toMatchObject({ end: 8, page: 1, start: 1, total: 19, totalPages: 3 });
    expect(firstPage.items).toHaveLength(8);
    expect(secondPage.items.map((turno) => turno.id)).toEqual([
      "turno-8",
      "turno-9",
      "turno-10",
      "turno-11",
      "turno-12",
      "turno-13",
      "turno-14",
      "turno-15"
    ]);
  });

  it("ajusta páginas fuera de rango sin perder el total", () => {
    const baseTurno = getTurnosHistorial([cierre])[0];
    const turnos = Array.from({ length: 9 }, (_, index) => ({ ...baseTurno, id: `turno-${index}` }));

    expect(paginateTurnosHistorial(turnos, 99)).toMatchObject({ end: 9, page: 2, start: 9, totalPages: 2 });
    expect(paginateTurnosHistorial([], 4)).toMatchObject({ end: 0, page: 1, start: 0, total: 0, totalPages: 1 });
  });
});
