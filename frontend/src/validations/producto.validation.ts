import type { CreateProductoPayload } from "../types";

export const PRODUCTO_NOMBRE_MAX_LENGTH = 80;
export const PRODUCTO_DESCRIPCION_MAX_LENGTH = 300;
export const PRODUCTO_PRECIO_MAX = 99999999.99;

type ValidateProductoFormParams = {
  descripcion: string;
  nombre: string;
  precio: string;
};

function hasMoreThanTwoDecimals(value: number) {
  return Math.abs(value * 100 - Math.round(value * 100)) > Number.EPSILON;
}

export function validateProductoForm({ descripcion, nombre, precio }: ValidateProductoFormParams) {
  const nombreLimpio = nombre.trim();
  const descripcionLimpia = descripcion.trim();
  const precioNumerico = Number(precio);

  if (!nombreLimpio) {
    return "Ingresa el nombre del producto";
  }

  if (nombreLimpio.length > PRODUCTO_NOMBRE_MAX_LENGTH) {
    return `El nombre no puede superar ${PRODUCTO_NOMBRE_MAX_LENGTH} caracteres`;
  }

  if (descripcionLimpia.length > PRODUCTO_DESCRIPCION_MAX_LENGTH) {
    return `La descripción no puede superar ${PRODUCTO_DESCRIPCION_MAX_LENGTH} caracteres`;
  }

  if (!Number.isFinite(precioNumerico) || precioNumerico < 0 || precioNumerico > PRODUCTO_PRECIO_MAX) {
    return `Ingresa un precio entre 0 y ${PRODUCTO_PRECIO_MAX}`;
  }

  if (hasMoreThanTwoDecimals(precioNumerico)) {
    return "El precio debe tener como máximo 2 decimales";
  }

  return null;
}

export function buildProductoPayload({
  categoria,
  descripcion,
  destacado,
  disponible,
  nombre,
  precio
}: CreateProductoPayload & { precio: number }) {
  return {
    categoria,
    descripcion: descripcion?.trim() || undefined,
    destacado,
    disponible,
    nombre: nombre.trim(),
    precio: Math.round(precio * 100) / 100
  };
}
