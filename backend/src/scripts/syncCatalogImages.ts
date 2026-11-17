import prisma from "../config/prisma";
import { minioClient, productBucket } from "../config/minio";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const EXPECTED_DATABASE = "sistema_pedidos";
const sourceDirectory =
  process.env.CATALOG_IMAGE_DIR?.trim() || "/catalog-images";

const imageAssets = [
  [
    "2x1 Sandwich Iguales, Carne y 2 ingredientes a Elección.webp",
    "catalogo/2x1-sandwich-iguales.webp",
  ],
  ["ARMA TU SANDWICH.webp", "catalogo/arma-tu-sandwich.webp"],
  ["BARROS LUCO SANDWICH.webp", "catalogo/barros-luco-sandwich.webp"],
  ["CHACARERO SANDWICHç.webp", "catalogo/chacarero-sandwich.webp"],
  ["Completo Aleman.webp", "catalogo/completo-aleman.webp"],
  ["Completo Dinámico.webp", "catalogo/completo-dinamico.webp"],
  ["Completo Hass Italiano.webp", "catalogo/completo-hass-italiano.webp"],
  ["Completo Italiano.webp", "catalogo/completo-italiano.webp"],
] as const;

const productImageAssignments = new Map<string, string>([
  ["2x1 Completo Italiano o Alemán", "catalogo/completo-italiano.webp"],
  [
    "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección",
    "catalogo/2x1-sandwich-iguales.webp",
  ],
  [
    "2x1 Sandwich Italiano Carne a Elección",
    "catalogo/2x1-sandwich-iguales.webp",
  ],
  ["4 Completos Alemanes", "catalogo/completo-aleman.webp"],
  ["ARMA TU SANDWICH", "catalogo/arma-tu-sandwich.webp"],
  ["BARROS LUCO SANDWICH", "catalogo/barros-luco-sandwich.webp"],
  ["CHACARERO SANDWICH", "catalogo/chacarero-sandwich.webp"],
  ["Completo Alemán", "catalogo/completo-aleman.webp"],
  ["Completo Dinámico", "catalogo/completo-dinamico.webp"],
  ["Completo Hass Italiano", "catalogo/completo-hass-italiano.webp"],
  ["Completo Italiano", "catalogo/completo-italiano.webp"],
  ["SANDWICH LUCO PATRÓN", "catalogo/barros-luco-sandwich.webp"],
]);

function assertLocalDevelopmentTarget() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Sincronización abortada: no se permite con NODE_ENV=production.",
    );
  }
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL no está configurada.");
  const databaseUrl = new URL(process.env.DATABASE_URL);
  const databaseName = databaseUrl.pathname.replace(/^\//, "");
  const localHosts = new Set(["postgres", "localhost", "127.0.0.1"]);
  if (
    databaseName !== EXPECTED_DATABASE ||
    !localHosts.has(databaseUrl.hostname)
  ) {
    throw new Error(
      `Sincronización abortada: se esperaba ${EXPECTED_DATABASE} en Docker local y se detectó ${databaseName}@${databaseUrl.hostname}.`,
    );
  }
  if (!process.argv.includes("--confirm-local-sync")) {
    throw new Error("Sincronización abortada: falta --confirm-local-sync.");
  }
}

async function main() {
  assertLocalDevelopmentTarget();
  if (!(await minioClient.bucketExists(productBucket))) {
    throw new Error(`No existe el bucket ${productBucket}.`);
  }

  for (const [filename, objectName] of imageAssets) {
    const content = await readFile(resolve(sourceDirectory, filename));
    await minioClient.putObject(
      productBucket,
      objectName,
      content,
      content.length,
      {
        "Content-Type": "image/webp",
      },
    );
    const stored = await minioClient.statObject(productBucket, objectName);
    if (stored.size !== content.length)
      throw new Error(`La verificación de ${objectName} no coincide.`);
  }

  await prisma.$transaction(async (tx) => {
    const products = await tx.producto.findMany({
      select: { id: true, nombre: true },
    });
    if (products.length !== productImageAssignments.size) {
      throw new Error(
        `Se esperaban ${productImageAssignments.size} productos y se encontraron ${products.length}.`,
      );
    }
    for (const product of products) {
      const imageUrl = productImageAssignments.get(product.nombre);
      if (!imageUrl)
        throw new Error(
          `No existe una fotografía asignada para ${product.nombre}.`,
        );
      await tx.producto.update({
        where: { id: product.id },
        data: { imagenUrl: imageUrl },
      });
    }
  });

  console.log(
    `${imageAssets.length} fotografías verificadas y ${productImageAssignments.size} productos vinculados.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
