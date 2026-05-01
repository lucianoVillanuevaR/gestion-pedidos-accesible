import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://admin:admin123@postgres:5432/sistema_pedidos"
};
