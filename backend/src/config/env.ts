import dotenv from "dotenv";

dotenv.config();

const developmentJwtSecret = "clave-demo-solo-desarrollo";
const isProduction = process.env.NODE_ENV === "production";

function requiredInProduction(name: string, developmentDefault?: string) {
  const configured = process.env[name]?.trim();
  if (isProduction && !configured) throw new Error(`${name} es obligatorio en producción`);
  if (!configured && !developmentDefault) throw new Error(`Variable de entorno requerida: ${name}`);
  return configured || (developmentDefault as string);
}

function validPort(name: string, value: string | undefined, fallback: number) {
  const port = Number(value ?? fallback);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error(`${name} debe ser un puerto válido`);
  return port;
}

function validUrl(name: string, value: string) {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${name} debe ser una URL válida`);
  }
}

export function resolveJwtSecret(nodeEnv: string | undefined, configuredSecret: string | undefined) {
  const secret = configuredSecret?.trim();

  if (nodeEnv === "production" && (!secret || secret === developmentJwtSecret)) {
    throw new Error("JWT_SECRET es obligatorio y debe ser seguro en producción");
  }

  return secret || developmentJwtSecret;
}

const jwtSecret = resolveJwtSecret(process.env.NODE_ENV, process.env.JWT_SECRET);

export const env = {
  port: validPort("PORT", process.env.PORT, 3000),
  clientUrl: validUrl("CLIENT_URL", requiredInProduction("CLIENT_URL", "http://localhost:5173")),
  databaseUrl: requiredInProduction("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/riquisimo"),
  jwtSecret,
  minio: {
    endpoint: requiredInProduction("MINIO_ENDPOINT", "localhost"),
    port: validPort("MINIO_PORT", process.env.MINIO_PORT, 9000),
    accessKey: requiredInProduction("MINIO_ACCESS_KEY", "admin"),
    secretKey: requiredInProduction("MINIO_SECRET_KEY", "admin123456"),
    productBucket: requiredInProduction("MINIO_BUCKET_PRODUCTOS", "productos"),
    publicUrl: (process.env.MINIO_PUBLIC_URL?.trim() || "/media").replace(/\/$/, ""),
    useSSL: (process.env.MINIO_USE_SSL ?? "false").toLowerCase() === "true",
    allowPublicProductRead: (process.env.MINIO_PUBLIC_READ ?? "false").toLowerCase() === "true"
  }
};
