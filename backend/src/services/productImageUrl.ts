import { env } from "../config/env";

function buildProductImageUrl(objectName: string | null | undefined) {
  if (!objectName) return null;
  if (objectName.startsWith("http") || objectName.startsWith("/")) return objectName;
  return `${env.minio.publicUrl}/${env.minio.productBucket}/${objectName}`;
}

export function withProductImageUrl<T extends { categorias?: Array<{ nombre: string }>; imagenUrl?: string | null }>(
  producto: T
) {
  return {
    ...producto,
    categoria: producto.categorias?.[0]?.nombre,
    imagenPublicUrl: buildProductImageUrl(producto.imagenUrl)
  };
}
