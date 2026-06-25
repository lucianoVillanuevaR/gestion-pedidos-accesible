import { Router } from "express";
import healthRoutes from "./health.routes";
import productosRoutes from "./productos.routes";
import pedidosRoutes from "./pedidos.routes";
import inventarioRoutes from "./inventario.routes";
import authRoutes from "./auth.routes";
import turnosRoutes from "./turnos.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/turnos", turnosRoutes);
router.use("/productos", productosRoutes);
router.use("/pedidos", pedidosRoutes);
router.use("/inventario", inventarioRoutes);

export default router;
