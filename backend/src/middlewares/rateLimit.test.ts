import express from "express";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createFailedLoginRateLimit } from "./rateLimit";

const servers: Server[] = [];

async function createTestServer(now: () => number, maxFailures = 2) {
  const app = express();
  app.set("trust proxy", 1);
  const limiter = createFailedLoginRateLimit({
    maxFailures,
    windowMs: 60_000,
    message: "Límite alcanzado",
    now
  });
  app.post("/login", limiter, (req, res) => {
    if (req.header("X-Test-Success") === "true") return res.json({ ok: true, ip: req.ip });
    return res.status(401).json({ ok: false, ip: req.ip });
  });
  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No se pudo iniciar servidor de prueba");
  return `http://127.0.0.1:${address.port}/login`;
}

async function login(url: string, ip: string, success = false) {
  return fetch(url, {
    method: "POST",
    headers: { "X-Forwarded-For": ip, ...(success ? { "X-Test-Success": "true" } : {}) }
  });
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

describe("limitador de intentos fallidos", () => {
  it("separa contadores por IP y reconoce X-Forwarded-For detrás del proxy", async () => {
    const url = await createTestServer(() => 1_000);
    expect((await (await login(url, "203.0.113.10")).json()).ip).toBe("203.0.113.10");
    await login(url, "203.0.113.10");
    expect((await login(url, "203.0.113.10")).status).toBe(429);
    expect((await login(url, "203.0.113.11")).status).toBe(401);
  });

  it("devuelve 429 con Retry-After al superar el límite", async () => {
    const url = await createTestServer(() => 1_000);
    await login(url, "203.0.113.20");
    await login(url, "203.0.113.20");
    const blocked = await login(url, "203.0.113.20");
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("60");
  });

  it("reinicia la ventana y limpia fallos después de un login correcto", async () => {
    let time = 1_000;
    const url = await createTestServer(() => time);
    await login(url, "203.0.113.30");
    expect((await login(url, "203.0.113.30", true)).status).toBe(200);
    await login(url, "203.0.113.30");
    expect((await login(url, "203.0.113.30")).status).toBe(401);
    expect((await login(url, "203.0.113.30")).status).toBe(429);
    time += 60_001;
    expect((await login(url, "203.0.113.30")).status).toBe(401);
  });
});
