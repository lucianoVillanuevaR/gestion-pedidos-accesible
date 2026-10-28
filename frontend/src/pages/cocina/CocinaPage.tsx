import { useEffect, useMemo, useRef, useState } from "react";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { useAuthContext } from "../../contexts/AuthContext";
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
import {
  CocinaFacilView,
  CocinaNormalView,
  type CocinaFilter,
  type CocinaViewProps
} from "./components/CocinaBoardViews";
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
  const { user } = useAuthContext();
  const { speak } = useActionVoice(isVoiceEnabled);
  const soundFeedback = useSoundFeedback(isSoundEnabled, soundVolume);
  const fullscreenTargetRef = useRef<HTMLDivElement>(null);
  const [isAutomaticRefresh, setIsAutomaticRefresh] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<CocinaFilter>("todos");
  const [isAdvanceDialogOpen, setIsAdvanceDialogOpen] = useState(false);
  const [isAdvancingAll, setIsAdvancingAll] = useState(false);
  const [advanceMessage, setAdvanceMessage] = useState<string | null>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreenToggle(fullscreenTargetRef);
  const {
    activeModal,
    error,
    handleEstadoChange,
    isLoading,
    isRefreshing,
    loadPedidos,
    pedidos,
    setActiveModal,
    updatingPedidoId
  } = usePedidosController({});

  const cocinaPedidos = useMemo(
    () =>
      pedidos.filter(
        (pedido) => pedido.estado === "pendiente" || pedido.estado === "en_preparacion" || pedido.estado === "listo"
      ),
    [pedidos]
  );
  const counts = useMemo(() => getPedidoCounts(pedidos), [pedidos]);
  const urgentCount = useMemo(() => cocinaPedidos.filter(isPedidoDelayed).length, [cocinaPedidos]);
  const visiblePedidos = useMemo(() => {
    if (selectedFilter === "todos") return cocinaPedidos;
    if (selectedFilter === "por_preparar") {
      return cocinaPedidos.filter(
        (pedido) => pedido.estado === "pendiente" || pedido.estado === "en_preparacion"
      );
    }
    return cocinaPedidos.filter((pedido) => pedido.estado === selectedFilter);
  }, [cocinaPedidos, selectedFilter]);
  const advanceCounts = useMemo(
    () => ({
      pendientes: cocinaPedidos.filter((pedido) => pedido.estado === "pendiente").length,
      enPreparacion: cocinaPedidos.filter((pedido) => pedido.estado === "en_preparacion").length
    }),
    [cocinaPedidos]
  );
  const operationalAudioBlocked = useNewPedidoNotification({
    isInitialLoading: isLoading,
    isAutomaticRefresh,
    notify: soundFeedback.notification,
    pedidos
  });

  useEffect(() => {
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
  }, [loadPedidos]);

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

  const handleAdvanceVisible = () => {
    if (user?.role !== "cocina") return;
    if (advanceCounts.pendientes + advanceCounts.enPreparacion === 0) return;
    setAdvanceMessage(null);
    setIsAdvanceDialogOpen(true);
  };

  const handleConfirmAdvance = async () => {
    if (user?.role !== "cocina" || isAdvancingAll) return;

    setIsAdvancingAll(true);
    setAdvanceMessage(null);
    const pedidosToUpdate = cocinaPedidos.filter((pedido) => getNextCocinaEstado(pedido.estado));
    let successCount = 0;
    let errorCount = 0;

    for (const pedido of pedidosToUpdate) {
      const nextEstado = getNextCocinaEstado(pedido.estado);
      if (!nextEstado) continue;
      const succeeded = await handleCocinaEstadoChange(pedido, nextEstado, false);
      if (succeeded) successCount += 1;
      else errorCount += 1;
    }
    setIsAdvancingAll(false);
    setIsAdvanceDialogOpen(false);

    if (errorCount > 0) {
      soundFeedback.error();
      setAdvanceMessage(
        successCount > 0
          ? `${successCount} pedidos actualizados y ${errorCount} sin actualizar.`
          : "No se pudieron avanzar los pedidos. Intenta nuevamente."
      );
    } else if (successCount > 0) {
      soundFeedback.success();
      setAdvanceMessage(`${successCount} pedidos avanzados correctamente.`);
    }
  };

  const CocinaView = isAccessibleView ? CocinaFacilView : CocinaNormalView;
  const cocinaViewProps: CocinaViewProps = {
    activeModal,
    advanceCounts,
    advanceMessage,
    counts,
    error,
    filter: selectedFilter,
    isFullscreen,
    isHighContrast,
    isAdvanceDialogOpen,
    isAdvancingAll,
    isLoading,
    isRefreshing,
    operationalAudioBlocked,
    onAdvanceDialogClose: () => {
      if (!isAdvancingAll) setIsAdvanceDialogOpen(false);
    },
    onAdvanceVisible: handleAdvanceVisible,
    onConfirmAdvance: handleConfirmAdvance,
    onEstadoChange: handleCocinaEstadoChange,
    onFilterChange: setSelectedFilter,
    onFullscreenToggle: toggleFullscreen,
    onOpenModal: setActiveModal,
    onRefresh: handleRefresh,
    pedidos: visiblePedidos,
    role: user?.role ?? "cocina",
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
