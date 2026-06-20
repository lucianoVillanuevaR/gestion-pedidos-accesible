import path from "node:path";
import prisma from "../config/prisma";
import { minioClient, minioPublicUrl, productBucket } from "../config/minio";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

type ProductImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

const PRODUCTO_IMAGE_INCLUDE = {
  categorias: {
    orderBy: {
      nombre: "asc"
    }
  }
} as const;

function buildProductImageUrl(objectName: string | null | undefined) {
  if (!objectName) {
    return null;
  }

  if (objectName.startsWith("http") || objectName.startsWith("/")) {
    return objectName;
  }

  return `${minioPublicUrl}/${productBucket}/${objectName}`;
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

function getExtension(file: ProductImageFile) {
  const extensionByMime = EXTENSION_BY_MIME[file.mimetype];

  if (extensionByMime) {
    return extensionByMime;
  }

  const originalExtension = path.extname(file.originalname).replace(".", "").toLowerCase();
  return originalExtension || "webp";
}

function isMinioObjectName(imagenUrl: string | null | undefined): imagenUrl is string {
  return Boolean(imagenUrl && !imagenUrl.startsWith("http") && !imagenUrl.startsWith("/"));
}

async function deleteObjectIfNeeded(imagenUrl: string | null | undefined) {
  if (!isMinioObjectName(imagenUrl)) {
    return;
  }

  try {
    await minioClient.removeObject(productBucket, imagenUrl);
  } catch (error) {
    console.warn("No se pudo eliminar imagen anterior de MinIO:", error);
  }
}

function ensureProducto<T>(producto: T | null) {
  if (!producto) {
    throw new Error("Producto no encontrado");
  }

  return producto;
}

export async function uploadProductImage(productId: number, file: ProductImageFile) {
  const producto = ensureProducto(
    await prisma.producto.findUnique({ include: PRODUCTO_IMAGE_INCLUDE, where: { id: productId } })
  );
  const extension = getExtension(file);
  const objectName = `producto-${productId}-${Date.now()}.${extension}`;

  await minioClient.putObject(productBucket, objectName, file.buffer, file.size, {
    "Content-Type": file.mimetype
  });

  const productoActualizado = await prisma.producto.update({
    data: {
      imagenUrl: objectName
    },
    include: PRODUCTO_IMAGE_INCLUDE,
    where: {
      id: productId
    }
  });

  await deleteObjectIfNeeded(producto.imagenUrl);

  return withProductImageUrl(productoActualizado);
}

export async function deleteProductImage(productId: number) {
  const producto = ensureProducto(
    await prisma.producto.findUnique({ include: PRODUCTO_IMAGE_INCLUDE, where: { id: productId } })
  );

  await deleteObjectIfNeeded(producto.imagenUrl);

  const productoActualizado = await prisma.producto.update({
    data: {
      imagenUrl: null
    },
    include: PRODUCTO_IMAGE_INCLUDE,
    where: {
      id: productId
    }
  });

  return withProductImageUrl(productoActualizado);
}
