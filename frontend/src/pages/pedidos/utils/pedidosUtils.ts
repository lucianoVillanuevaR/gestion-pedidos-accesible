import { ESTADOS_PEDIDO_ACTIVOS } from "../../../domain/pedidoRules";
import type { CierreTurno, MetodoPago, PedidoDetalleResponse, PedidoResponse } from "../../../types";
import { normalizeSearchText } from "../../../utils/formatters";
import {
  ESTADO_META,
  TURNO_ABIERTO_STORAGE_KEY,
  TURNO_FECHA_INICIO_STORAGE_KEY,
  type SortOption
} from "../constants/pedidosConstants";

export function getPedidoCounts(pedidos: PedidoResponse[]) {
  const pendientes = pedidos.filter((pedido) => pedido.estado === "pendiente").length;
  const enPreparacion = pedidos.filter((pedido) => pedido.estado === "en_preparacion").length;
  const listos = pedidos.filter((pedido) => pedido.estado === "listo").length;

  return {
    enPreparacion,
    entregados: pedidos.filter((pedido) => pedido.estado === "entregado").length,
    listos,
    pendientes,
    total: pedidos.length
  };
}

export function getNormalSummary(pedidos: PedidoResponse[]) {
  const turnoSummary = getTurnoSummary(pedidos);

  return {
    ...getPedidoCounts(pedidos),
    totalPendiente: turnoSummary.totalPendiente,
    totalVendido: turnoSummary.totalVendido
  };
}

export type NormalSummary = ReturnType<typeof getNormalSummary>;

export function getTurnoSummary(pedidos: PedidoResponse[]) {
  const pedidosEntregados = pedidos.filter((pedido) => pedido.estado === "entregado");
  const pedidosPendientesTurno = pedidos.filter((pedido) => ESTADOS_PEDIDO_ACTIVOS.includes(pedido.estado));
  const totalPendiente = pedidosPendientesTurno.reduce((total, pedido) => total + Number(pedido.total), 0);
  const totalPorMetodo: Record<MetodoPago, number> = {
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0
  };

  pedidosEntregados.forEach((pedido) => {
    totalPorMetodo[pedido.metodoPago] += Number(pedido.total);
  });

  return {
    pedidosCancelados: pedidos.filter((pedido) => pedido.estado === "cancelado").length,
    pedidosEntregados: pedidosEntregados.length,
    pedidosPendientes: pedidosPendientesTurno.length,
    totalPendiente: Number.isNaN(totalPendiente) ? 0 : totalPendiente,
    totalEfectivo: totalPorMetodo.efectivo,
    totalPedidos: pedidos.length,
    totalTarjeta: totalPorMetodo.tarjeta,
    totalTransferencia: totalPorMetodo.transferencia,
    totalVendido: totalPorMetodo.efectivo + totalPorMetodo.tarjeta + totalPorMetodo.transferencia
  };
}

export function formatTime(value?: string) {
  if (!value) {
    return "Sin hora";
  }

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getPedidoNumeroTurnoMap(pedidos: PedidoResponse[]) {
  const sortedPedidos = [...pedidos].sort((left, right) => {
    const leftTime = getCreatedDate(left.createdAt)?.getTime() ?? left.id;
    const rightTime = getCreatedDate(right.createdAt)?.getTime() ?? right.id;

    if (leftTime === rightTime) {
      return left.id - right.id;
    }

    return leftTime - rightTime;
  });

  return new Map(sortedPedidos.map((pedido, index) => [pedido.id, index + 1]));
}

export function getPedidoDisplayNumber(pedido: Pick<PedidoResponse, "id" | "numeroTurno">) {
  return pedido.numeroTurno ?? pedido.id;
}

export function withPedidoNumerosTurno(pedidos: PedidoResponse[]) {
  const numeroTurnoByPedidoId = getPedidoNumeroTurnoMap(pedidos);

  return pedidos.map((pedido) => ({
    ...pedido,
    numeroTurno: numeroTurnoByPedidoId.get(pedido.id) ?? pedido.numeroTurno
  }));
}

function getCreatedDate(value?: string) {
  const createdAt = value ? new Date(value) : null;
  return createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null;
}

function getElapsedMinutes(value?: string) {
  const createdAt = getCreatedDate(value);

  if (!createdAt) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));
}

export function formatElapsedTime(value?: string) {
  const minutes = getElapsedMinutes(value);

  if (minutes === null) {
    return "Sin tiempo";
  }

  if (minutes < 1) {
    return "Hace menos de 1 min";
  }

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `Hace ${hours} h ${remainingMinutes} min` : `Hace ${hours} h`;
}

export function isPedidoDelayed(pedido: PedidoResponse) {
  if (!["pendiente", "en_preparacion"].includes(pedido.estado)) {
    return false;
  }

  const elapsedMinutes = getElapsedMinutes(pedido.createdAt);
  return elapsedMinutes !== null && elapsedMinutes > 20;
}

export function formatMetodoPago(value: PedidoResponse["metodoPago"]) {
  const labels: Record<PedidoResponse["metodoPago"], string> = {
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
    transferencia: "Transferencia"
  };

  return labels[value];
}

export function getItemName(detalle: PedidoDetalleResponse) {
  return detalle.producto?.nombre ?? `Producto #${detalle.productoId}`;
}

