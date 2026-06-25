import type { FeedbackState } from "./PdvShared";

export function buildPedidoValidationFeedback(message: string): FeedbackState {
  if (message === "No hay productos seleccionados") {
    return {
      type: "error",
      title: "Pedido vacío",
      message: "Agrega al menos un producto antes de aceptar el pedido."
    };
  }

  if (message === "Selecciona método de pago") {
    return {
      type: "error",
      title: "Falta método de pago",
      message: "Selecciona efectivo, tarjeta o transferencia para registrar el pedido."
    };
  }

  return {
    type: "error",
    title: "Revisa el pedido",
    message
  };
}

export function buildPedidoCreateErrorFeedback(message: string): FeedbackState {
  if (isStockError(message)) {
    return {
      type: "error",
      title: "Stock insuficiente",
      message,
      details: "Actualiza el inventario o cambia los productos del pedido antes de intentar nuevamente."
    };
  }

  return {
    type: "error",
    title: "No se pudo registrar el pedido",
    message
  };
}

export function isStockError(message: string) {
  return message.toLowerCase().includes("stock insuficiente");
}
