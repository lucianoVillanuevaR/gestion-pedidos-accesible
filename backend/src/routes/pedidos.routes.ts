import { Router } from "express";
import { crearPedido, getPedidos, getPedidoById, actualizarEstadoPedido } from "../controllers/pedidos.controller";
import { requireRole } from "../middlewares/auth";

const pedidosRoutes = Router();

pedidosRoutes.post("/", requireRole("cajero", "admin"), crearPedido);
pedidosRoutes.get("/", getPedidos);
pedidosRoutes.get("/:id", getPedidoById);
pedidosRoutes.patch("/:id/estado", requireRole("cajero", "cocina", "admin"), actualizarEstadoPedido);

export default pedidosRoutes;
