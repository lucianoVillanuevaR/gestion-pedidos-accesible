import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPedidos, updatePedidoEstado } from "../../../services/pedidos";
import type { EstadoPedido, PedidoResponse } from "../../../types";
import type { ActiveModal, EstadoFilter, SortOption } from "../constants/pedidosConstants";
import {
  getNormalSummary,
  getPedidoCounts,
  pedidoMatchesSearch,
  sortPedidos,
  withPedidoNumerosTurno
} from "../utils/pedidosUtils";

export function usePedidosController({
  searchTerm = "",
  sortOption = "recent"
}: {
  searchTerm?: string;
  sortOption?: SortOption;
}) {
  const [pedidos, setPedidos] = useState<PedidoResponse[]>([]);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModalState] = useState<ActiveModal>(null);
  const [updatingPedidoId, setUpdatingPedidoId] = useState<number | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const filteredPedidos = useMemo(() => {
    const pedidosByEstado =
      estadoFilter === "todos" ? pedidos : pedidos.filter((pedido) => pedido.estado === estadoFilter);
    const pedidosBySearch = pedidosByEstado.filter((pedido) => pedidoMatchesSearch(pedido, searchTerm));

    return sortPedidos(pedidosBySearch, sortOption);
  }, [estadoFilter, pedidos, searchTerm, sortOption]);

  const pedidoCounts = useMemo(() => getPedidoCounts(pedidos), [pedidos]);
  const normalSummary = useMemo(() => getNormalSummary(pedidos), [pedidos]);

  const loadPedidos = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);
      const pedidosResponse = await getPedidos(signal);
      setPedidos(withPedidoNumerosTurno(pedidosResponse));
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        return;
      }

      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar los pedidos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadPedidos(controller.signal);
    return () => controller.abort();
  }, [loadPedidos]);

  async function handleEstadoChange(pedido: PedidoResponse, estado: EstadoPedido) {
    try {
      setUpdatingPedidoId(pedido.id);
      setError(null);
      const pedidoActualizado = await updatePedidoEstado(pedido.id, estado);
      setPedidos((currentPedidos) =>
        currentPedidos.map((currentPedido) =>
          currentPedido.id === pedido.id
            ? { ...pedidoActualizado, numeroTurno: currentPedido.numeroTurno }
            : currentPedido
        )
      );
      setActiveModal(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo actualizar el pedido");
    } finally {
      setUpdatingPedidoId(null);
    }
  }

  const setActiveModal = useCallback((modal: ActiveModal) => {
    if (modal) {
      const activeElement = document.activeElement;
      lastFocusedElementRef.current = activeElement instanceof HTMLElement ? activeElement : null;
      setActiveModalState(modal);
      return;
    }

    setActiveModalState(null);
    window.requestAnimationFrame(() => {
      lastFocusedElementRef.current?.focus();
      lastFocusedElementRef.current = null;
    });
  }, []);

  return {
    activeModal,
    error,
    estadoFilter,
    filteredPedidos,
    handleEstadoChange,
    isLoading,
    loadPedidos,
    normalSummary,
    pedidoCounts,
    pedidos,
    setActiveModal,
    setEstadoFilter,
    updatingPedidoId
  };
}
