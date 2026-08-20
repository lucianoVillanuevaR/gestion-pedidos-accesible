import { Router } from "express";
import { createCategoria, deleteCategoria, getCategorias, updateCategoria } from "../controllers/categorias.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

const categoriasRoutes = Router();

categoriasRoutes.get("/", requireAuth, getCategorias);
categoriasRoutes.post("/", requireAuth, requireRole("cajero", "admin"), createCategoria);
categoriasRoutes.patch("/:id", requireAuth, requireRole("cajero", "admin"), updateCategoria);
categoriasRoutes.delete("/:id", requireAuth, requireRole("cajero", "admin"), deleteCategoria);

export default categoriasRoutes;
