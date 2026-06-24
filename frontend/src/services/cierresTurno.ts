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

export async function guardarCierreTurno() {
  if (typeof window === "undefined") {
    throw new Error("No es posible cerrar un turno fuera del navegador");
  }

  const actualBody = await apiRequest<{ turno: { id: number } | null }>("/turnos/actual", {
    fallbackMessage: "No fue posible consultar el turno"
  });
  if (!actualBody.turno) {
    throw new Error("No hay un turno abierto para cerrar");
  }

  const closeBody = await apiRequest<{ turno: { resumen: CierreTurno | null } }>(
    `/turnos/${actualBody.turno.id}/cerrar`,
    {
      fallbackMessage: "No fue posible cerrar el turno",
      method: "POST"
    }
  );

  if (!closeBody.turno.resumen) {
    throw new Error("El servidor no devolvió el resumen del turno cerrado");
  }

  const cierres = readStoredCierresTurno();
  window.localStorage.setItem(CIERRES_TURNO_STORAGE_KEY, JSON.stringify([closeBody.turno.resumen, ...cierres]));
  return closeBody.turno.resumen;
}

export async function abrirTurnoRemoto() {
  const body = await apiRequest<{ turno?: { fechaInicio: string } }>("/turnos/abrir", {
    fallbackMessage: "No fue posible abrir el turno",
    method: "POST"
  });
  if (!body.turno) throw new Error("No fue posible abrir el turno");
  return body.turno;
}

export async function sincronizarTurnoActual() {
  const body = await apiRequest<{ turno: { fechaInicio: string } | null }>("/turnos/actual", {
    fallbackMessage: "No fue posible consultar el turno"
  });
  return body.turno;
}

export async function cargarCierresTurno() {
  const body = await apiRequest<{
    turnos?: Array<{ resumen: CierreTurno | null }>;
  }>("/turnos/cierres", { fallbackMessage: "No fue posible cargar los cierres" });
  const cierres = (body.turnos ?? []).flatMap((turno) => (turno.resumen ? [turno.resumen] : []));
  window.localStorage.setItem(CIERRES_TURNO_STORAGE_KEY, JSON.stringify(cierres));
  return cierres;
}
