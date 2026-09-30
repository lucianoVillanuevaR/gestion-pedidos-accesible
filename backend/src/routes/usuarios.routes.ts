import { Router } from "express";
import { createUsuario, getUsuarios, updateUsuario } from "../controllers/usuarios.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", asyncHandler(getUsuarios));
router.post("/", asyncHandler(createUsuario));
router.patch("/:id", asyncHandler(updateUsuario));

export default router;
