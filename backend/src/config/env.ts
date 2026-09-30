import dotenv from "dotenv";

dotenv.config();

const developmentJwtSecret = "clave-demo-solo-desarrollo";
const isProduction = process.env.NODE_ENV === "production";
const developmentDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/riquisimo";
const exampleDatabaseUrl = "postgresql://admin:admin123@postgres:5432/sistema_pedidos";
const jwtPlaceholders = new Set([
  developmentJwtSecret,
  "changeme",
  "cambiar_esta_clave_en_produccion_por_una_larga_y_segura"
]);

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

function validProxyHops(value: string | undefined) {
  const hops = Number(value ?? 1);
  if (!Number.isInteger(hops) || hops < 1 || hops > 2) {
    throw new Error("TRUST_PROXY_HOPS debe ser 1 o 2");
  }
  return hops;
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

  if (nodeEnv === "production" && (!secret || secret.length < 32 || jwtPlaceholders.has(secret.toLowerCase()))) {
    throw new Error("JWT_SECRET es obligatorio y debe tener al menos 32 caracteres seguros en producción");
  }

  return secret || developmentJwtSecret;
}

export function resolveDatabaseUrl(nodeEnv: string | undefined, configuredUrl: string | undefined) {
  const value = configuredUrl?.trim() || (nodeEnv === "production" ? "" : developmentDatabaseUrl);
  if (!value) throw new Error("DATABASE_URL es obligatorio en producción");

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("DATABASE_URL debe ser una URL PostgreSQL válida");
  }
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("DATABASE_URL debe ser una URL PostgreSQL válida");
  }

  if (
    nodeEnv === "production" &&
    (value === developmentDatabaseUrl ||
      value === exampleDatabaseUrl ||
      ["postgres", "admin123"].includes(parsed.password))
  ) {
    throw new Error("DATABASE_URL no puede usar credenciales demo en producción");
  }

  return value;
}

export function resolveMinioCredential(
  nodeEnv: string | undefined,
  name: "MINIO_ACCESS_KEY" | "MINIO_SECRET_KEY",
  configuredValue: string | undefined,
  developmentDefault: string
) {
  const value = configuredValue?.trim() || (nodeEnv === "production" ? "" : developmentDefault);
  if (!value) throw new Error(`${name} es obligatorio en producción`);

  const demoValues =
    name === "MINIO_ACCESS_KEY"
      ? new Set(["admin", "minioadmin"])
      : new Set(["admin123456", "minioadmin123", "changeme", "cambiar_clave_demo"]);
  if (nodeEnv === "production" && demoValues.has(value.toLowerCase())) {
    throw new Error(`${name} no puede usar credenciales demo en producción`);
  }

  return value;
}

const jwtSecret = resolveJwtSecret(process.env.NODE_ENV, process.env.JWT_SECRET);

export const env = {
  port: validPort("PORT", process.env.PORT, 3000),
  clientUrl: validUrl("CLIENT_URL", requiredInProduction("CLIENT_URL", "http://localhost:5173")),
  databaseUrl: resolveDatabaseUrl(process.env.NODE_ENV, process.env.DATABASE_URL),
  jwtSecret,
  trustProxyHops: validProxyHops(process.env.TRUST_PROXY_HOPS),
  minio: {
    endpoint: requiredInProduction("MINIO_ENDPOINT", "localhost"),
    port: validPort("MINIO_PORT", process.env.MINIO_PORT, 9000),
    accessKey: resolveMinioCredential(process.env.NODE_ENV, "MINIO_ACCESS_KEY", process.env.MINIO_ACCESS_KEY, "admin"),
    secretKey: resolveMinioCredential(
      process.env.NODE_ENV,
      "MINIO_SECRET_KEY",
      process.env.MINIO_SECRET_KEY,
      "admin123456"
    ),
    productBucket: requiredInProduction("MINIO_BUCKET_PRODUCTOS", "productos"),
    publicUrl: (process.env.MINIO_PUBLIC_URL?.trim() || "/media").replace(/\/$/, ""),
    useSSL: (process.env.MINIO_USE_SSL ?? "false").toLowerCase() === "true",
    allowPublicProductRead: (process.env.MINIO_PUBLIC_READ ?? "false").toLowerCase() === "true"
  }
};
