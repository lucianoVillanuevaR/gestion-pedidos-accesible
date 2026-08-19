import type { MetodoPago, PersonalizacionProducto, Producto, VarianteProducto } from "../../types";

export type PdvPedidoDetalle = {
  itemKey: string;
  productoId: number;
  cantidad: number;
  producto: Producto;
  subtotal: number;
  variante?: VarianteProducto;
  personalizacion?: PersonalizacionProducto;
};

export type PdvPrintData = {
  clienteNombre: string;
  createdAt?: string;
  metodoPago: MetodoPago | "";
  numeroPedido: number | string;
  observacion: string;
  pedidoDetalles: PdvPedidoDetalle[];
  total: number;
};
