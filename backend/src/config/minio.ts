import { Client } from "minio";
import { env } from "./env";

export const productBucket = env.minio.productBucket;

export const minioClient = new Client({
  endPoint: env.minio.endpoint,
  port: env.minio.port,
  useSSL: env.minio.useSSL,
  accessKey: env.minio.accessKey,
  secretKey: env.minio.secretKey
});

export async function ensureProductBucket() {
  const exists = await minioClient.bucketExists(productBucket);
  if (!exists) await minioClient.makeBucket(productBucket);

  if (process.env.NODE_ENV !== "production" || env.minio.allowPublicProductRead) {
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

type ProductBucketRetryOptions = {
  attempts?: number;
  initialDelayMs?: number;
  ensure?: () => Promise<void>;
  wait?: (milliseconds: number) => Promise<void>;
};

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function ensureProductBucketWithRetry(options: ProductBucketRetryOptions = {}) {
  const attempts = options.attempts ?? 5;
  const initialDelayMs = options.initialDelayMs ?? 250;
  const ensure = options.ensure ?? ensureProductBucket;
  const waitForRetry = options.wait ?? wait;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await ensure();
      return;
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        const delayMs = initialDelayMs * 2 ** (attempt - 1);
        console.warn(`MinIO no está disponible (intento ${attempt}/${attempts}); reintentando en ${delayMs} ms.`);
        await waitForRetry(delayMs);
      }
    }
  }

  throw lastError;
}
