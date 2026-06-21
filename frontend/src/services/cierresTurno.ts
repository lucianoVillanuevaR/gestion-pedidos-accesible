import type { CierreTurno } from "../types";
import { authenticatedFetch, buildApiUrl } from "./api";

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

  const actualResponse = await authenticatedFetch(buildApiUrl("/api/turnos/actual"));
  const actualBody = (await actualResponse.json()) as { turno: { id: number } | null; error?: string };
  if (!actualResponse.ok || !actualBody.turno) {
    throw new Error(actualBody.error || "No hay un turno abierto para cerrar");
  }

  const closeResponse = await authenticatedFetch(buildApiUrl(`/api/turnos/${actualBody.turno.id}/cerrar`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumen: cierre })
  });
  if (!closeResponse.ok) {
    const body = (await closeResponse.json()) as { error?: string };
    throw new Error(body.error || "No fue posible cerrar el turno");
  }

  const cierres = readStoredCierresTurno();
  window.localStorage.setItem(CIERRES_TURNO_STORAGE_KEY, JSON.stringify([cierre, ...cierres]));
  return cierre;
}

export async function abrirTurnoRemoto() {
  const response = await authenticatedFetch(buildApiUrl("/api/turnos/abrir"), { method: "POST" });
  const body = (await response.json()) as { turno?: { fechaInicio: string }; error?: string };
  if (!response.ok || !body.turno) throw new Error(body.error || "No fue posible abrir el turno");
  return body.turno;
}

export async function sincronizarTurnoActual() {
  const response = await authenticatedFetch(buildApiUrl("/api/turnos/actual"));
  const body = (await response.json()) as { turno: { fechaInicio: string } | null; error?: string };
  if (!response.ok) throw new Error(body.error || "No fue posible consultar el turno");
  return body.turno;
}

export async function cargarCierresTurno() {
  const response = await authenticatedFetch(buildApiUrl("/api/turnos/cierres"));
  const body = (await response.json()) as {
    turnos?: Array<{ resumen: CierreTurno | null }>;
    error?: string;
  };
  if (!response.ok) throw new Error(body.error || "No fue posible cargar los cierres");
  const cierres = (body.turnos ?? []).flatMap((turno) => (turno.resumen ? [turno.resumen] : []));
  window.localStorage.setItem(CIERRES_TURNO_STORAGE_KEY, JSON.stringify(cierres));
  return cierres;
}
