import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { minioClient, productBucket } from "../config/minio";

export function getHealth(_request: Request, response: Response) {
  response.json({
    status: "ok",
    message: "Backend running"
  });
}

export async function getReady(_request: Request, response: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return response.status(503).json({ status: "no_disponible", database: false, minio: false });
  }

  let minio: boolean;
  try {
    minio = await minioClient.bucketExists(productBucket);
  } catch {
    minio = false;
  }
  if (!minio) {
    return response.status(503).json({ status: "no_disponible", database: true, minio: false });
  }

  return response.json({ status: "listo", database: true, minio: true });
}
