import { Router } from "express";
import { getAdminDashboard } from "../controllers/adminDashboard.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.get("/dashboard", requireAuth, requireRole("admin"), getAdminDashboard);

export default router;
