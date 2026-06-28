import { useEffect, useMemo, useRef, useState } from "react";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
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
  const { isHighContrast, isVoiceEnabled } = useAccessibilityContext();
  const { speak } = useActionVoice(isVoiceEnabled);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const fullscreenTargetRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!isAutoRefreshEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadPedidos();
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [isAutoRefreshEnabled, loadPedidos]);

  const handleRefresh = () => {
    speak("Actualizando pedidos en preparación.", {
      priority: "normal",
      dedupeKey: "cocina-refresh",
      cooldownMs: 1200
    });
    loadPedidos();
  };

  const handleCocinaEstadoChange = async (pedido: PedidoResponse, estado: EstadoPedido) => {
    await handleEstadoChange(pedido, estado);
    speak(`Pedido ${getPedidoDisplayNumber(pedido)} actualizado a ${ESTADO_META[estado].label}.`, {
      priority: "high",
      dedupeKey: `cocina-estado:${pedido.id}:${estado}`,
      cooldownMs: 1600,
      interrupt: true
    });
  };

  const handleAdvancePedido = async (pedido: PedidoResponse) => {
    const nextEstado = getNextCocinaEstado(pedido.estado);

    if (!nextEstado) {
      return;
    }

    await handleCocinaEstadoChange(pedido, nextEstado);
  };

  const handleAdvanceVisible = async () => {
    const pedidosToUpdate = cocinaPedidos.filter((pedido) => getNextCocinaEstado(pedido.estado));

    for (const pedido of pedidosToUpdate) {
      await handleAdvancePedido(pedido);
    }
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
