import { Router } from "express";
import { crearPedido, getPedidos, getPedidoById, actualizarEstadoPedido } from "../controllers/pedidos.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

const pedidosRoutes = Router();

pedidosRoutes.post("/", requireAuth, requireRole("cajero", "admin"), crearPedido);
pedidosRoutes.get("/", requireAuth, getPedidos);
pedidosRoutes.get("/:id", requireAuth, getPedidoById);
pedidosRoutes.patch("/:id/estado", requireAuth, requireRole("cajero", "cocina", "admin"), actualizarEstadoPedido);

export default pedidosRoutes;
