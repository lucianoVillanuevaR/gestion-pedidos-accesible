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

const productosRoutes = Router();

productosRoutes.get("/", getProductos);
productosRoutes.post("/", createProducto);
productosRoutes.get("/:id", getProductoById);
productosRoutes.patch("/:id", updateProducto);
productosRoutes.delete("/:id", deleteProducto);
productosRoutes.post("/:id/imagen", uploadProductoImagen);
productosRoutes.delete("/:id/imagen", deleteProductoImagen);

export default productosRoutes;
