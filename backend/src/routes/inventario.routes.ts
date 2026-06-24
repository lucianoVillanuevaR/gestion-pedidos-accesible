import { Router } from "express";
import { getInventario, updateInventarioProducto } from "../controllers/inventario.controller";
import { requireRole } from "../middlewares/auth";

const inventarioRoutes = Router();

inventarioRoutes.get("/", getInventario);
inventarioRoutes.patch("/:productoId", requireRole("cajero", "admin"), updateInventarioProducto);

export default inventarioRoutes;
