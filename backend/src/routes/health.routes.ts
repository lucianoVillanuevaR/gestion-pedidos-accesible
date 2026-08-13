import { Router } from "express";
import { getHealth, getReady } from "../controllers/health.controller";

const healthRoutes = Router();

healthRoutes.get("/", getHealth);
healthRoutes.get("/ready", getReady);

export default healthRoutes;
