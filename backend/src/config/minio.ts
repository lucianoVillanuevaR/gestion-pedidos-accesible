import { Client } from "minio";

function readRequiredEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Variable de entorno requerida: ${name}`);
  }

  return value;
}

const endpoint = readRequiredEnv("MINIO_ENDPOINT", "localhost");
const port = Number(readRequiredEnv("MINIO_PORT", "9000"));
const accessKey = readRequiredEnv("MINIO_ACCESS_KEY", "admin");
const secretKey = readRequiredEnv("MINIO_SECRET_KEY", "admin123456");
const useSSL = (process.env.MINIO_USE_SSL ?? "false").toLowerCase() === "true";

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("MINIO_PORT debe ser un número válido");
}

export const productBucket = readRequiredEnv("MINIO_BUCKET_PRODUCTOS", "productos");
export const minioPublicUrl = (process.env.MINIO_PUBLIC_URL ?? `http://${endpoint}:${port}`).replace(/\/$/, "");

export const minioClient = new Client({
  endPoint: endpoint,
  port,
  useSSL,
  accessKey,
  secretKey
});

export async function ensureProductBucket() {
  const exists = await minioClient.bucketExists(productBucket);

  if (!exists) {
    await minioClient.makeBucket(productBucket);
  }

  if (process.env.NODE_ENV !== "production") {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${productBucket}/*`]
        }
      ]
    };

    await minioClient.setBucketPolicy(productBucket, JSON.stringify(policy));
  }
}
