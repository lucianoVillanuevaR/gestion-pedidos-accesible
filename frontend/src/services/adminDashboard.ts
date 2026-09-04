import type { AdminDashboardData, DashboardPeriod } from "../types";
import { apiRequest } from "./api";

export function getAdminDashboard(period: DashboardPeriod, signal?: AbortSignal) {
  return apiRequest<AdminDashboardData>(`/admin/dashboard?period=${period}`, {
    fallbackMessage: "No se pudo cargar el resumen administrativo",
    signal
  });
}
