import type { MetodoPago } from "../types";
import {
  CLIENTE_NOMBRE_PATTERN,
  PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH,
  PEDIDO_MAX_CANTIDAD_DETALLE,
  PEDIDO_OBSERVACION_MAX_LENGTH
} from "../domain/pedidoRules";

export { PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH, PEDIDO_MAX_CANTIDAD_DETALLE, PEDIDO_OBSERVACION_MAX_LENGTH };

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

  const clienteNombreLimpio = clienteNombre.trim();

  if (clienteNombreLimpio && !CLIENTE_NOMBRE_PATTERN.test(clienteNombreLimpio)) {
    return "El nombre del cliente solo puede contener letras";
  }

  if (clienteNombreLimpio.length > PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH) {
    return `El nombre del cliente no puede superar ${PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH} caracteres`;
  }

  if (observacion.trim().length > PEDIDO_OBSERVACION_MAX_LENGTH) {
    return `La observación no puede superar ${PEDIDO_OBSERVACION_MAX_LENGTH} caracteres`;
  }

  return null;
}

export function sanitizeClienteNombreInput(value: string) {
  return value.replace(/[^\p{L}\p{M}\s'-]/gu, "").replace(/\s+/g, " ");
}
