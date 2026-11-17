import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import { env } from "./env";

export const productBucket = env.minio.productBucket;

const s3 = new S3Client({
  endpoint: `${env.minio.useSSL ? "https" : "http"}://${env.minio.endpoint}:${env.minio.port}`,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: env.minio.accessKey, secretAccessKey: env.minio.secretKey },
  requestChecksumCalculation: "WHEN_REQUIRED"
});

function isMissingBucket(error: unknown) {
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.name === "NoSuchBucket" || candidate.$metadata?.httpStatusCode === 404;
}

// Interfaz pequeña para las operaciones S3 utilizadas por el proyecto.
// Mantiene el bucket, las claves y las URLs existentes.
export const minioClient = {
  async bucketExists(bucket: string) {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      return true;
    } catch (error) {
      if (isMissingBucket(error)) return false;
      throw error;
    }
  },
  async makeBucket(bucket: string) {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  },
  async setBucketPolicy(bucket: string, policy: string) {
    await s3.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: policy }));
  },
  async putObject(bucket: string, key: string, data: Buffer, size: number, metadata: { "Content-Type": string }) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentLength: size,
        ContentType: metadata["Content-Type"]
      })
    );
  },
  async getObject(bucket: string, key: string): Promise<Readable> {
    const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!response.Body) throw new Error("El objeto no contiene datos.");
    return response.Body as Readable;
  },
  async removeObject(bucket: string, key: string) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
};

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
