import type { MetodoPago } from "../types";

export const PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH = 80;
export const PEDIDO_OBSERVACION_MAX_LENGTH = 300;
export const PEDIDO_MAX_CANTIDAD_DETALLE = 99;

type ValidatePedidoSubmitParams = {
  clienteNombre?: string;
  isTurnoOpen: boolean;
  metodoPago: MetodoPago | "";
  observacion?: string;
  totalProductos: number;
};

export function validatePedidoSubmit({
  clienteNombre = "",
  isTurnoOpen,
  metodoPago,
  observacion = "",
  totalProductos
}: ValidatePedidoSubmitParams) {
  if (!isTurnoOpen) {
    return "Debes abrir turno antes de registrar un pedido.";
  }

  if (totalProductos === 0) {
    return "No hay productos seleccionados";
  }

  if (!metodoPago) {
    return "Selecciona método de pago";
  }

  if (clienteNombre.trim().length > PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH) {
    return `El nombre del cliente no puede superar ${PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH} caracteres`;
  }

  if (observacion.trim().length > PEDIDO_OBSERVACION_MAX_LENGTH) {
    return `La observación no puede superar ${PEDIDO_OBSERVACION_MAX_LENGTH} caracteres`;
  }

  return null;
}
