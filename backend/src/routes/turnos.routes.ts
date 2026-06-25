import { Router } from "express";
import { abrirTurno, cerrarTurno, getCierres, getTurnoActual } from "../controllers/turnos.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();
router.get("/actual", requireAuth, getTurnoActual);
router.get("/cierres", requireAuth, getCierres);
router.post("/abrir", requireAuth, requireRole("cajero", "admin"), abrirTurno);
router.post("/:id/cerrar", requireAuth, requireRole("cajero", "admin"), cerrarTurno);
export default router;
