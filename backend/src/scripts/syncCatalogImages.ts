import prisma from "../config/prisma";
import { minioClient, productBucket } from "../config/minio";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

// Correspondencias confirmadas por los nombres originales y el alias del frontend.
const assets = new Map([
  [
    "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección",
    "2x1 Sandwich Iguales, Carne y 2 ingredientes a Elección.webp"
  ],
  ["ARMA TU SANDWICH", "ARMA TU SANDWICH.webp"],
  ["BARROS LUCO SANDWICH", "BARROS LUCO SANDWICH.webp"],
  ["CHACARERO SANDWICH", "CHACARERO SANDWICHç.webp"],
  ["Completo Alemán", "Completo Aleman.webp"],
  ["Completo Dinámico", "Completo Dinámico.webp"],
  ["Completo Hass Italiano", "Completo Hass Italiano.webp"],
  ["Completo Italiano", "Completo Italiano.webp"]
]);
const digest = (data: Buffer) => createHash("sha256").update(data).digest("hex");

async function objectContent(key: string): Promise<Buffer | null> {
  try {
    const stream = await minioClient.getObject(productBucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  } catch (error) {
    const missing = error as { code?: string; name?: string; $metadata?: { httpStatusCode?: number } };
    if (
      ["NoSuchKey", "NotFound", "NoSuchObject"].includes(missing.code ?? missing.name ?? "") ||
      missing.$metadata?.httpStatusCode === 404
    )
      return null;
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL requerida.");
  const apply = process.argv.includes("--apply");
  const directory = process.env.CATALOG_IMAGE_DIR || resolve(process.cwd(), "../frontend/src/products");
  const products = await prisma.producto.findMany({ select: { id: true, nombre: true, imagenUrl: true } });
  // Leer todas las fuentes antes de cualquier escritura.
  const files = new Map(
    await Promise.all(
      [...assets].map(async ([name, file]) => [name, { file, data: await readFile(resolve(directory, file)) }] as const)
    )
  );
  if (!(await minioClient.bucketExists(productBucket))) {
    if (!apply) throw new Error("Bucket ausente. Inicia el backend o ejecuta --apply para crearlo.");
    await minioClient.makeBucket(productBucket);
  }
  let broken = 0;
  for (const product of products) {
    if (product.imagenUrl) {
      const prefix = `/media/${productBucket}/`;
      const key = product.imagenUrl.startsWith(prefix)
        ? decodeURIComponent(product.imagenUrl.slice(prefix.length))
        : product.imagenUrl;
      if (/^(https?:|\/)/.test(key)) {
        console.log(`${product.nombre}: URL externa conservada; verificar manualmente.`);
      } else {
        const found = await objectContent(key);
        console.log(
          `${product.nombre}: ${found ? "objeto existente conservado" : "objeto ausente; URL conservada para revisión"}.`
        );
        if (!found) broken++;
      }
      continue;
    }
    const source = files.get(product.nombre);
    if (!source) {
      console.log(`${product.nombre}: sin fotografía original confirmada.`);
      continue;
    }
    const hash = digest(source.data);
    const key = `catalogo/${hash}/${source.file}`;
    const stored = await objectContent(key);
    if (stored && digest(stored) !== hash) throw new Error("Objeto en conflicto: no se sobrescribirá.");
    if (apply) {
      if (!stored)
        await minioClient.putObject(productBucket, key, source.data, source.data.length, {
          "Content-Type": "image/webp"
        });
      const verified = await objectContent(key);
      if (!verified || digest(verified) !== hash) throw new Error("Falló la verificación SHA-256 del objeto.");
      // Una modificación concurrente del administrador siempre tiene prioridad.
      await prisma.producto.updateMany({ where: { id: product.id, imagenUrl: null }, data: { imagenUrl: key } });
    }
    console.log(`${product.nombre}: ${apply ? "sincronizada y verificada" : "pendiente de sincronizar (--apply)"}.`);
  }
  if (broken) throw new Error(`${broken} referencias existentes necesitan revisión; ninguna fue reemplazada.`);
}

main()
  .catch(() => {
    console.error(
      "Sincronización incompleta. Revisa el informe anterior, conexión, bucket y archivos; no se muestran credenciales."
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
