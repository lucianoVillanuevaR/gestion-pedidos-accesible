import { Router } from "express";
import {
  createProducto,
  deleteProducto,
  deleteProductoImagen,
  getProductos,
  getProductoById,
  updateProducto,
  uploadProductoImagen
} from "../controllers/productos.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/asyncHandler";

const productosRoutes = Router();

productosRoutes.get("/", requireAuth, asyncHandler(getProductos));
productosRoutes.post("/", requireAuth, requireRole("cajero", "admin"), asyncHandler(createProducto));
productosRoutes.get("/:id", requireAuth, asyncHandler(getProductoById));
productosRoutes.patch("/:id", requireAuth, requireRole("cajero", "admin"), asyncHandler(updateProducto));
productosRoutes.delete("/:id", requireAuth, requireRole("cajero", "admin"), asyncHandler(deleteProducto));
productosRoutes.post("/:id/imagen", requireAuth, requireRole("cajero", "admin"), uploadProductoImagen);
productosRoutes.delete("/:id/imagen", requireAuth, requireRole("cajero", "admin"), asyncHandler(deleteProductoImagen));

export default productosRoutes;
