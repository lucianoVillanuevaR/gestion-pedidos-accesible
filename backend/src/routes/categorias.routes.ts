import { Router } from "express";
import { createCategoria, deleteCategoria, getCategorias, updateCategoria } from "../controllers/categorias.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/asyncHandler";

const categoriasRoutes = Router();

categoriasRoutes.get("/", requireAuth, asyncHandler(getCategorias));
categoriasRoutes.post("/", requireAuth, requireRole("cajero", "admin"), asyncHandler(createCategoria));
categoriasRoutes.patch("/:id", requireAuth, requireRole("cajero", "admin"), asyncHandler(updateCategoria));
categoriasRoutes.delete("/:id", requireAuth, requireRole("cajero", "admin"), asyncHandler(deleteCategoria));

export default categoriasRoutes;
