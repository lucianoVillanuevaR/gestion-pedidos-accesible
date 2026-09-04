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
const HISTORIAL_PAGE_SIZE = 8;

export type HistorialPedidoGroup = {
  dateKey: string;
  label: string;
  pedidos: HistorialPedidoDetalle[];
};

export function paginateTurnosHistorial(
  turnos: HistorialTurno[],
  requestedPage: number,
  pageSize = HISTORIAL_PAGE_SIZE
) {
  const total = turnos.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (page - 1) * pageSize;

  return {
    end: total === 0 ? 0 : Math.min(startIndex + pageSize, total),
    items: turnos.slice(startIndex, startIndex + pageSize),
    page,
    start: total === 0 ? 0 : startIndex + 1,
    total,
    totalPages
  };
}

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
    });
}

function getHistorialPedidoDate(pedido: HistorialPedidoDetalle) {
  const createdAt = pedido.createdAt ? new Date(pedido.createdAt) : null;

  if (createdAt && !Number.isNaN(createdAt.getTime())) return createdAt;

  const fechaCierre = new Date(pedido.fechaCierre);
  return Number.isNaN(fechaCierre.getTime()) ? null : fechaCierre;
}

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getPreviousDay(value: Date) {
  const previousDay = new Date(value);
  previousDay.setDate(value.getDate() - 1);
  return previousDay;
}

export function formatHistorialPedidoTime(pedido: HistorialPedidoDetalle, now = new Date()) {
  const date = getHistorialPedidoDate(pedido);
  if (!date) return "Fecha y hora no disponibles";

  const relativeDay = isSameCalendarDay(date, now)
    ? "Hoy"
    : isSameCalendarDay(date, getPreviousDay(now))
      ? "Ayer"
      : new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(date).replace(".", "");

  const time = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit"
  }).format(date);

  return `${relativeDay} · ${time}`;
}

export function groupHistorialPedidosByDate(pedidos: HistorialPedidoDetalle[], now = new Date()) {
  const groups = new Map<string, HistorialPedidoGroup>();

  pedidos.forEach((pedido) => {
    const date = getHistorialPedidoDate(pedido);
    const dateKey = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : "sin-fecha";
    const relativeDay = date
      ? isSameCalendarDay(date, now)
        ? "Hoy"
        : isSameCalendarDay(date, getPreviousDay(now))
          ? "Ayer"
          : new Intl.DateTimeFormat("es-CL", { weekday: "long" }).format(date)
      : "Sin fecha";
    const fullDate = date
      ? new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long" }).format(date)
      : "hora no disponible";
    const currentGroup = groups.get(dateKey);

    if (currentGroup) {
      currentGroup.pedidos.push(pedido);
    } else {
      groups.set(dateKey, {
        dateKey,
        label: `${relativeDay.charAt(0).toUpperCase()}${relativeDay.slice(1)} · ${fullDate}`,
        pedidos: [pedido]
      });
    }
  });

  return [...groups.values()];
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