export function getProductCount(pedido: PedidoResponse) {
  return pedido.detalles?.reduce((total, detalle) => total + detalle.cantidad, 0) ?? 0;
}

export function getPedidoSummary(pedido: PedidoResponse) {
  const detalles = pedido.detalles ?? [];

  if (detalles.length === 0) {
    return "Sin detalle de productos";
  }

  return detalles
    .slice(0, 2)
    .map((detalle) => `${detalle.cantidad}x ${getItemName(detalle)}`)
    .join(", ")
    .concat(detalles.length > 2 ? ` y ${detalles.length - 2} más` : "");
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function readTurnoAbierto() {
  if (typeof window === "undefined") {
    return true;
  }

  const storedValue = window.localStorage.getItem(TURNO_ABIERTO_STORAGE_KEY);
  return storedValue === null ? true : storedValue === "true";
}

export function setTurnoAbierto(isOpen: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TURNO_ABIERTO_STORAGE_KEY, String(isOpen));
}

function readTurnoFechaInicio() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage.getItem(TURNO_FECHA_INICIO_STORAGE_KEY) ?? undefined;
}

export function setTurnoFechaInicio(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TURNO_FECHA_INICIO_STORAGE_KEY, value);
}

export function getFechaInicioTurno(pedidos: PedidoResponse[]) {
  const storedFechaInicio = readTurnoFechaInicio();

  if (storedFechaInicio) {
    return storedFechaInicio;
  }

  const timestamps = pedidos
    .map((pedido) => (pedido.createdAt ? new Date(pedido.createdAt).getTime() : null))
    .filter((timestamp): timestamp is number => timestamp !== null && !Number.isNaN(timestamp));

  if (timestamps.length === 0) {
    return undefined;
  }

  return new Date(Math.min(...timestamps)).toISOString();
}

function parseMoneyValue(value: string) {
  const amount = Number(value);
  return Number.isNaN(amount) ? 0 : amount;
}

function getDetalleProductoNombre(detalle: NonNullable<PedidoResponse["detalles"]>[number]) {
  return detalle.producto?.nombre ?? `Producto #${detalle.productoId}`;
}

export function getCierrePedidosResumen(pedidos: PedidoResponse[]): CierreTurno["pedidos"] {
  const numeroTurnoByPedidoId = getPedidoNumeroTurnoMap(pedidos);

  return pedidos.map((pedido) => ({
    id: pedido.id,
    numeroTurno: numeroTurnoByPedidoId.get(pedido.id),
    clienteNombre: pedido.clienteNombre,
    createdAt: pedido.createdAt,
    estado: pedido.estado,
    metodoPago: pedido.metodoPago,
    observacion: pedido.observacion,
    total: parseMoneyValue(pedido.total),
    detalles: (pedido.detalles ?? []).map((detalle) => ({
      cantidad: detalle.cantidad,
      precioUnitario: parseMoneyValue(detalle.precioUnitario),
      productoId: detalle.productoId,
      productoNombre: getDetalleProductoNombre(detalle),
      subtotal: parseMoneyValue(detalle.subtotal)
    }))
  }));
}

export function getProductosVendidosResumen(pedidos: PedidoResponse[]): CierreTurno["productosVendidos"] {
  const productos = new Map<number, CierreTurno["productosVendidos"][number]>();

  pedidos
    .filter((pedido) => pedido.estado === "entregado")
    .forEach((pedido) => {
      (pedido.detalles ?? []).forEach((detalle) => {
        const currentProducto = productos.get(detalle.productoId);
        const subtotal = parseMoneyValue(detalle.subtotal);

        if (!currentProducto) {
          productos.set(detalle.productoId, {
            cantidad: detalle.cantidad,
            productoId: detalle.productoId,
            productoNombre: getDetalleProductoNombre(detalle),
            total: subtotal
          });
          return;
        }

        currentProducto.cantidad += detalle.cantidad;
        currentProducto.total += subtotal;
      });
    });

  return [...productos.values()].sort((left, right) => right.cantidad - left.cantidad);
}

export function pedidoMatchesSearch(pedido: PedidoResponse, searchTerm: string) {
  const normalizedSearch = normalizeSearchText(searchTerm);

  if (!normalizedSearch) {
    return true;
  }

  const displayNumber = getPedidoDisplayNumber(pedido);
  const searchableText = [
    `pedido ${displayNumber}`,
    String(displayNumber),
    pedido.clienteNombre ?? "",
    getPedidoSummary(pedido),
    formatMetodoPago(pedido.metodoPago),
    ESTADO_META[pedido.estado].label,
    pedido.estado
  ].join(" ");

  return normalizeSearchText(searchableText).includes(normalizedSearch);
}

export function sortPedidos(pedidos: PedidoResponse[], sortOption: SortOption) {
  return [...pedidos].sort((left, right) => {
    if (sortOption === "oldest") {
      return (getCreatedDate(left.createdAt)?.getTime() ?? 0) - (getCreatedDate(right.createdAt)?.getTime() ?? 0);
    }

    if (sortOption === "highest_total") {
      return Number(right.total) - Number(left.total);
    }

    if (sortOption === "state") {
      return ESTADO_META[left.estado].label.localeCompare(ESTADO_META[right.estado].label, "es");
    }

    return (getCreatedDate(right.createdAt)?.getTime() ?? 0) - (getCreatedDate(left.createdAt)?.getTime() ?? 0);
  });
}
