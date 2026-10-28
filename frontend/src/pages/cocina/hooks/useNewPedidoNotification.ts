import { useEffect, useRef, useState } from "react";
import { AUDIO_FEEDBACK_STARTED_EVENT } from "../../../hooks/useSoundFeedback";
import type { PedidoResponse } from "../../../types";

export function useNewPedidoNotification({
  isInitialLoading,
  isAutomaticRefresh,
  notify,
  pedidos
}: {
  isInitialLoading: boolean;
  isAutomaticRefresh: boolean;
  notify: () => boolean | Promise<boolean>;
  pedidos: PedidoResponse[];
}) {
  const knownPedidoIdsRef = useRef<Set<number> | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  useEffect(() => {
    const clearAudioBlocked = () => setAudioBlocked(false);
    window.addEventListener(AUDIO_FEEDBACK_STARTED_EVENT, clearAudioBlocked);
    return () => window.removeEventListener(AUDIO_FEEDBACK_STARTED_EVENT, clearAudioBlocked);
  }, []);

  useEffect(() => {
    if (isInitialLoading) return;

    const currentIds = new Set(pedidos.map((pedido) => pedido.id));
    const knownIds = knownPedidoIdsRef.current;
    if (knownIds && isAutomaticRefresh && pedidos.some((pedido) => !knownIds.has(pedido.id))) {
      void Promise.resolve(notify()).then((played) => setAudioBlocked(!played));
    }
    if (knownIds) {
      currentIds.forEach((id) => knownIds.add(id));
    } else {
      knownPedidoIdsRef.current = currentIds;
    }
  }, [isAutomaticRefresh, isInitialLoading, notify, pedidos]);

  return audioBlocked;
}
