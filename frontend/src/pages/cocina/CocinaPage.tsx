import { useEffect, useMemo, useRef, useState } from "react";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
import { useSoundFeedback } from "../../hooks/useSoundFeedback";
import type { EstadoPedido, PedidoResponse } from "../../types";
import {
  ESTADO_META,
  getPedidoCounts,
  getPedidoDisplayNumber,
  isPedidoDelayed,
  usePedidosController
} from "../pedidos/PedidosShared";
import { CocinaFacilView, CocinaNormalView, type CocinaViewProps } from "./components/CocinaBoardViews";
import { useFullscreenToggle } from "./hooks/useFullscreenToggle";
import { useNewPedidoNotification } from "./hooks/useNewPedidoNotification";
import { getNextCocinaEstado } from "./utils/cocinaUtils";

export { default as CocinaHistorialPage } from "./CocinaHistorialPage";

const AUTO_REFRESH_MS = 12000;

function CocinaPage() {
  return <CocinaBoard isAccessibleView={false} />;
}

export function CocinaFacilPage() {
  return <CocinaBoard isAccessibleView />;
}

function CocinaBoard({ isAccessibleView }: { isAccessibleView: boolean }) {
  const { isHighContrast, isVoiceEnabled, isSoundEnabled, soundVolume } = useAccessibilityContext();
  const { speak } = useActionVoice(isVoiceEnabled);
  const soundFeedback = useSoundFeedback(isSoundEnabled, soundVolume);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const fullscreenTargetRef = useRef<HTMLDivElement>(null);
  const [isAutomaticRefresh, setIsAutomaticRefresh] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreenToggle(fullscreenTargetRef);
  const { activeModal, error, handleEstadoChange, isLoading, loadPedidos, pedidos, setActiveModal, updatingPedidoId } =
    usePedidosController({});

  const cocinaPedidos = useMemo(
    () =>
      pedidos.filter(
        (pedido) => pedido.estado === "pendiente" || pedido.estado === "en_preparacion" || pedido.estado === "listo"
      ),
    [pedidos]
  );
  const counts = useMemo(() => getPedidoCounts(pedidos), [pedidos]);
  const urgentCount = useMemo(() => cocinaPedidos.filter(isPedidoDelayed).length, [cocinaPedidos]);
  useNewPedidoNotification({
    isInitialLoading: isLoading,
    isAutomaticRefresh,
    notify: soundFeedback.notification,
    pedidos
  });

  useEffect(() => {
    if (!isAutoRefreshEnabled) {
      return;
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        setIsAutomaticRefresh(true);
        void loadPedidos(undefined, true);
      }
    };
    const intervalId = window.setInterval(() => {
      refreshWhenVisible();
    }, AUTO_REFRESH_MS);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [isAutoRefreshEnabled, loadPedidos]);

  const handleRefresh = () => {
    setIsAutomaticRefresh(false);
    speak("Actualizando pedidos en preparación.", {
      priority: "normal",
      dedupeKey: "cocina-refresh",
      cooldownMs: 1200
    });
    loadPedidos();
  };

  const handleCocinaEstadoChange = async (pedido: PedidoResponse, estado: EstadoPedido, playFeedback = true) => {
    const succeeded = await handleEstadoChange(pedido, estado);
    if (!succeeded) {
      if (playFeedback) soundFeedback.error();
      return false;
    }
    if (playFeedback) soundFeedback.success();
    speak(`Pedido ${getPedidoDisplayNumber(pedido)} actualizado a ${ESTADO_META[estado].label}.`, {
      priority: "high",
      dedupeKey: `cocina-estado:${pedido.id}:${estado}`,
      cooldownMs: 1600,
      interrupt: true
    });
    return true;
  };

  const handleAdvanceVisible = async () => {
    const pedidosToUpdate = cocinaPedidos.filter((pedido) => getNextCocinaEstado(pedido.estado));
    let hasSuccess = false;
    let hasError = false;

    for (const pedido of pedidosToUpdate) {
      const nextEstado = getNextCocinaEstado(pedido.estado);
      if (!nextEstado) continue;
      const succeeded = await handleCocinaEstadoChange(pedido, nextEstado, false);
      hasSuccess ||= succeeded;
      hasError ||= !succeeded;
    }
    if (hasError) soundFeedback.error();
    else if (hasSuccess) soundFeedback.success();
  };

  const CocinaView = isAccessibleView ? CocinaFacilView : CocinaNormalView;
  const cocinaViewProps: CocinaViewProps = {
    activeModal,
    counts,
    error,
    isAutoRefreshEnabled,
    isFullscreen,
    isHighContrast,
    isLoading,
    onAdvanceVisible: handleAdvanceVisible,
    onAutoRefreshToggle: () => setIsAutoRefreshEnabled((current) => !current),
    onEstadoChange: handleCocinaEstadoChange,
    onFullscreenToggle: toggleFullscreen,
    onOpenModal: setActiveModal,
    onRefresh: handleRefresh,
    pedidos: cocinaPedidos,
    updatingPedidoId,
    urgentCount
  };

  return (
    <div
      ref={fullscreenTargetRef}
      className={`min-h-screen overflow-auto ${isHighContrast ? "bg-black" : isAccessibleView ? "bg-white" : "bg-[#F7F7F7]"}`}
    >
      <CocinaView {...cocinaViewProps} />
    </div>
  );
}

export default CocinaPage;
