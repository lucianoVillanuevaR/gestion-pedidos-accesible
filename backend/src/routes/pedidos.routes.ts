import { Router } from "express";
import {
  crearPedido,
  getPedidos,
  getPedidoById,
  actualizarEstadoPedido
} from "../controllers/pedidos.controller";

const pedidosRoutes = Router();

pedidosRoutes.post("/", crearPedido);
pedidosRoutes.get("/", getPedidos);
pedidosRoutes.get("/:id", getPedidoById);
pedidosRoutes.patch("/:id/estado", actualizarEstadoPedido);

export default pedidosRoutes;
