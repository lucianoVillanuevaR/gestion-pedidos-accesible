import { PRODUCTO_CATEGORIA_MAX_LENGTH } from "../domain/productoRules";

export function validateCategoriaNombre(nombre?: unknown) {
  if (nombre === undefined || nombre === null || nombre === "") {
    return "El nombre de la categoría es obligatorio";
  }

  if (typeof nombre !== "string") {
    return "El nombre de la categoría debe ser texto";
  }

  const cleanName = nombre.trim();

  if (!cleanName) {
    return "El nombre de la categoría es obligatorio";
  }

  if (cleanName.length > PRODUCTO_CATEGORIA_MAX_LENGTH) {
    return `La categoría no puede superar ${PRODUCTO_CATEGORIA_MAX_LENGTH} caracteres`;
  }

  if (!/^[\p{L}\p{N}\s_-]+$/u.test(cleanName)) {
    return "La categoría solo puede incluir letras, números, espacios, guiones y guiones bajos";
  }

  return null;
}
