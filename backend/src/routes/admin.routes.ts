import { Router } from "express";
import { getAdminDashboard } from "../controllers/adminDashboard.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/asyncHandler";

const router = Router();

router.get("/dashboard", requireAuth, requireRole("admin"), asyncHandler(getAdminDashboard));

export default router;
