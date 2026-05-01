import cors from "cors";
import express from "express";
import { env } from "./config/env";
import routes from "./routes";

const app = express();

app.use(
  cors({
    origin: env.clientUrl
  })
);
app.use(express.json());

app.use("/api", routes);

app.listen(env.port, () => {
  console.log(`Backend running on port ${env.port}`);
});
