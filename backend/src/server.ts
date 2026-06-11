import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { env } from "./config/env";
import { ensureProductBucket } from "./config/minio";
import routes from "./routes";

const app = express();

app.use(
  cors({
    origin: env.clientUrl
  })
);
app.use(express.json({ limit: "100kb" }));

app.use("/api", routes);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "JSON inválido" });
  }

  if (error instanceof Error && "type" in error && error.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload demasiado grande" });
  }

  next(error);
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
