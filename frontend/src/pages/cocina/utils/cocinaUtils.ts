import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { EstadoPedido, PedidoResponse } from "../../../types";
import { getPedidoDisplayNumber, isPedidoDelayed, type ActiveModal } from "../../pedidos/PedidosShared";

export function getKitchenTicketState(pedido: PedidoResponse) {
  return {
    delayed: isPedidoDelayed(pedido),
    isPending: pedido.estado === "pendiente",
    isPreparing: pedido.estado === "en_preparacion",
    isReady: pedido.estado === "listo",
    numeroPedido: getPedidoDisplayNumber(pedido)
  };
}

export function getKitchenComments(pedido: PedidoResponse) {
  return (pedido.detalles ?? []).flatMap((detalle) => {
    const texto = detalle.personalizacion?.comentario?.trim();

    if (!texto) return [];

    return [
      {
        producto: detalle.producto?.nombre ?? `Producto ${detalle.productoId}`,
        productoId: detalle.productoId,
        texto
      }
    ];
  });
}

export function getKitchenTicketInteractionProps(pedido: PedidoResponse, onOpenModal: (modal: ActiveModal) => void) {
  const openDetail = () => onOpenModal({ action: "detail", pedido });

  return {
    "aria-label": `Ver detalle del pedido ${getPedidoDisplayNumber(pedido)}`,
    onClick: openDetail,
    onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDetail();
      }
    },
    role: "button" as const,
    tabIndex: 0
  };
}

export function getNextCocinaEstado(estado: EstadoPedido) {
  if (estado === "pendiente") {
    return "en_preparacion";
  }

  if (estado === "en_preparacion") {
    return "listo";
  }

  if (estado === "listo") {
    return "entregado";
  }

  return null;
}
