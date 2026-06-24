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
  varianteId?: number;
  personalizacion?: unknown;
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

  const detalleKeys = new Set<string>();

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

    if (detalle.personalizacion !== undefined) {
      if (
        !detalle.personalizacion ||
        typeof detalle.personalizacion !== "object" ||
        Array.isArray(detalle.personalizacion)
      ) {
        return "Detalle inválido: personalizacion debe ser un objeto";
      }
      const personalizacion = detalle.personalizacion as {
        aderezos?: unknown;
        comentario?: unknown;
        combinacion?: unknown;
      };
      if (
        !Array.isArray(personalizacion.aderezos) ||
        personalizacion.aderezos.length > 3 ||
        personalizacion.aderezos.some((item) => typeof item !== "string" || !item.trim() || item.length > 40)
      ) {
        return "Detalle inválido: selecciona hasta 3 aderezos válidos";
      }
      if (
        personalizacion.comentario !== undefined &&
        (typeof personalizacion.comentario !== "string" || personalizacion.comentario.trim().length > 200)
      ) {
        return "Detalle inválido: el comentario no puede superar 200 caracteres";
      }
      if (personalizacion.combinacion !== undefined) {
        const combinacion = personalizacion.combinacion as {
          nombre?: unknown;
          componentes?: unknown;
        };
        if (
          !combinacion ||
          typeof combinacion !== "object" ||
          typeof combinacion.nombre !== "string" ||
          !combinacion.nombre.trim() ||
          combinacion.nombre.length > 160 ||
          !Array.isArray(combinacion.componentes) ||
          combinacion.componentes.length < 1 ||
          combinacion.componentes.length > 2 ||
          combinacion.componentes.some(
            (item) =>
              !item ||
              typeof item !== "object" ||
              !Number.isInteger(Number((item as { componenteId?: unknown }).componenteId)) ||
              Number((item as { componenteId?: unknown }).componenteId) <= 0 ||
              !Number.isInteger(Number((item as { cantidad?: unknown }).cantidad)) ||
              Number((item as { cantidad?: unknown }).cantidad) <= 0 ||
              Number((item as { cantidad?: unknown }).cantidad) > 10
          )
        ) {
          return "Detalle inválido: la combinación de la promoción no es válida";
        }
      }
    }

    if (
      detalle.varianteId !== undefined &&
      (!Number.isInteger(Number(detalle.varianteId)) || Number(detalle.varianteId) <= 0)
    ) {
      return "Detalle inválido: varianteId debe ser un entero positivo";
    }

    const productoId = Number(detalle.productoId);
    const detalleKey = `${productoId}:${detalle.varianteId ?? "base"}:${JSON.stringify(detalle.personalizacion ?? null)}`;

    if (detalleKeys.has(detalleKey)) {
      return "No se puede repetir el mismo producto con la misma opción y personalización en el pedido";
    }

    detalleKeys.add(detalleKey);
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
