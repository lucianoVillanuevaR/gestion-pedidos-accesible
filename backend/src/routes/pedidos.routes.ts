import { Router } from "express";
import {
  actualizarEstadoPedido,
  actualizarPedido,
  crearPedido,
  getPedidoById,
  getPedidoHistorial,
  getPedidos
} from "../controllers/pedidos.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

const pedidosRoutes = Router();

pedidosRoutes.post("/", requireAuth, requireRole("cajero", "admin"), crearPedido);
pedidosRoutes.get("/", requireAuth, getPedidos);
pedidosRoutes.get("/:id", requireAuth, getPedidoById);
pedidosRoutes.get("/:id/historial", requireAuth, getPedidoHistorial);
pedidosRoutes.put("/:id", requireAuth, requireRole("cajero", "admin"), actualizarPedido);
pedidosRoutes.patch("/:id/estado", requireAuth, requireRole("cajero", "cocina", "admin"), actualizarEstadoPedido);

export default pedidosRoutes;
