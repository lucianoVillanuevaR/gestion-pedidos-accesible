import { Router } from "express";
import { createCategoria, deleteCategoria, getCategorias } from "../controllers/categorias.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

const categoriasRoutes = Router();

categoriasRoutes.get("/", requireAuth, getCategorias);
categoriasRoutes.post("/", requireAuth, requireRole("cajero", "admin"), createCategoria);
categoriasRoutes.delete("/:id", requireAuth, requireRole("cajero", "admin"), deleteCategoria);

export default categoriasRoutes;
