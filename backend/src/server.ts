import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { ensureProductBucketWithRetry } from "./config/minio";
import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";

const app = express();

app.disable("x-powered-by");
// Solo se confía en la cantidad conocida de proxies de la instalación.
app.set("trust proxy", env.trustProxyHops);
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

app.use(errorHandler);

async function startServer() {
  try {
    await ensureProductBucketWithRetry();
  } catch (error) {
    console.warn(
      "MinIO no está disponible después de los reintentos; las imágenes funcionarán en modo degradado.",
      error
    );
  }

  app.listen(env.port, () => {
    console.log(`Backend running on port ${env.port}`);
  });
}

void startServer();
