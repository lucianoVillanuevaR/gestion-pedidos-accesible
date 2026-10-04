import type { EstadoPedido, MetodoPago, UserRole } from "../types";

// Reglas de UX. El backend conserva y aplica obligatoriamente los mismos límites.
export const PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH = 80;
export const PEDIDO_OBSERVACION_MAX_LENGTH = 300;
export const PEDIDO_MAX_DETALLES = 50;
export const PEDIDO_MAX_CANTIDAD_DETALLE = 99;

export const CLIENTE_NOMBRE_PATTERN = /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u;

export const ESTADOS_PEDIDO_VALIDOS: readonly EstadoPedido[] = [
  "pendiente",
  "en_preparacion",
  "listo",
  "entregado",
  "cancelado"
];

export const ESTADOS_PEDIDO_ACTIVOS: readonly EstadoPedido[] = ["pendiente", "en_preparacion", "listo"];

export const METODOS_PAGO_VALIDOS: readonly MetodoPago[] = ["efectivo", "tarjeta", "transferencia"];

export const TRANSICIONES_ESTADO_PERMITIDAS: Readonly<Record<EstadoPedido, readonly EstadoPedido[]>> = {
  pendiente: ["en_preparacion", "cancelado"],
  en_preparacion: ["listo", "cancelado"],
  listo: ["entregado"],
  entregado: [],
  cancelado: []
};

const TRANSICIONES_PEDIDO_POR_ROL: Readonly<
  Record<UserRole, Readonly<Partial<Record<EstadoPedido, readonly EstadoPedido[]>>>>
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

export function canRoleTransitionPedido(role: UserRole, estadoActual: EstadoPedido, estadoNuevo: EstadoPedido) {
  if (estadoActual === estadoNuevo) return true;
  return TRANSICIONES_PEDIDO_POR_ROL[role][estadoActual]?.includes(estadoNuevo) ?? false;
}
