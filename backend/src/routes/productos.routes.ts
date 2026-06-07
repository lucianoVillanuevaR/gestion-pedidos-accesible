import { Router } from "express";
import { createProducto, getProductos, getProductoById, updateProducto } from "../controllers/productos.controller";

const productosRoutes = Router();

productosRoutes.get("/", getProductos);
productosRoutes.post("/", createProducto);
productosRoutes.get("/:id", getProductoById);
productosRoutes.patch("/:id", updateProducto);

export default productosRoutes;
