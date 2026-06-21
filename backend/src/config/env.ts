import dotenv from "dotenv";

dotenv.config();

const developmentJwtSecret = "clave-demo-solo-desarrollo";
const jwtSecret = process.env.JWT_SECRET ?? developmentJwtSecret;

if (process.env.NODE_ENV === "production" && jwtSecret === developmentJwtSecret) {
  throw new Error("JWT_SECRET es obligatorio y debe cambiarse en producción");
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  jwtSecret
};
