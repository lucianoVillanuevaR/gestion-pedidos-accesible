import { useEffect, useRef } from "react";
import type { PedidoResponse } from "../../../types";

export function useNewPedidoNotification({
  isInitialLoading,
  isAutomaticRefresh,
  notify,
  pedidos
}: {
  isInitialLoading: boolean;
  isAutomaticRefresh: boolean;
  notify: () => void;
  pedidos: PedidoResponse[];
}) {
  const knownPedidoIdsRef = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (isInitialLoading) return;

    const currentIds = new Set(pedidos.map((pedido) => pedido.id));
    const knownIds = knownPedidoIdsRef.current;
    if (knownIds && isAutomaticRefresh && pedidos.some((pedido) => !knownIds.has(pedido.id))) {
      notify();
    }
    knownPedidoIdsRef.current = currentIds;
  }, [isAutomaticRefresh, isInitialLoading, notify, pedidos]);
}
