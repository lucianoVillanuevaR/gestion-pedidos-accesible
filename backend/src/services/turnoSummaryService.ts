import { Prisma } from "@prisma/client";

export const turnoCloseInclude = {
  usuario: { select: { username: true } },
  pedidos: {
    include: { detalles: { include: { producto: { select: { nombre: true } } } } },
    orderBy: { createdAt: "asc" }
  }
} as const;

type TurnoForClose = Prisma.TurnoGetPayload<{ include: typeof turnoCloseInclude }>;

export function buildResumenTurno(turno: TurnoForClose, fechaCierre: Date): Prisma.InputJsonValue {
  const pedidosEntregados = turno.pedidos.filter((pedido) => pedido.estado === "entregado");
  const pedidosCancelados = turno.pedidos.filter((pedido) => pedido.estado === "cancelado");
  const totalPorMetodo = { efectivo: 0, tarjeta: 0, transferencia: 0 };
  const productos = new Map<number, { cantidad: number; productoId: number; productoNombre: string; total: number }>();

  for (const pedido of pedidosEntregados) {
    if (pedido.metodoPago in totalPorMetodo) {
      totalPorMetodo[pedido.metodoPago as keyof typeof totalPorMetodo] += pedido.total.toNumber();
    }

    for (const detalle of pedido.detalles) {
      const current = productos.get(detalle.productoId);
      productos.set(detalle.productoId, {
        cantidad: (current?.cantidad ?? 0) + detalle.cantidad,
        productoId: detalle.productoId,
        productoNombre: detalle.producto.nombre,
        total: (current?.total ?? 0) + detalle.subtotal.toNumber()
      });
    }
  }

  return {
    id: `turno-${turno.id}`,
    fechaInicio: turno.fechaInicio.toISOString(),
    fechaCierre: fechaCierre.toISOString(),
    usuarioId: turno.usuario.username,
    pedidos: turno.pedidos.map((pedido, index) => ({
      id: pedido.id,
      numeroTurno: index + 1,
      clienteNombre: pedido.clienteNombre,
      createdAt: pedido.createdAt.toISOString(),
      estado: pedido.estado,
      metodoPago: pedido.metodoPago,
      observacion: pedido.observacion,
      total: pedido.total.toNumber(),
      detalles: pedido.detalles.map((detalle) => ({
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario.toNumber(),
        productoId: detalle.productoId,
        productoNombre: detalle.producto.nombre,
        subtotal: detalle.subtotal.toNumber()
      }))
    })),
    productosVendidos: [...productos.values()].sort((left, right) => right.cantidad - left.cantidad),
    totalPedidos: turno.pedidos.length,
    pedidosEntregados: pedidosEntregados.length,
    pedidosCancelados: pedidosCancelados.length,
    pedidosPendientes: 0,
    totalVendido: totalPorMetodo.efectivo + totalPorMetodo.tarjeta + totalPorMetodo.transferencia,
    totalEfectivo: totalPorMetodo.efectivo,
    totalPendiente: 0,
    totalTarjeta: totalPorMetodo.tarjeta,
    totalTransferencia: totalPorMetodo.transferencia
  };
}
