import { Router } from "express";
import { createUsuario, getUsuarios, updateUsuario } from "../controllers/usuarios.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", getUsuarios);
router.post("/", createUsuario);
router.patch("/:id", updateUsuario);

export default router;
