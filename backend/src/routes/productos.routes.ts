import { Router } from "express";
import {
  createProducto,
  deleteProductoImagen,
  getProductos,
  getProductoById,
  updateProducto,
  uploadProductoImagen
} from "../controllers/productos.controller";

const productosRoutes = Router();

productosRoutes.get("/", getProductos);
productosRoutes.post("/", createProducto);
productosRoutes.get("/:id", getProductoById);
productosRoutes.patch("/:id", updateProducto);
productosRoutes.post("/:id/imagen", uploadProductoImagen);
productosRoutes.delete("/:id/imagen", deleteProductoImagen);

export default productosRoutes;
