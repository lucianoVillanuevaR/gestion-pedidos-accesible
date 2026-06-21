import type { CierreTurno } from "../types";
import { apiRequest } from "./api";

const CIERRES_TURNO_STORAGE_KEY = "riquisimo:cierres-turno";

function readStoredCierresTurno(): CierreTurno[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CIERRES_TURNO_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as CierreTurno[]) : [];
  } catch {
    return [];
  }
}

export function obtenerCierresTurno() {
  return readStoredCierresTurno();
}

export function obtenerPedidoIdsCerrados() {
  return new Set(readStoredCierresTurno().flatMap((cierre) => (cierre.pedidos ?? []).map((pedido) => pedido.id)));
}

export async function guardarCierreTurno(cierre: CierreTurno) {
  if (typeof window === "undefined") {
    return cierre;
  }

  const actualBody = await apiRequest<{ turno: { id: number } | null }>("/api/turnos/actual", {
    fallbackMessage: "No fue posible consultar el turno"
  });
  if (!actualBody.turno) {
    throw new Error("No hay un turno abierto para cerrar");
  }

  await apiRequest<{ turno: unknown }>(`/api/turnos/${actualBody.turno.id}/cerrar`, {
    fallbackMessage: "No fue posible cerrar el turno",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumen: cierre })
  });

  const cierres = readStoredCierresTurno();
  window.localStorage.setItem(CIERRES_TURNO_STORAGE_KEY, JSON.stringify([cierre, ...cierres]));
  return cierre;
}

export async function abrirTurnoRemoto() {
  const body = await apiRequest<{ turno?: { fechaInicio: string } }>("/api/turnos/abrir", {
    fallbackMessage: "No fue posible abrir el turno",
    method: "POST"
  });
  if (!body.turno) throw new Error("No fue posible abrir el turno");
  return body.turno;
}

export async function sincronizarTurnoActual() {
  const body = await apiRequest<{ turno: { fechaInicio: string } | null }>("/api/turnos/actual", {
    fallbackMessage: "No fue posible consultar el turno"
  });
  return body.turno;
}

export async function cargarCierresTurno() {
  const body = await apiRequest<{
    turnos?: Array<{ resumen: CierreTurno | null }>;
  }>("/api/turnos/cierres", { fallbackMessage: "No fue posible cargar los cierres" });
  const cierres = (body.turnos ?? []).flatMap((turno) => (turno.resumen ? [turno.resumen] : []));
  window.localStorage.setItem(CIERRES_TURNO_STORAGE_KEY, JSON.stringify(cierres));
  return cierres;
}
