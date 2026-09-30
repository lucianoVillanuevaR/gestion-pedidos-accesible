import { Router } from "express";
import { getInventario, updateInventarioProducto } from "../controllers/inventario.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/asyncHandler";

const inventarioRoutes = Router();

inventarioRoutes.get("/", requireAuth, asyncHandler(getInventario));
inventarioRoutes.patch(
  "/:productoId",
  requireAuth,
  requireRole("cajero", "admin"),
  asyncHandler(updateInventarioProducto)
);

export default inventarioRoutes;
