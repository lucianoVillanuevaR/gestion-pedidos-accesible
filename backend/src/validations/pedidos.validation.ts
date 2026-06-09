export const ESTADOS_PEDIDO_VALIDOS = ["pendiente", "en_preparacion", "listo", "entregado", "cancelado"] as const;
export const METODOS_PAGO_VALIDOS = ["efectivo", "tarjeta", "transferencia"] as const;

export type EstadoPedidoValido = (typeof ESTADOS_PEDIDO_VALIDOS)[number];
export type MetodoPagoValido = (typeof METODOS_PAGO_VALIDOS)[number];

type PedidoDetalleInput = {
  cantidad: number;
  productoId: number;
};

export function validateMetodoPago(metodoPago: string) {
  if (METODOS_PAGO_VALIDOS.includes(metodoPago as MetodoPagoValido)) {
    return null;
  }

  return `Método de pago inválido. Debe ser uno de: ${METODOS_PAGO_VALIDOS.join(", ")}`;
}

export function validatePedidoDetalles(detalles: PedidoDetalleInput[] | undefined) {
  if (!detalles || detalles.length === 0) {
    return "El pedido debe tener al menos un detalle";
  }

  const hasInvalidDetalle = detalles.some((detalle) => !detalle.productoId || detalle.cantidad <= 0);

  if (hasInvalidDetalle) {
    return "Detalle inválido: productoId y cantidad (>0) son requeridos";
  }

  return null;
}

export function validateEstadoPedido(estado: string) {
  if (ESTADOS_PEDIDO_VALIDOS.includes(estado as EstadoPedidoValido)) {
    return null;
  }

  return `Estado inválido. Debe ser uno de: ${ESTADOS_PEDIDO_VALIDOS.join(", ")}`;
}
