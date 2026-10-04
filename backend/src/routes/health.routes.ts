import { Router } from "express";
import { getHealth, getReady } from "../controllers/health.controller";
import { asyncHandler } from "../middlewares/asyncHandler";

const healthRoutes = Router();

healthRoutes.get("/", getHealth);
healthRoutes.get("/ready", asyncHandler(getReady));

export default healthRoutes;
