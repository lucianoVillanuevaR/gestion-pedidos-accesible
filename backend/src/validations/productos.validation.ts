import {
  PRODUCTO_CATEGORIA_MAX_LENGTH,
  PRODUCTO_DESCRIPCION_MAX_LENGTH,
  PRODUCTO_NOMBRE_MAX_LENGTH,
  PRODUCTO_PRECIO_MAX
} from "../domain/productoRules";

type ProductoInput = {
  categoria?: unknown;
  descripcion?: unknown;
  destacado?: unknown;
  disponible?: unknown;
  nombre?: unknown;
  precio?: unknown;
};

type ProductoValidationResult = {
  categoria?: string;
  descripcion?: string | null;
  destacado?: boolean;
  disponible?: boolean;
  nombre?: string;
  precio?: number;
};

function validateStringLength(value: string, fieldName: string, maxLength: number) {
  if (value.length > maxLength) {
    return `${fieldName} no puede superar ${maxLength} caracteres`;
  }

  return null;
}

function validateOptionalBoolean(value: unknown, fieldName: string) {
  if (value !== undefined && typeof value !== "boolean") {
    return `${fieldName} debe ser verdadero o falso`;
  }

  return null;
}

function validateCategoria(value: string) {
  if (!value) {
    return "La categoría es obligatoria";
  }

  const lengthError = validateStringLength(value, "La categoría", PRODUCTO_CATEGORIA_MAX_LENGTH);
  if (lengthError) {
    return lengthError;
  }

  if (!/^[\p{L}\p{N}\s_-]+$/u.test(value)) {
    return "La categoría solo puede incluir letras, números, espacios, guiones y guiones bajos";
  }

  return null;
}

function hasMoreThanTwoDecimals(value: number) {
  return Math.abs(value * 100 - Math.round(value * 100)) > Number.EPSILON;
}

type ProductoCreateResult = {
  data?: Required<
    Pick<ProductoValidationResult, "categoria" | "descripcion" | "destacado" | "disponible" | "nombre" | "precio">
  >;
  error?: string;
};

export function validateProductoCreate(input: ProductoInput): ProductoCreateResult {
  const nombre = typeof input.nombre === "string" ? input.nombre.trim() : "";
  const descripcion = typeof input.descripcion === "string" ? input.descripcion.trim() : "";
  const categoria = typeof input.categoria === "string" ? input.categoria.trim() : "Otros";
  const precio = Number(input.precio);

  if (!nombre) {
    return { error: "El nombre del producto es obligatorio" };
  }

  const nombreError = validateStringLength(nombre, "El nombre del producto", PRODUCTO_NOMBRE_MAX_LENGTH);
  if (nombreError) {
    return { error: nombreError };
  }

  if (input.descripcion !== undefined && typeof input.descripcion !== "string") {
    return { error: "La descripción debe ser texto" };
  }

  const descripcionError = validateStringLength(descripcion, "La descripción", PRODUCTO_DESCRIPCION_MAX_LENGTH);
  if (descripcionError) {
    return { error: descripcionError };
  }

  if (!Number.isFinite(precio) || precio < 0 || precio > PRODUCTO_PRECIO_MAX) {
    return { error: `El precio debe ser un número válido entre 0 y ${PRODUCTO_PRECIO_MAX}` };
  }

  if (hasMoreThanTwoDecimals(precio)) {
    return { error: "El precio debe tener como máximo 2 decimales" };
  }

  const categoriaError = validateCategoria(categoria);
  if (categoriaError) {
    return { error: categoriaError };
  }

  const destacadoError = validateOptionalBoolean(input.destacado, "destacado");
  if (destacadoError) {
    return { error: destacadoError };
  }

  const disponibleError = validateOptionalBoolean(input.disponible, "disponible");
  if (disponibleError) {
    return { error: disponibleError };
  }

  return {
    data: {
      categoria,
      descripcion: descripcion || null,
      destacado: typeof input.destacado === "boolean" ? input.destacado : categoria === "Destacados",
      disponible: typeof input.disponible === "boolean" ? input.disponible : true,
      nombre,
      precio: Math.round(precio * 100) / 100
    }
  };
}

export function validateProductoUpdate(input: ProductoInput): { data?: ProductoValidationResult; error?: string } {
  const data: ProductoValidationResult = {};

  if (input.nombre !== undefined) {
    if (typeof input.nombre !== "string") {
      return { error: "El nombre del producto debe ser texto" };
    }

    const nombre = input.nombre.trim();

    if (!nombre) {
      return { error: "El nombre del producto es obligatorio" };
    }

    const nombreError = validateStringLength(nombre, "El nombre del producto", PRODUCTO_NOMBRE_MAX_LENGTH);
    if (nombreError) {
      return { error: nombreError };
    }

    data.nombre = nombre;
  }

  if (input.descripcion !== undefined) {
    if (typeof input.descripcion !== "string") {
      return { error: "La descripción debe ser texto" };
    }

    const descripcion = input.descripcion.trim();
    const descripcionError = validateStringLength(descripcion, "La descripción", PRODUCTO_DESCRIPCION_MAX_LENGTH);
    if (descripcionError) {
      return { error: descripcionError };
    }

    data.descripcion = descripcion || null;
  }

  if (input.precio !== undefined) {
    const precio = Number(input.precio);

    if (!Number.isFinite(precio) || precio < 0 || precio > PRODUCTO_PRECIO_MAX) {
      return { error: `El precio debe ser un número válido entre 0 y ${PRODUCTO_PRECIO_MAX}` };
    }

    if (hasMoreThanTwoDecimals(precio)) {
      return { error: "El precio debe tener como máximo 2 decimales" };
    }

    data.precio = Math.round(precio * 100) / 100;
  }

  const destacadoError = validateOptionalBoolean(input.destacado, "destacado");
  if (destacadoError) {
    return { error: destacadoError };
  }

  if (typeof input.destacado === "boolean") {
    data.destacado = input.destacado;
  }

  const disponibleError = validateOptionalBoolean(input.disponible, "disponible");
  if (disponibleError) {
    return { error: disponibleError };
  }

  if (typeof input.disponible === "boolean") {
    data.disponible = input.disponible;
  }

  if (input.categoria !== undefined) {
    if (typeof input.categoria !== "string") {
      return { error: "La categoría debe ser texto" };
    }

    const categoria = input.categoria.trim();

    const categoriaError = validateCategoria(categoria);
    if (categoriaError) {
      return { error: categoriaError };
    }

    data.categoria = categoria;
  }

  if (Object.keys(data).length === 0) {
    return { error: "Debe enviar al menos un campo para actualizar" };
  }

  return { data };
}
