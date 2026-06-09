import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { ensureProductBucket } from "./config/minio";
import routes from "./routes";

const app = express();

app.use(
  cors({
    origin: env.clientUrl
  })
);
app.use(express.json());

app.use("/api", routes);

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
