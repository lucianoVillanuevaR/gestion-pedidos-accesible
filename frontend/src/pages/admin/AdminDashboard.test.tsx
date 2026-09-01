// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAdminDashboard } from "../../services/adminDashboard";
import type { AdminDashboardData } from "../../types";
import AdminDashboard from "./AdminDashboard";

vi.mock("../../services/adminDashboard", () => ({ getAdminDashboard: vi.fn() }));

const dashboardData: AdminDashboardData = {
  period: "7d",
  range: { start: "2026-08-25T04:00:00.000Z", end: "2026-09-01T04:00:00.000Z", timeZone: "America/Santiago" },
  summary: { sales: 30_000, orders: 3, averageTicket: 10_000, productsSold: 7 },
  salesTimeline: [{ date: "2026-08-31 00:00", sales: 30_000, orders: 3 }],
  topProducts: [{ productId: 1, productName: "Completo italiano", imageUrl: null, quantity: 7, sales: 30_000 }],
  ordersByHour: [{ hour: 13, orders: 3 }],
  ordersToday: { pendiente: 1, en_preparacion: 1, listo: 0, entregado: 1, cancelado: 0 },
  criticalStock: [{ productId: 1, productName: "Completo italiano", currentStock: 2, minimumStock: 5 }]
};

describe("AdminDashboard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("presenta métricas, operaciones y datos históricos del endpoint", async () => {
    vi.mocked(getAdminDashboard).mockResolvedValue(dashboardData);
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect((await screen.findAllByText("$30.000")).length).toBeGreaterThan(0);
    expect(screen.getByText("Productos más vendidos")).toBeTruthy();
    expect(screen.getAllByText("Completo italiano").length).toBeGreaterThan(0);
    expect(screen.getByText("Pedidos de hoy")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Ver inventario/ }).getAttribute("href")).toBe("/admin/inventario");
  });

  it("aplica un único período a todo el dashboard", async () => {
    const user = userEvent.setup();
    vi.mocked(getAdminDashboard).mockResolvedValue(dashboardData);
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await screen.findAllByText("$30.000");
    await user.selectOptions(screen.getByLabelText("Período"), "30d");

    await waitFor(() => expect(getAdminDashboard).toHaveBeenLastCalledWith("30d", expect.any(AbortSignal)));
  });

  it("muestra estados vacíos sin valores inválidos", async () => {
    vi.mocked(getAdminDashboard).mockResolvedValue({
      ...dashboardData,
      summary: { sales: 0, orders: 0, averageTicket: 0, productsSold: 0 },
      salesTimeline: [],
      topProducts: [],
      ordersByHour: [],
      criticalStock: []
    });
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText("No hay ventas en este período.")).toBeTruthy();
    expect(screen.getByText("No hay productos vendidos en este período.")).toBeTruthy();
    expect(screen.getByText("No hay productos con stock crítico.")).toBeTruthy();
    expect(screen.queryByText(/NaN|undefined|null/)).toBeNull();
  });
});
