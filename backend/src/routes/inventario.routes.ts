import { Router } from "express";
import { getInventario, updateInventarioProducto } from "../controllers/inventario.controller";

const inventarioRoutes = Router();

inventarioRoutes.get("/", getInventario);
inventarioRoutes.patch("/:productoId", updateInventarioProducto);

export default inventarioRoutes;
