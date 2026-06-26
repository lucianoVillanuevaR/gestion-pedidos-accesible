import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { env } from "./config/env";
import { ensureProductBucket } from "./config/minio";
import routes from "./routes";

const app = express();

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(
  cors({
    origin: env.clientUrl
  })
);
app.use(express.json({ limit: "100kb" }));

app.use("/api", routes);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  // Express identifica los handlers de error por recibir cuatro argumentos.
  void next;

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "JSON inválido" });
  }

  if (error instanceof Error && "type" in error && error.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload demasiado grande" });
  }

  console.error("Error no controlado:", error);
  return res.status(500).json({ error: "Error interno del servidor" });
});

async function startServer() {
  try {
    await ensureProductBucket();
  } catch (error) {
    console.error("No se pudo conectar a MinIO. Revisa variables de entorno o servicio Docker.", error);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`Backend running on port ${env.port}`);
  });
}

void startServer();
