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
import { asyncHandler } from "../middlewares/asyncHandler";

const pedidosRoutes = Router();

pedidosRoutes.post("/", requireAuth, requireRole("cajero", "admin"), asyncHandler(crearPedido));
pedidosRoutes.get("/", requireAuth, asyncHandler(getPedidos));
pedidosRoutes.get("/:id", requireAuth, asyncHandler(getPedidoById));
pedidosRoutes.get("/:id/historial", requireAuth, asyncHandler(getPedidoHistorial));
pedidosRoutes.put("/:id", requireAuth, requireRole("cajero", "admin"), asyncHandler(actualizarPedido));
pedidosRoutes.patch(
  "/:id/estado",
  requireAuth,
  requireRole("cajero", "cocina", "admin"),
  asyncHandler(actualizarEstadoPedido)
);

export default pedidosRoutes;
