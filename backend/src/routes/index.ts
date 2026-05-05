import { Router } from "express";
import healthRoutes from "./health.routes";
import productosRoutes from "./productos.routes";
import pedidosRoutes from "./pedidos.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/productos", productosRoutes);
router.use("/pedidos", pedidosRoutes);

export default router;
