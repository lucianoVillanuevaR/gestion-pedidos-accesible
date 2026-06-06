import type { CierreTurno } from "../types";

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

export async function guardarCierreTurno(cierre: CierreTurno) {
  if (typeof window === "undefined") {
    return cierre;
  }

  const cierres = readStoredCierresTurno();
  window.localStorage.setItem(CIERRES_TURNO_STORAGE_KEY, JSON.stringify([cierre, ...cierres]));
  return cierre;
}
