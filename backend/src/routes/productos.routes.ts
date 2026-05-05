import { Router } from "express";
import { getProductos, getProductoById } from "../controllers/productos.controller";

const productosRoutes = Router();

productosRoutes.get("/", getProductos);
productosRoutes.get("/:id", getProductoById);

export default productosRoutes;
