// Reglas obligatorias de dominio. La copia frontend solo mejora la UX.
export const PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH = 80;
export const PEDIDO_OBSERVACION_MAX_LENGTH = 300;
export const PEDIDO_MAX_DETALLES = 50;
export const PEDIDO_MAX_CANTIDAD_DETALLE = 99;

export const CLIENTE_NOMBRE_PATTERN = /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u;

export const ESTADOS_PEDIDO_VALIDOS = ["pendiente", "en_preparacion", "listo", "entregado", "cancelado"] as const;
export const ESTADOS_PEDIDO_ACTIVOS = ["pendiente", "en_preparacion", "listo"] as const;

export const METODOS_PAGO_VALIDOS = ["efectivo", "tarjeta", "transferencia"] as const;

export type EstadoPedidoValido = (typeof ESTADOS_PEDIDO_VALIDOS)[number];
export type MetodoPagoValido = (typeof METODOS_PAGO_VALIDOS)[number];
export type PedidoTransitionRole = "cajero" | "cocina" | "admin";

export const TRANSICIONES_ESTADO_PERMITIDAS: Readonly<Record<EstadoPedidoValido, readonly EstadoPedidoValido[]>> = {
  pendiente: ["en_preparacion", "cancelado"],
  en_preparacion: ["listo", "cancelado"],
  listo: ["entregado"],
  entregado: [],
  cancelado: []
};

const TRANSICIONES_PEDIDO_POR_ROL: Readonly<
  Record<PedidoTransitionRole, Readonly<Partial<Record<EstadoPedidoValido, readonly EstadoPedidoValido[]>>>>
> = {
  cocina: {
    pendiente: ["en_preparacion"],
    en_preparacion: ["listo"]
  },
  cajero: {
    pendiente: ["cancelado"],
    en_preparacion: ["cancelado"],
    listo: ["entregado"]
  },
  admin: {
    pendiente: ["cancelado"],
    en_preparacion: ["cancelado"]
  }
};

export function canRoleTransitionPedido(role: string, estadoActual: string, estadoNuevo: string) {
  if (estadoActual === estadoNuevo) return true;
  if (role !== "cajero" && role !== "cocina" && role !== "admin") return false;
  if (
    !ESTADOS_PEDIDO_VALIDOS.includes(estadoActual as EstadoPedidoValido) ||
    !ESTADOS_PEDIDO_VALIDOS.includes(estadoNuevo as EstadoPedidoValido)
  ) {
    return false;
  }

  return (
    TRANSICIONES_PEDIDO_POR_ROL[role][estadoActual as EstadoPedidoValido]?.includes(
      estadoNuevo as EstadoPedidoValido
    ) ?? false
  );
}
