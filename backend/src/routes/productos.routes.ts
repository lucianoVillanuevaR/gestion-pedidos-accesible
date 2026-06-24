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
import { requireRole } from "../middlewares/auth";

const productosRoutes = Router();

productosRoutes.get("/", getProductos);
productosRoutes.post("/", requireRole("cajero", "admin"), createProducto);
productosRoutes.get("/:id", getProductoById);
productosRoutes.patch("/:id", requireRole("cajero", "admin"), updateProducto);
productosRoutes.delete("/:id", requireRole("cajero", "admin"), deleteProducto);
productosRoutes.post("/:id/imagen", requireRole("cajero", "admin"), uploadProductoImagen);
productosRoutes.delete("/:id/imagen", requireRole("cajero", "admin"), deleteProductoImagen);

export default productosRoutes;
