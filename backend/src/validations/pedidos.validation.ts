import {
  CLIENTE_NOMBRE_PATTERN,
  ESTADOS_PEDIDO_VALIDOS,
  METODOS_PAGO_VALIDOS,
  PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH,
  PEDIDO_MAX_CANTIDAD_DETALLE,
  PEDIDO_MAX_DETALLES,
  PEDIDO_OBSERVACION_MAX_LENGTH,
  TRANSICIONES_ESTADO_PERMITIDAS,
  type EstadoPedidoValido,
  type MetodoPagoValido
} from "../domain/pedidoRules";

type PedidoDetalleInput = {
  cantidad: number;
  productoId: number;
};

export function validateMetodoPago(metodoPago: string) {
  if (typeof metodoPago !== "string") {
    return "Método de pago es requerido";
  }

  if (METODOS_PAGO_VALIDOS.includes(metodoPago as MetodoPagoValido)) {
    return null;
  }

  return `Método de pago inválido. Debe ser uno de: ${METODOS_PAGO_VALIDOS.join(", ")}`;
}

export function validatePedidoDetalles(detalles: PedidoDetalleInput[] | undefined) {
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return "El pedido debe tener al menos un detalle";
  }

  if (detalles.length > PEDIDO_MAX_DETALLES) {
    return `El pedido no puede tener más de ${PEDIDO_MAX_DETALLES} detalles`;
  }

  const productIds = new Set<number>();

  for (const detalle of detalles) {
    if (
      !detalle ||
      !Number.isInteger(Number(detalle.productoId)) ||
      Number(detalle.productoId) <= 0 ||
      !Number.isInteger(Number(detalle.cantidad)) ||
      Number(detalle.cantidad) <= 0 ||
      Number(detalle.cantidad) > PEDIDO_MAX_CANTIDAD_DETALLE
    ) {
      return `Detalle inválido: productoId y cantidad entera entre 1 y ${PEDIDO_MAX_CANTIDAD_DETALLE} son requeridos`;
    }

    const productoId = Number(detalle.productoId);

    if (productIds.has(productoId)) {
      return "No se puede repetir el mismo producto en el pedido";
    }

    productIds.add(productoId);
  }

  return null;
}

export function validateEstadoPedido(estado: string) {
  if (typeof estado !== "string") {
    return "Estado es requerido";
  }

  if (ESTADOS_PEDIDO_VALIDOS.includes(estado as EstadoPedidoValido)) {
    return null;
  }

  return `Estado inválido. Debe ser uno de: ${ESTADOS_PEDIDO_VALIDOS.join(", ")}`;
}

export function validateTransicionEstadoPedido(estadoActual: string, estadoNuevo: string) {
  const estadoActualError = validateEstadoPedido(estadoActual);

  if (estadoActualError) {
    return estadoActualError;
  }

  const estadoNuevoError = validateEstadoPedido(estadoNuevo);

  if (estadoNuevoError) {
    return estadoNuevoError;
  }

  if (estadoActual === estadoNuevo) {
    return null;
  }

  const allowedStates = TRANSICIONES_ESTADO_PERMITIDAS[estadoActual as EstadoPedidoValido];

  if (!allowedStates.includes(estadoNuevo as EstadoPedidoValido)) {
    return `Cambio de estado no permitido: ${estadoActual} → ${estadoNuevo}`;
  }

  return null;
}

export function validatePedidoTextFields(clienteNombre?: unknown, observacion?: unknown) {
  if (clienteNombre !== undefined && clienteNombre !== null && typeof clienteNombre !== "string") {
    return "El nombre del cliente debe ser texto";
  }

  if (observacion !== undefined && observacion !== null && typeof observacion !== "string") {
    return "La observación debe ser texto";
  }

  const clienteNombreLimpio = typeof clienteNombre === "string" ? clienteNombre.trim() : "";
  const observacionLimpia = typeof observacion === "string" ? observacion.trim() : "";

  if (clienteNombreLimpio && !CLIENTE_NOMBRE_PATTERN.test(clienteNombreLimpio)) {
    return "El nombre del cliente solo puede contener letras";
  }

  if (clienteNombreLimpio.length > PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH) {
    return `El nombre del cliente no puede superar ${PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH} caracteres`;
  }

  if (observacionLimpia.length > PEDIDO_OBSERVACION_MAX_LENGTH) {
    return `La observación no puede superar ${PEDIDO_OBSERVACION_MAX_LENGTH} caracteres`;
  }

  return null;
}
