import type { CierreTurno } from "../types";
import { apiRequest } from "./api";

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

  const closeBody = await apiRequest<{
    turno: { resumen: CierreTurno | null };
  }>(`/turnos/${actualBody.turno.id}/cerrar`, {
    fallbackMessage: "No fue posible cerrar el turno",
    method: "POST"
  });

  if (!closeBody.turno.resumen) {
    throw new Error("El servidor no devolvió el resumen del turno cerrado");
  }

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
    turnos?: Array<{ id: number; resumen: CierreTurno | null }>;
  }>("/turnos/cierres", {
    fallbackMessage: "No fue posible cargar los cierres"
  });

  return extractCierresTurno(body.turnos ?? []);
}

export function extractCierresTurno(turnos: Array<{ id: number; resumen: CierreTurno | null }>) {
  const cierres: CierreTurno[] = [];

  for (const turno of turnos) {
    if (turno.resumen) {
      cierres.push(turno.resumen);
      continue;
    }

    console.warn(`El turno cerrado ${turno.id} no tiene datos suficientes para mostrar su resumen histórico.`);
  }

  return cierres;
}
