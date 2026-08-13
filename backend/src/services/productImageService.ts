import path from "node:path";
import prisma from "../config/prisma";
import { minioClient, productBucket } from "../config/minio";
import { withProductImageUrl } from "./productImageUrl";
export { withProductImageUrl } from "./productImageUrl";

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
  },
  componentes: {
    include: { componente: true },
    orderBy: { id: "asc" }
  },
  variantes: { where: { disponible: true }, orderBy: { orden: "asc" } }
} as const;

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

export async function deleteProductImageObject(imagenUrl: string | null | undefined) {
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
    await prisma.producto.findUnique({
      include: PRODUCTO_IMAGE_INCLUDE,
      where: { id: productId }
    })
  );
  const extension = getExtension(file);
  const objectName = `producto-${productId}-${Date.now()}.${extension}`;

  await minioClient.putObject(productBucket, objectName, file.buffer, file.size, {
    "Content-Type": file.mimetype
  });

  let productoActualizado;
  try {
    productoActualizado = await prisma.producto.update({
      data: {
        imagenUrl: objectName
      },
      include: PRODUCTO_IMAGE_INCLUDE,
      where: {
        id: productId
      }
    });
  } catch (error) {
    await deleteProductImageObject(objectName);
    throw error;
  }

  await deleteProductImageObject(producto.imagenUrl);

  return withProductImageUrl(productoActualizado);
}

export async function deleteProductImage(productId: number) {
  const producto = ensureProducto(
    await prisma.producto.findUnique({
      include: PRODUCTO_IMAGE_INCLUDE,
      where: { id: productId }
    })
  );

  const productoActualizado = await prisma.producto.update({
    data: {
      imagenUrl: null
    },
    include: PRODUCTO_IMAGE_INCLUDE,
    where: {
      id: productId
    }
  });

  await deleteProductImageObject(producto.imagenUrl);

  return withProductImageUrl(productoActualizado);
}
