import { describe, expect, it } from "vitest";
import {
  EXCLUDED_SALES_STATUS,
  calculateAverageTicket,
  getDashboardPeriodRange,
  isDashboardPeriod
} from "./adminDashboardService";

describe("admin dashboard", () => {
  it("acepta únicamente los períodos soportados", () => {
    expect(isDashboardPeriod("today")).toBe(true);
    expect(isDashboardPeriod("7d")).toBe(true);
    expect(isDashboardPeriod("30d")).toBe(true);
    expect(isDashboardPeriod("year")).toBe(false);
  });

  it("crea rangos de siete días según la zona horaria de Chile", () => {
    const range = getDashboardPeriodRange("7d", new Date("2026-08-31T18:00:00.000Z"));

    expect(range.start.toISOString()).toBe("2026-08-25T04:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-09-01T04:00:00.000Z");
    expect(range.days).toBe(7);
    expect(range.bucket).toBe("day");
  });

  it("respeta el cambio de horario de verano chileno", () => {
    const range = getDashboardPeriodRange("today", new Date("2026-12-15T15:00:00.000Z"));

    expect(range.start.toISOString()).toBe("2026-12-15T03:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-12-16T03:00:00.000Z");
  });

  it("evita divisiones inválidas y redondea el ticket promedio", () => {
    expect(calculateAverageTicket(0, 0)).toBe(0);
    expect(calculateAverageTicket(10_000, 3)).toBe(3333);
  });

  it("excluye pedidos cancelados de las métricas de venta", () => {
    expect(EXCLUDED_SALES_STATUS).toBe("cancelado");
  });
});
