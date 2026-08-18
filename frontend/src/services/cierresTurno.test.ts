import { describe, expect, it, vi } from "vitest";
import type { CierreTurno } from "../types";
import { extractCierresTurno } from "./cierresTurno";

const cierre: CierreTurno = {
  fechaCierre: "2026-08-16T22:00:00.000Z",
  id: "turno-7",
  pedidos: [],
  pedidosCancelados: 0,
  pedidosEntregados: 0,
  pedidosPendientes: 0,
  productosVendidos: [],
  totalEfectivo: 0,
  totalPedidos: 0,
  totalPendiente: 0,
  totalTarjeta: 0,
  totalTransferencia: 0,
  totalVendido: 0
};

describe("cierresTurno", () => {
  it("conserva los resúmenes disponibles y reporta explícitamente un cierre irrecuperable", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const cierres = extractCierresTurno([
      { id: 7, resumen: cierre },
      { id: 8, resumen: null }
    ]);

    expect(cierres).toEqual([cierre]);
    expect(warn).toHaveBeenCalledWith(
      "El turno cerrado 8 no tiene datos suficientes para mostrar su resumen histórico."
    );
    warn.mockRestore();
  });
});
