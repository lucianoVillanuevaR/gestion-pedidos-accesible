export interface Producto {
  categoria?: string;
  id: number;
  nombre: string;
  precio: number;
  descripcion?: string;
  imagen?: string;
  imagenUrl?: string | null;
  imagenPublicUrl?: string | null;
  altText?: string;
  disponible?: boolean;
  destacado?: boolean;
}

export interface CreateProductoPayload {
  categoria?: string;
  descripcion?: string;
  destacado?: boolean;
  disponible?: boolean;
  nombre: string;
  precio: number;
}

export type UpdateProductoPayload = Partial<CreateProductoPayload>;

export type UserRole = "cajero" | "cocina" | "admin";

export interface AuthUser {
  email: string;
  label: string;
  role: UserRole;
  username: string;
}

export interface DemoUser extends AuthUser {
  password: string;
}

interface PedidoItem {
  productoId: number;
  cantidad: number;
}

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia";

export type EstadoPedido = "pendiente" | "en_preparacion" | "listo" | "entregado" | "cancelado";

export interface CreatePedidoPayload {
  clienteNombre?: string;
  detalles: PedidoItem[];
  metodoPago: MetodoPago;
  observacion?: string;
}

export interface PedidoDetalleResponse {
  id: number;
  pedidoId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: string;
  subtotal: string;
  producto?: Producto;
}

export interface PedidoResponse {
  id: number;
  numeroTurno?: number;
  total: string;
  estado: EstadoPedido;
  metodoPago: MetodoPago;
  clienteNombre?: string | null;
  observacion?: string | null;
  createdAt?: string;
  updatedAt?: string;
  detalles?: PedidoDetalleResponse[];
}

export type CierreTurno = {
  id: string;
  fechaInicio?: string;
  fechaCierre: string;
  usuarioId?: string;
  pedidos: CierrePedidoResumen[];
  productosVendidos: CierreProductoResumen[];
  totalPedidos: number;
  pedidosEntregados: number;
  pedidosCancelados: number;
  pedidosPendientes: number;
  totalVendido: number;
  totalEfectivo: number;
  totalPendiente: number;
  totalTarjeta: number;
  totalTransferencia: number;
};

export type CierrePedidoResumen = {
  id: number;
  numeroTurno?: number;
  clienteNombre?: string | null;
  createdAt?: string;
  estado: EstadoPedido;
  metodoPago: MetodoPago;
  observacion?: string | null;
  total: number;
  detalles: CierrePedidoDetalle[];
};

type CierrePedidoDetalle = {
  cantidad: number;
  precioUnitario: number;
  productoId: number;
  productoNombre: string;
  subtotal: number;
};

export type CierreProductoResumen = {
  cantidad: number;
  productoId: number;
  productoNombre: string;
  total: number;
};

export interface ApiError {
  message?: string;
  error?: string;
}

export type InventarioEstado = "disponible" | "bajo_stock" | "sin_stock";

export interface InventarioItem {
  estado: InventarioEstado;
  productoDisponible: boolean;
  productoId: number;
  productoNombre: string;
  stockActual: number;
  stockMinimo: number;
}

export type UpdateInventarioPayload = {
  stockActual?: number;
  stockMinimo?: number;
};
