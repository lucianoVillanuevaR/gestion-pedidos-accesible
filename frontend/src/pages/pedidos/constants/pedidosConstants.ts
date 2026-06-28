import { TRANSICIONES_ESTADO_PERMITIDAS } from "../../../domain/pedidoRules";
import type { EstadoPedido, PedidoResponse } from "../../../types";

export type EstadoFilter = EstadoPedido | "todos";
type ModalAction = "detail" | "state" | "finish" | "cancel" | "history";
export type SortOption = "recent" | "oldest" | "highest_total" | "state";

export const TURNO_ABIERTO_STORAGE_KEY = "riquisimo:turno-abierto";
export const TURNO_FECHA_INICIO_STORAGE_KEY = "riquisimo:turno-fecha-inicio";

export type ActiveModal = {
  action: ModalAction;
  pedido: PedidoResponse;
} | null;

export type PedidoModalState = NonNullable<ActiveModal>;

type EstadoOption = {
  label: string;
  value: EstadoFilter;
};

type EstadoMeta = {
  className: string;
  label: string;
};

export const ESTADO_OPTIONS: EstadoOption[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendiente", value: "pendiente" },
  { label: "En preparación", value: "en_preparacion" },
  { label: "Listo", value: "listo" },
  { label: "Entregado", value: "entregado" },
  { label: "Cancelado", value: "cancelado" }
];

export const ESTADO_META: Record<EstadoPedido, EstadoMeta> = {
  pendiente: {
    label: "Pendiente",
    className: "border-yellow-200 bg-yellow-100 text-yellow-900"
  },
  en_preparacion: {
    label: "En preparación",
    className: "border-yellow-200 bg-yellow-100 text-yellow-900"
  },
  listo: {
    label: "Listo",
    className: "border-emerald-200 bg-emerald-100 text-emerald-900"
  },
  entregado: {
    label: "Entregado",
    className: "border-emerald-200 bg-emerald-100 text-emerald-900"
  },
  cancelado: {
    label: "Cancelado",
    className: "border-red-200 bg-red-100 text-red-900"
  }
};

const CAMBIO_ESTADO_OPTIONS: Array<{ label: string; value: EstadoPedido }> = [
  { label: "Marcar en preparación", value: "en_preparacion" },
  { label: "Marcar como listo", value: "listo" },
  { label: "Entregar pedido", value: "entregado" },
  { label: "Cancelar pedido", value: "cancelado" }
];

export function getAllowedEstadoOptions(estado: EstadoPedido) {
  return CAMBIO_ESTADO_OPTIONS.filter((option) => TRANSICIONES_ESTADO_PERMITIDAS[estado].includes(option.value));
}
