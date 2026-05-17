export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  descripcion?: string;
  imagen?: string;
  altText?: string;
  destacado?: boolean;
}

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

export interface PedidoItem {
  productoId: number;
  cantidad: number;
}

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia";

export interface CreatePedidoPayload {
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
}

export interface PedidoResponse {
  id: number;
  total: string;
  estado: string;
  metodoPago: MetodoPago;
  observacion?: string | null;
  createdAt?: string;
  updatedAt?: string;
  detalles?: PedidoDetalleResponse[];
}

export interface ApiError {
  message?: string;
  error?: string;
}
