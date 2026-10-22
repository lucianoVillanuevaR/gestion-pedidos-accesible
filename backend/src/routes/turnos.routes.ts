import { Router } from "express";
import { abrirTurno, cerrarTurno, getCierres, getTurnoActual } from "../controllers/turnos.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/asyncHandler";

const router = Router();
// Caja necesita el turno actual y sus cierres operativos; administración conserva el reporte completo.
router.get("/actual", requireAuth, requireRole("cajero", "admin"), asyncHandler(getTurnoActual));
router.get("/cierres", requireAuth, requireRole("cajero", "admin"), asyncHandler(getCierres));
router.post("/abrir", requireAuth, requireRole("cajero", "admin"), asyncHandler(abrirTurno));
router.post("/:id/cerrar", requireAuth, requireRole("cajero", "admin"), asyncHandler(cerrarTurno));
export default router;
