import prisma from "../config/prisma";
import { RequestError } from "../utils/httpErrors";

export async function validateProductComponents(
  productoId: number | null,
  componentes: Array<{ componenteId: number; varianteId?: number }>
) {
  if (!componentes.length) {
    return;
  }

  if (productoId !== null && componentes.some((item) => item.componenteId === productoId)) {
    throw new RequestError(400, "Un producto no puede ser componente de sí mismo");
  }

  const validos = await prisma.producto.count({
    where: { id: { in: componentes.map((item) => item.componenteId) }, controlaStock: true }
  });

  if (validos !== componentes.length) {
    throw new RequestError(400, "Todos los componentes deben existir y controlar stock real");
  }

  const varianteIds = componentes.flatMap((item) => (item.varianteId ? [item.varianteId] : []));

  if (!varianteIds.length) {
    return;
  }

  if (productoId === null) {
    throw new RequestError(400, "Las variantes deben pertenecer al producto editado");
  }

  const variantesValidas = await prisma.variante.count({ where: { id: { in: varianteIds }, productoId } });

  if (variantesValidas !== new Set(varianteIds).size) {
    throw new RequestError(400, "Todas las variantes deben pertenecer al producto vendido");
  }
}
