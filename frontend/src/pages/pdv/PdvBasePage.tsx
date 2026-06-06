import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { createPedido } from "../../services/pedidos";
import useVoice from "../../hooks/useVoice";
import TicketComanda from "../../components/TicketComanda";
import type { CreatePedidoPayload, MetodoPago, PedidoResponse, Producto } from "../../types";
import {
  buildPedidoSummary,
  formatCurrency,
  getPaymentLabel,
  type FiltroCategoria
} from "../../utils/pdv";
import {
  ACCESSIBLE_STEP_COUNT,
  type FeedbackState
} from "./PdvShared";
import { usePdvProducts } from "./hooks/usePdvProducts";
import { usePdvSoundCue } from "./hooks/usePdvSoundCue";
import PdvFacilView from "./PdvFacilView";
import PdvNormalView from "./PdvNormalView";
import { PdvViewProvider, type PdvViewContextValue } from "./PdvViewContext";

function PdvBasePage({ isAccessible }: { isAccessible: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isHighContrast, isVoiceEnabled, isSoundEnabled, isPanelOpen, openAccessibilityPanel } = useAccessibilityContext();
  const { speak } = useVoice({ enabled: isVoiceEnabled });
  const { speak: speakOnDemand } = useVoice({ enabled: true });

  const [selectedCategory, setSelectedCategory] = useState<FiltroCategoria>("Todos");

  const [searchTerm, setSearchTerm] = useState("");
  const {
    accessibleProductos,
    loadingError,
    loadingProductos,
    loadProductos,
    productos,
    productosFiltrados,
    setLoadingError
  } = usePdvProducts({ searchTerm, selectedCategory });

  const [items, setItems] = useState<Record<number, number>>({});
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [observacion, setObservacion] = useState("");
  const [accessibleObservationType, setAccessibleObservationType] = useState<"cocina" | "cliente">("cocina");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [accessibleStep, setAccessibleStep] = useState<number>(1);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const initialProductHandledRef = useRef(false);
  const ticketRef = useRef<HTMLDivElement | null>(null);
  const playSoundCue = usePdvSoundCue(isSoundEnabled);

  useEffect(() => {
    if (feedback && feedbackRef.current) {
      feedbackRef.current.focus();
    }
  }, [feedback]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback((currentFeedback) => (currentFeedback === feedback ? null : currentFeedback));
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    if (!isAccessible) {
      return;
    }

    setAccessibleStep(1);
  }, [isAccessible]);

  const { detalles: pedidoDetalles, total, cantidad: totalItems } = useMemo(() => {
    return buildPedidoSummary(items, productos);
  }, [items, productos]);

  useEffect(() => {
    if (pedidoDetalles.length === 0) {
      setShowResetConfirm(false);
    }
  }, [pedidoDetalles.length]);

  const puedeRegistrar = pedidoDetalles.length > 0 && metodoPago !== "" && !sending;

  const announce = useCallback((message: string, options = {}) => {
    if (isVoiceEnabled) {
      speak(message, options);
    }
  }, [isVoiceEnabled, speak]);

  const handleReadPedidoSummary = useCallback(() => {
    if (pedidoDetalles.length === 0) {
      speakOnDemand("No hay productos seleccionados.", {
        priority: "high",
        dedupeKey: "read-summary-empty",
        force: true,
        interrupt: true,
        rate: 0.82
      });
      return;
    }

    const itemLines = pedidoDetalles.map((item) => {
      return `${item.cantidad} ${item.producto.nombre}`;
    });

    const parts = [
      "Resumen del pedido.",
      `Tienes ${totalItems} ${totalItems === 1 ? "producto" : "productos"}.`,
      `Detalle: ${itemLines.join(", ")}.`,
      `Total a pagar ${formatCurrency(total)}.`
    ];

    if (metodoPago !== "") {
      parts.push(`Método de pago: ${getPaymentLabel(metodoPago)}.`);
    }

    if (observacion.trim()) {
      parts.push(`Observación: ${observacion.trim()}.`);
    }

    if (clienteNombre.trim()) {
      parts.push(`Cliente: ${clienteNombre.trim()}.`);
    }

    speakOnDemand(parts.join(" "), {
      priority: "high",
      dedupeKey: "read-summary",
      force: true,
      interrupt: true,
      rate: isAccessible ? 0.8 : 0.86
    });
  }, [clienteNombre, isAccessible, metodoPago, observacion, pedidoDetalles, speakOnDemand, total, totalItems]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleReadSummaryRequest = () => {
      handleReadPedidoSummary();
    };

    window.addEventListener("riquisimo:read-pedido-summary", handleReadSummaryRequest);
    return () => window.removeEventListener("riquisimo:read-pedido-summary", handleReadSummaryRequest);
  }, [handleReadPedidoSummary]);

  const setItemQuantity = useCallback((producto: Producto, nextQuantity: number) => {
    setItems((currentItems) => {
      if (nextQuantity <= 0) {
        const nextItems = { ...currentItems };
        delete nextItems[producto.id];
        return nextItems;
      }

      return {
        ...currentItems,
        [producto.id]: nextQuantity
      };
    });
  }, []);

  const clearPedidoForm = () => {
    setItems({});
    setMetodoPago("");
    setClienteNombre("");
    setObservacion("");
    setAccessibleObservationType("cocina");
  };

  const addProduct = useCallback((producto: Producto) => {
    setItems((currentItems) => ({
      ...currentItems,
      [producto.id]: (currentItems[producto.id] || 0) + 1
    }));
    const msg = "Producto agregado";
    setFeedback({ type: "success", message: msg });
    playSoundCue("add");
    announce(msg, {
      priority: "normal",
      dedupeKey: "product-added",
      cooldownMs: 1800
    });
  }, [announce, playSoundCue]);

  useEffect(() => {
    if (!isAccessible || initialProductHandledRef.current || loadingProductos) {
      return;
    }

    const state = location.state as { productoId?: number } | null;
    const productoId = state?.productoId;

    if (!productoId) {
      return;
    }

    const producto = productos.find((item) => item.id === productoId);

    if (!producto) {
      return;
    }

    initialProductHandledRef.current = true;
    addProduct(producto);
    setAccessibleStep(3);
    navigate(location.pathname, { replace: true, state: null });
  }, [addProduct, isAccessible, loadingProductos, location.pathname, location.state, navigate, productos]);

  const increaseProduct = (producto: Producto) => {
    const nextQuantity = (items[producto.id] || 0) + 1;
    setItemQuantity(producto, nextQuantity);
    playSoundCue("add");
    announce("Cantidad aumentada", {
      priority: "low",
      dedupeKey: "quantity-up",
      cooldownMs: 1500
    });
  };

  const decreaseProduct = (producto: Producto) => {
    const currentQuantity = items[producto.id] || 0;
    setItemQuantity(producto, currentQuantity - 1);

    if (currentQuantity <= 1) {
      playSoundCue("remove");
      announce("Producto quitado", {
        priority: "low",
        dedupeKey: "product-removed",
        cooldownMs: 1500
      });
      return;
    }

    playSoundCue("decrease");
    announce("Cantidad reducida", {
      priority: "low",
      dedupeKey: "quantity-down",
      cooldownMs: 1500
    });
  };

  const removeProduct = (productoId: number) => {
    setItems((prevItems) => {
      const newItems = { ...prevItems };
      delete newItems[productoId];
      return newItems;
    });

    setFeedback({ type: "success", message: "Producto quitado" });
    playSoundCue("remove");
    announce("Producto quitado", {
      priority: "normal",
      dedupeKey: "product-removed",
      cooldownMs: 1500
    });
  };

  const resetPedido = () => {
    clearPedidoForm();
    setFeedback(null);
    setShowResetConfirm(false);
    playSoundCue("clear");
    announce("Pedido borrado", {
      priority: "high",
      dedupeKey: "pedido-reset",
      cooldownMs: 2000,
      interrupt: true
    });
  };

  const openResetConfirm = () => {
    setShowResetConfirm(true);
    announce("¿Seguro que quieres borrar?", {
      priority: "high",
      dedupeKey: "confirm-reset",
      cooldownMs: 1800,
      interrupt: true
    });
  };

  const selectMetodoPago = (value: MetodoPago) => {
    setMetodoPago(value);

    const voiceMessage =
      value === "efectivo"
        ? "Pago en efectivo"
        : value === "tarjeta"
          ? "Pago con tarjeta"
          : "Pago por transferencia";

    announce(voiceMessage, {
      priority: "normal",
      dedupeKey: `payment-${value}`,
      cooldownMs: 1400
    });
  };

  const handleSubmit = async () => {
    setFeedback(null);
    let shouldResetAccessibleFlow = false;

    if (!puedeRegistrar) {
      const message =
        pedidoDetalles.length === 0
          ? "No hay productos seleccionados"
          : "Selecciona método de pago";

      setFeedback({ type: "error", message });
      playSoundCue("error");
      announce(message, {
        priority: "high",
        dedupeKey: `submit-error:${message}`,
        cooldownMs: 2500,
        interrupt: true
      });
      return;
    }

    const payload: CreatePedidoPayload = {
      clienteNombre: clienteNombre.trim() || undefined,
      detalles: pedidoDetalles.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad
      })),
      metodoPago: metodoPago as MetodoPago,
      observacion: observacion.trim() || undefined
    };

    try {
      setSending(true);
      const pedidoCreado = (await createPedido(payload)) as PedidoResponse;
      const numeroPedido = pedidoCreado?.id ?? null;
      const successMsg = numeroPedido ? `Pedido #${numeroPedido} registrado` : "Pedido registrado";
      setFeedback({ type: "success", message: successMsg });
      clearPedidoForm();
      playSoundCue("success");
      announce("Pedido registrado", {
        priority: "high",
        dedupeKey: "pedido-registrado",
        cooldownMs: 3000,
        interrupt: true
      });
      shouldResetAccessibleFlow = isAccessible;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al registrar pedido";
      setFeedback({ type: "error", message: message || "Error al registrar" });
      playSoundCue("error");
      announce("No pudimos registrar el pedido", {
        priority: "high",
        dedupeKey: "pedido-registrado-error",
        cooldownMs: 3000,
        interrupt: true
      });
    } finally {
      setSending(false);

      if (shouldResetAccessibleFlow) {
        setSelectedCategory("Todos");
        setSearchTerm("");
        setAccessibleStep(1);

        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Comanda-Riquisisimo-${new Date().getTime()}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
        padding: 0;
      }
      body {
        margin: 0;
        padding: 0;
        background: white;
      }
    `,
    onAfterPrint: () => {
      const msg = "Comanda impresa correctamente";
      setFeedback({ type: "success", message: msg });
      announce("Comanda impresa", {
        priority: "normal",
        dedupeKey: "print-success",
        cooldownMs: 2500
      });
    }
  });

  const bgWrapper = isHighContrast ? "bg-black" : isAccessible ? "bg-white" : "bg-[#F7F7F7]";
  const textColor = isHighContrast ? "text-white" : isAccessible ? "text-slate-950" : "text-[#1F2937]";
  const cardBorder = isHighContrast ? "border-2 border-yellow-400" : isAccessible ? "border-2 border-slate-900" : "border border-slate-200";
  const headerBg = isHighContrast ? "bg-black text-white border-b-2 border-yellow-400" : isAccessible ? "bg-slate-900 text-white border-b border-slate-700" : "bg-[#FECE00] text-[#1F2937] border-b border-amber-200";
  const panelBg = isHighContrast ? "bg-black contrast-panel" : isAccessible ? "bg-white" : "bg-[#F7F7F7]";
  const quickActionButtonClass = `inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 font-bold text-[13px] whitespace-nowrap transition ${
    isHighContrast
      ? "contrast-button-secondary"
      : "bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200"
  }`;
  const quickActionIconButtonClass = `inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl border text-lg transition ${
    isHighContrast
      ? "contrast-button-secondary"
      : "bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200"
  }`;
  const accessibleObservationPlaceholder = accessibleObservationType === "cocina"
    ? "Ej: sin cebolla, extra salsa, bien tostado..."
    : "Ej: cliente retira afuera, llamar al llegar, sin apuro...";
  const goNextAccessibleStep = () => setAccessibleStep((currentStep) => Math.min(ACCESSIBLE_STEP_COUNT, currentStep + 1));
  const goPrevAccessibleStep = () => setAccessibleStep((currentStep) => Math.max(1, currentStep - 1));

  useEffect(() => {
    if (!isAccessible || !isVoiceEnabled) {
      return;
    }

    switch (accessibleStep) {
      case 1:
        speak("Selecciona una categoría", {
          priority: "normal",
          dedupeKey: "pdv-step-1",
          cooldownMs: 4000
        });
        break;
      case 2:
        speak("Elige un producto", {
          priority: "normal",
          dedupeKey: "pdv-step-2",
          cooldownMs: 4000
        });
        break;
      case 3:
        speak("Revisa tu pedido", {
          priority: "normal",
          dedupeKey: "pdv-step-3",
          cooldownMs: 4000
        });
        break;
      case 4:
        speak("Si quieres, agrega una observación", {
          priority: "normal",
          dedupeKey: "pdv-step-4",
          cooldownMs: 4000
        });
        break;
      case 5:
        speak("Selecciona método de pago", {
          priority: "normal",
          dedupeKey: "pdv-step-5",
          cooldownMs: 4000
        });
        break;
      case ACCESSIBLE_STEP_COUNT:
        speak("Revisa y registra el pedido", {
          priority: "normal",
          dedupeKey: "pdv-step-6",
          cooldownMs: 4000
        });
        break;
    }
  }, [accessibleStep, isAccessible, isVoiceEnabled, speak]);

  useEffect(() => {
    if (!isAccessible) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccessibleStep(1);
      }

      if (event.key === "ArrowRight") {
        setAccessibleStep((currentStep) => Math.min(ACCESSIBLE_STEP_COUNT, currentStep + 1));
      }

      if (event.key === "ArrowLeft") {
        setAccessibleStep((currentStep) => Math.max(1, currentStep - 1));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAccessible, isVoiceEnabled, speak]);

  function AccessibleFlow() {
    return <PdvFacilView />;
  }

  const viewContext = {
    accessibleObservationPlaceholder,
    accessibleObservationType,
    accessibleProductos,
    accessibleStep,
    addProduct,
    bgWrapper,
    cardBorder,
    clienteNombre,
    decreaseProduct,
    feedback,
    feedbackRef,
    goNextAccessibleStep,
    goPrevAccessibleStep,
    handlePrint,
    handleReadPedidoSummary,
    handleSubmit,
    increaseProduct,
    isAccessible,
    isHighContrast,
    isPanelOpen,
    items,
    loadingError,
    loadingProductos,
    loadProductos,
    metodoPago,
    navigate,
    observacion,
    openAccessibilityPanel,
    openResetConfirm,
    panelBg,
    pedidoDetalles,
    puedeRegistrar,
    productosFiltrados,
    quickActionButtonClass,
    quickActionIconButtonClass,
    removeProduct,
    resetPedido,
    searchTerm,
    selectedCategory,
    selectMetodoPago,
    sending,
    setAccessibleObservationType,
    setAccessibleStep,
    setClienteNombre,
    setLoadingError,
    setObservacion,
    setSearchTerm,
    setSelectedCategory,
    setShowResetConfirm,
    showResetConfirm,
    textColor,
    total
  } satisfies PdvViewContextValue;

  return (
    <PdvViewProvider value={viewContext}>
      <main className={`min-h-screen ${bgWrapper} ${textColor}`}>
        {isAccessible && (
          <div className={`${headerBg} no-print`}>
            <div className={`mx-auto flex w-full max-w-[1520px] items-center px-3 sm:px-4 lg:px-5 xl:px-6 ${isAccessible ? "min-h-[84px] py-4" : "min-h-[64px] py-3"}`}>
              <h1 className={`font-black leading-none tracking-tight contrast-important ${isAccessible ? "text-3xl" : "text-xl"}`}>
                Punto de Venta
              </h1>
            </div>
          </div>
        )}

        <div className={`w-full print:px-0 print:py-0 ${isAccessible ? "mx-auto max-w-[1520px] px-3 py-6 sm:px-4 lg:px-5 xl:px-6" : "px-0 py-0"}`} style={{ backgroundColor: isHighContrast ? "#000000" : isAccessible ? "white" : "#F7F7F7" }}>
          {loadingProductos && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-6 flex items-center gap-4 rounded-2xl p-6 ${
                isAccessible ? "bg-white border-2 border-slate-900" : "bg-[#FFF8DC] border border-[#FFF4BF]"
              }`}
            >
              <LoaderCircle className="h-10 w-10 animate-spin" aria-hidden="true" />
              <p className={`font-bold ${isAccessible ? "text-xl" : "text-lg"}`}>Cargando productos...</p>
            </div>
          )}

          {loadingError && (
            <div
              role="alert"
              className={`mb-6 flex items-start gap-4 rounded-2xl p-6 ${
                isAccessible ? "bg-white border-4 border-slate-900" : "bg-red-50 border border-red-300"
              }`}
            >
              <AlertTriangle className="h-10 w-10 shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className={`font-black ${isAccessible ? "text-xl" : "text-lg"}`}>{loadingError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoadingError(null);
                    loadProductos();
                  }}
                  className={`mt-3 font-bold rounded-lg px-4 py-2 transition ${
                    isAccessible
                      ? "bg-slate-900 text-white border-2 border-slate-900 hover:bg-black min-h-[48px]"
                      : "bg-[#D94C45] text-white border border-[#C73F38] hover:bg-[#C73F38]"
                  }`}
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {isAccessible ? <AccessibleFlow /> : <PdvNormalView />}

          <div className="hidden print:block" ref={ticketRef}>
            <TicketComanda
              pedidoDetalles={pedidoDetalles}
              total={total}
              metodoPago={metodoPago}
              observacion={observacion}
              numeroPedido={undefined}
            />
          </div>
        </div>
      </main>
    </PdvViewProvider>
  );
}

export default PdvBasePage;
