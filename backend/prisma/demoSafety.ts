import type { Prisma } from "@prisma/client";
import { lockTurnOperations } from "../src/services/databaseLocks";

export function assertDemoEnvironment(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== "development" || env.DEMO_MODE !== "true") {
    throw new Error("Demo abortada: requiere NODE_ENV=development y DEMO_MODE=true.");
  }
  let url: URL;
  try {
    url = new URL(env.DATABASE_URL ?? "");
  } catch {
    throw new Error("DATABASE_URL inválida.");
  }
  if (
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    decodeURIComponent(url.pathname) !== "/riquisimo_demo" ||
    !["postgres", "localhost", "127.0.0.1"].includes(url.hostname) ||
    (url.searchParams.has("schema") && url.searchParams.get("schema") !== "public")
  ) {
    throw new Error("Demo abortada: requiere la base local exclusiva riquisimo_demo (schema public).");
  }
}

export function requireDemoPassword(value: string | undefined) {
  if (!value || value.length < 12 || ["cambiar_clave_demo", "cambiar_clave_demo_segura"].includes(value)) {
    throw new Error("Configura SEED_DEMO_PASSWORD con una clave propia de al menos 12 caracteres.");
  }
  return value;
}

export async function lockDemoDatabase(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(73190217)`;
  await lockTurnOperations(tx);
  const target = await tx.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  if (target[0]?.name !== "riquisimo_demo") throw new Error("Conexión demo inesperada.");
}
