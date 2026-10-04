import { Router } from "express";
import { abrirTurno, cerrarTurno, getCierres, getTurnoActual } from "../controllers/turnos.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/asyncHandler";

const router = Router();
router.get("/actual", requireAuth, asyncHandler(getTurnoActual));
router.get("/cierres", requireAuth, asyncHandler(getCierres));
router.post("/abrir", requireAuth, requireRole("cajero", "admin"), asyncHandler(abrirTurno));
router.post("/:id/cerrar", requireAuth, requireRole("cajero", "admin"), asyncHandler(cerrarTurno));
export default router;
