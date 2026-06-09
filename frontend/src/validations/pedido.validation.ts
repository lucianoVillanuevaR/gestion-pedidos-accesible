import type { MetodoPago } from "../types";

type ValidatePedidoSubmitParams = {
  isTurnoOpen: boolean;
  metodoPago: MetodoPago | "";
  totalProductos: number;
};

export function validatePedidoSubmit({ isTurnoOpen, metodoPago, totalProductos }: ValidatePedidoSubmitParams) {
  if (!isTurnoOpen) {
    return "Debes abrir turno antes de registrar un pedido.";
  }

  if (totalProductos === 0) {
    return "No hay productos seleccionados";
  }

  if (!metodoPago) {
    return "Selecciona método de pago";
  }

  return null;
}
