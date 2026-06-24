import { ESTADOS_PEDIDO_ACTIVOS } from "../../domain/pedidoRules";
import type { CierrePedidoResumen, CierreTurno, EstadoPedido, MetodoPago } from "../../types";
import { normalizeSearchText } from "../../utils/formatters";
import { ESTADO_META, formatMetodoPago, getPedidoDisplayNumber } from "../pedidos/PedidosShared";

export type HistorialPedidoDetalle = CierrePedidoResumen & {
  cajero?: string;
  fechaCierre: string;
  turnoId: string;
};

export type HistorialTurno = Omit<CierreTurno, "pedidos"> & {
  pedidos: HistorialPedidoDetalle[];
};

export type HistorialDateFilter = "all" | "month" | "today" | "week";
export type HistorialEstadoFilter = EstadoPedido | "todos";
export type HistorialMetodoFilter = MetodoPago | "todos";

export function getTurnosHistorial(cierres: CierreTurno[]): HistorialTurno[] {
  return cierres
    .map((cierre) => ({
      ...cierre,
      pedidos: (cierre.pedidos ?? [])
        .map((pedido) => ({
          ...pedido,
          cajero: cierre.usuarioId,
          fechaCierre: cierre.fechaCierre,
          turnoId: cierre.id
        }))
        .sort((left, right) => {
          const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
          const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
          return rightTime - leftTime;
        })
    }))
    .filter((cierre) => cierre.pedidos.length > 0)
    .sort((left, right) => new Date(right.fechaCierre).getTime() - new Date(left.fechaCierre).getTime());
}

export function filterTurnosHistorial(
  turnos: HistorialTurno[],
  filters: {
    dateFilter: HistorialDateFilter;
    estadoFilter: HistorialEstadoFilter;
    metodoFilter: HistorialMetodoFilter;
    searchTerm: string;
  }
) {
  const hasActivePedidoFilter =
    filters.searchTerm.trim() || filters.estadoFilter !== "todos" || filters.metodoFilter !== "todos";

  return turnos
    .filter((turno) => matchesDateFilter(turno.fechaCierre, filters.dateFilter))
    .map((turno) => {
      const pedidos = turno.pedidos.filter((pedido) => {
        const matchesEstado = filters.estadoFilter === "todos" || pedido.estado === filters.estadoFilter;
        const matchesMetodo = filters.metodoFilter === "todos" || pedido.metodoPago === filters.metodoFilter;
        return matchesEstado && matchesMetodo && historialPedidoMatchesSearch(pedido, turno, filters.searchTerm);
      });

      return { ...turno, pedidos };
    })
    .filter((turno) => turno.pedidos.length > 0 || !hasActivePedidoFilter);
}

function matchesDateFilter(value: string, filter: HistorialDateFilter) {
  if (filter === "all") return true;

  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) return false;

  if (filter === "today") {
    return (
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
    );
  }

  if (filter === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - dayOfWeek);

  return date.getTime() >= startOfWeek.getTime();
}

function historialPedidoMatchesSearch(pedido: HistorialPedidoDetalle, turno: HistorialTurno, searchTerm: string) {
  const normalizedSearch = normalizeSearchText(searchTerm);

  if (!normalizedSearch) return true;

  const displayNumber = getPedidoDisplayNumber(pedido);
  const searchableText = [
    `pedido ${displayNumber}`,
    String(displayNumber),
    pedido.clienteNombre ?? "",
    pedido.observacion ?? "",
    pedido.cajero ?? "",
    turno.usuarioId ?? "",
    formatMetodoPago(pedido.metodoPago),
    ESTADO_META[pedido.estado].label,
    ...pedido.detalles.map((detalle) => detalle.productoNombre)
  ].join(" ");

  return normalizeSearchText(searchableText).includes(normalizedSearch);
}

export function getPedidosRecientes(turnos: HistorialTurno[]) {
  return turnos
    .flatMap((turno) => turno.pedidos)
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 12);
}

export function getTurnoProductosVendidos(turno: HistorialTurno) {
  if (turno.productosVendidos?.length) return turno.productosVendidos;

  const productos = new Map<number, NonNullable<CierreTurno["productosVendidos"]>[number]>();

  turno.pedidos
    .filter((pedido) => pedido.estado === "entregado")
    .forEach((pedido) => {
      pedido.detalles.forEach((detalle) => {
        const currentProducto = productos.get(detalle.productoId);

        if (!currentProducto) {
          productos.set(detalle.productoId, {
            cantidad: detalle.cantidad,
            productoId: detalle.productoId,
            productoNombre: detalle.productoNombre,
            total: detalle.subtotal
          });
          return;
        }

        currentProducto.cantidad += detalle.cantidad;
        currentProducto.total += detalle.subtotal;
      });
    });

  return [...productos.values()].sort((left, right) => right.cantidad - left.cantidad);
}

export function countTurnoPedidosByEstado(turno: HistorialTurno, estado: EstadoPedido) {
  return turno.pedidos.filter((pedido) => pedido.estado === estado).length;
}

export function countTurnoPedidosPendientes(turno: HistorialTurno) {
  return turno.pedidos.filter((pedido) => ESTADOS_PEDIDO_ACTIVOS.includes(pedido.estado)).length;
}
