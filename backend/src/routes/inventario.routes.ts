import { Router } from "express";
import { getInventario, updateInventarioProducto } from "../controllers/inventario.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

const inventarioRoutes = Router();

inventarioRoutes.get("/", requireAuth, getInventario);
inventarioRoutes.patch("/:productoId", requireAuth, requireRole("cajero", "admin"), updateInventarioProducto);

export default inventarioRoutes;
