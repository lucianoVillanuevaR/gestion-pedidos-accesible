import type { MetodoPago, PedidoResponse, PersonalizacionProducto, Producto, VarianteProducto } from "../../types";

export type PedidoPrintSnapshot = {
  clienteNombre: string;
  createdAt: string;
  metodoPago: MetodoPago;
  numeroPedido: number;
  observacion: string;
  pedidoDetalles: Array<{
    itemKey: string;
    productoId: number;
    cantidad: number;
    subtotal: number;
    producto: Producto;
    variante?: VarianteProducto;
    personalizacion?: PersonalizacionProducto;
  }>;
  total: number;
};

export function buildPedidoPrintSnapshot(pedido: PedidoResponse): PedidoPrintSnapshot {
  if (!pedido.numeroTurno || !pedido.createdAt) {
    throw new Error("El pedido confirmado no incluye número de turno o fecha de registro");
  }

  const pedidoDetalles = (pedido.detalles ?? []).map((detalle) => {
    if (!detalle.producto) {
      throw new Error("El pedido confirmado no incluye el producto de uno de sus detalles");
    }

    return {
      itemKey: `pedido-${pedido.id}-detalle-${detalle.id}`,
      productoId: detalle.productoId,
      cantidad: detalle.cantidad,
      subtotal: Number(detalle.subtotal),
      producto: {
        ...detalle.producto,
        precio: Number(detalle.precioUnitario)
      },
      ...(detalle.variante ? { variante: detalle.variante } : {}),
      ...(detalle.personalizacion ? { personalizacion: detalle.personalizacion } : {})
    };
  });

  return {
    clienteNombre: pedido.clienteNombre ?? "",
    createdAt: pedido.createdAt,
    metodoPago: pedido.metodoPago,
    numeroPedido: pedido.numeroTurno,
    observacion: pedido.observacion ?? "",
    pedidoDetalles,
    total: Number(pedido.total)
  };
}
