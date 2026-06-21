import { ESTADOS_PEDIDO_ACTIVOS } from "../domain/pedidoRules";

export function validateTurnoCanClose(turnoEstado: string, estadosPedidos: string[]) {
  if (turnoEstado !== "abierto") {
    return "El turno ya está cerrado";
  }

  if (
    estadosPedidos.some((estado) => ESTADOS_PEDIDO_ACTIVOS.includes(estado as (typeof ESTADOS_PEDIDO_ACTIVOS)[number]))
  ) {
    return "No puedes cerrar el turno mientras existan pedidos activos";
  }

  return null;
}
