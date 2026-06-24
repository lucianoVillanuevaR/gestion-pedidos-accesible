import { Router } from "express";
import { abrirTurno, cerrarTurno, getCierres, getTurnoActual } from "../controllers/turnos.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();
router.use(requireAuth);
router.get("/actual", getTurnoActual);
router.get("/cierres", getCierres);
router.post("/abrir", requireRole("cajero", "admin"), abrirTurno);
router.post("/:id/cerrar", requireRole("cajero", "admin"), cerrarTurno);
export default router;
