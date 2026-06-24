export function validateTurnoClose(isTurnoOpen: boolean) {
  return isTurnoOpen ? null : "El turno ya está cerrado.";
}
