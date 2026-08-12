import { useCallback, useEffect, useRef, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { getPedido } from "../../../services/pedidos";
import type { PedidoResponse } from "../../../types";
import type { FeedbackState } from "../PdvShared";

export function usePdvPedidoEditing({
  clearPedidoForm,
  isAccessible,
  loadPedidoForEditing,
  loadingProductos,
  navigate,
  search,
  showFeedback
}: {
  clearPedidoForm: () => void;
  isAccessible: boolean;
  loadPedidoForEditing: (pedido: PedidoResponse) => void;
  loadingProductos: boolean;
  navigate: NavigateFunction;
  search: string;
  showFeedback: (feedback: FeedbackState) => void;
}) {
  const [editingPedido, setEditingPedido] = useState<PedidoResponse | null>(null);
  const loadedPedidoIdRef = useRef<number | null>(null);
  const editingPedidoId = Number(new URLSearchParams(search).get("editar")) || null;

  useEffect(() => {
    if (!editingPedidoId) {
      setEditingPedido(null);
      loadedPedidoIdRef.current = null;
      return;
    }

    const controller = new AbortController();
    getPedido(editingPedidoId, controller.signal)
      .then((pedido) => {
        if (pedido.estado !== "pendiente") throw new Error("Solo se pueden modificar pedidos pendientes");
        setEditingPedido(pedido);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        showFeedback({
          type: "error",
          title: "No se puede modificar el pedido",
          message: error instanceof Error ? error.message : "No fue posible cargar el pedido"
        });
      });
    return () => controller.abort();
  }, [editingPedidoId, showFeedback]);

  useEffect(() => {
    if (!editingPedido || loadingProductos || loadedPedidoIdRef.current === editingPedido.id) return;
    loadPedidoForEditing(editingPedido);
    loadedPedidoIdRef.current = editingPedido.id;
  }, [editingPedido, loadPedidoForEditing, loadingProductos]);

  const cancelEditingPedido = useCallback(() => {
    clearPedidoForm();
    navigate(isAccessible ? "/pedidos/facil" : "/pedidos", { replace: true });
  }, [clearPedidoForm, isAccessible, navigate]);

  return { cancelEditingPedido, editingPedido };
}
