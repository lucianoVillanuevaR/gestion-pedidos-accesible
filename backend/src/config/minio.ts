import { Client } from "minio";
import { env } from "./env";

export const productBucket = env.minio.productBucket;
export const minioPublicUrl = env.minio.publicUrl;

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
