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

const productosRoutes = Router();

productosRoutes.get("/", requireAuth, getProductos);
productosRoutes.post("/", requireAuth, requireRole("cajero", "admin"), createProducto);
productosRoutes.get("/:id", requireAuth, getProductoById);
productosRoutes.patch("/:id", requireAuth, requireRole("cajero", "admin"), updateProducto);
productosRoutes.delete("/:id", requireAuth, requireRole("cajero", "admin"), deleteProducto);
productosRoutes.post("/:id/imagen", requireAuth, requireRole("cajero", "admin"), uploadProductoImagen);
productosRoutes.delete("/:id/imagen", requireAuth, requireRole("cajero", "admin"), deleteProductoImagen);

export default productosRoutes;
