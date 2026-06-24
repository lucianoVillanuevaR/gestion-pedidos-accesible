import dotenv from "dotenv";

dotenv.config();

const developmentJwtSecret = "clave-demo-solo-desarrollo";

export function resolveJwtSecret(nodeEnv: string | undefined, configuredSecret: string | undefined) {
  const secret = configuredSecret?.trim();

  if (nodeEnv === "production" && (!secret || secret === developmentJwtSecret)) {
    throw new Error("JWT_SECRET es obligatorio y debe ser seguro en producción");
  }

  return secret || developmentJwtSecret;
}

const jwtSecret = resolveJwtSecret(process.env.NODE_ENV, process.env.JWT_SECRET);

export const env = {
  port: Number(process.env.PORT ?? 3000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  jwtSecret
};
