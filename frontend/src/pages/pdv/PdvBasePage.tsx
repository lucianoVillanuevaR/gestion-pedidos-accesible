import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, LoaderCircle, Minus, Plus, X } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import {
  abrirTurnoRemoto,
  guardarCierreTurno,
  obtenerPedidoIdsCerrados,
  sincronizarTurnoActual
} from "../../services/cierresTurno";
import { createPedido, getPedidos } from "../../services/pedidos";
import useVoice from "../../hooks/useVoice";
import TicketComanda from "../../components/TicketComanda";
import type {
  CreatePedidoPayload,
  MetodoPago,
  PedidoResponse,
  PersonalizacionProducto,
  Producto,
  VarianteProducto
} from "../../types";
import { buildPedidoSummary, formatCurrency, getPaymentLabel, type FiltroCategoria } from "../../utils/pdv";
import {
  PEDIDO_MAX_CANTIDAD_DETALLE,
  PEDIDO_OBSERVACION_MAX_LENGTH,
  validatePedidoSubmit
} from "../../validations/pedido.validation";
import { validateTurnoClose } from "../../validations/turno.validation";
import { ACCESSIBLE_STEP_COUNT, type FeedbackState, usesProductConfigurator } from "./PdvShared";
import {
  getPedidoDisplayNumber,
  readTurnoAbierto,
  setTurnoAbierto,
  setTurnoFechaInicio,
  TURNO_ABIERTO_STORAGE_KEY,
  withPedidoNumerosTurno
} from "../pedidos/PedidosShared";
import { usePdvProducts } from "./hooks/usePdvProducts";
import { usePdvSoundCue } from "./hooks/usePdvSoundCue";
import PdvFacilView from "./PdvFacilView";
import PdvNormalView from "./PdvNormalView";
import { PdvViewProvider, type PdvViewContextValue } from "./PdvViewContext";

function PdvBasePage({ isAccessible }: { isAccessible: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isHighContrast, isVoiceEnabled, isSoundEnabled, isPanelOpen, openAccessibilityPanel } =
    useAccessibilityContext();
  const { speak } = useVoice({ enabled: isVoiceEnabled });
  const { speak: speakOnDemand } = useVoice({ enabled: true });

  const [selectedCategory, setSelectedCategory] = useState<FiltroCategoria>("Destacados");

  const [searchTerm, setSearchTerm] = useState("");
  const {
    accessibleProductos,
    categoryFilters,
    loadingError,
    loadingProductos,
    loadProductos,
    productos,
    productosFiltrados,
    setLoadingError
  } = usePdvProducts({ searchTerm, selectedCategory });

  const [items, setItems] = useState<Record<string, number>>({});
  const [personalizaciones, setPersonalizaciones] = useState<Record<string, PersonalizacionProducto>>({});
  const [pendingVariantProduct, setPendingVariantProduct] = useState<Producto | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [observacion, setObservacion] = useState("");
  const [accessibleObservationType, setAccessibleObservationType] = useState<"cocina" | "cliente">("cocina");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [accessibleStep, setAccessibleStep] = useState<number>(1);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isTurnoOpen, setIsTurnoOpen] = useState(() => readTurnoAbierto());

  useEffect(() => {
    void sincronizarTurnoActual()
      .then((turno) => {
        setTurnoAbierto(Boolean(turno));
        if (turno) setTurnoFechaInicio(turno.fechaInicio);
        setIsTurnoOpen(Boolean(turno));
      })
      .catch(() => undefined);
  }, []);

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

  const {
    detalles: pedidoDetalles,
    total,
    cantidad: totalItems
  } = useMemo(() => {
    return buildPedidoSummary(items, productos, personalizaciones);
  }, [items, personalizaciones, productos]);

  useEffect(() => {
    if (pedidoDetalles.length === 0) {
      setShowResetConfirm(false);
    }
  }, [pedidoDetalles.length]);

  const submitValidationError = validatePedidoSubmit({
    clienteNombre,
    isTurnoOpen,
    metodoPago,
    observacion,
    totalProductos: pedidoDetalles.length
  });
  const puedeRegistrar = !submitValidationError && !sending;

  const announce = useCallback(
    (message: string, options = {}) => {
      if (isVoiceEnabled) {
        speak(message, options);
      }
    },
    [isVoiceEnabled, speak]
  );

  const notifyTurnoClosed = useCallback(() => {
    const message = "Debe abrir turno antes de registrar pedidos.";
    setFeedback({ type: "error", message });
    playSoundCue("error");
    announce(message, {
      priority: "high",
      dedupeKey: "pdv-turno-cerrado-action",
      cooldownMs: 1800,
      interrupt: true
    });
  }, [announce, playSoundCue]);

  const handleReadPedidoSummary = useCallback(() => {
    if (!isTurnoOpen) {
      speakOnDemand("Turno cerrado. Abre turno para registrar pedidos.", {
        priority: "high",
        dedupeKey: "read-summary-turno-cerrado",
        force: true,
        interrupt: true,
        rate: 0.82
      });
      return;
    }

    if (pedidoDetalles.length === 0) {
      speakOnDemand("Pedido vacío. Agrega productos antes de aceptar.", {
        priority: "high",
        dedupeKey: "read-summary-empty",
        force: true,
        interrupt: true,
        rate: 0.82
      });
      return;
    }

    const itemLines = pedidoDetalles.map((item) => {
      return `${item.cantidad} ${item.producto.nombre}${item.variante ? `, opción ${item.variante.nombre}` : ""}`;
    });

    const parts = [
      "Pedido número 1.",
      `Contiene ${totalItems} ${totalItems === 1 ? "producto" : "productos"}.`,
      `Detalle: ${itemLines.join(", ")}.`,
      `Total a pagar ${formatCurrency(total)}.`
    ];

    if (metodoPago !== "") {
      parts.push(`Método de pago: ${getPaymentLabel(metodoPago)}.`);
    } else {
      parts.push("Método de pago pendiente.");
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
  }, [
    clienteNombre,
    isAccessible,
    isTurnoOpen,
    metodoPago,
    observacion,
    pedidoDetalles,
    speakOnDemand,
    total,
    totalItems
  ]);

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

  const setItemQuantity = useCallback(
    (producto: Producto, nextQuantity: number) => {
      if (!isTurnoOpen) {
        notifyTurnoClosed();
        return;
      }

      if (nextQuantity > PEDIDO_MAX_CANTIDAD_DETALLE) {
        const message = `La cantidad máxima por producto es ${PEDIDO_MAX_CANTIDAD_DETALLE}.`;
        setFeedback({ type: "error", message });
        playSoundCue("error");
        announce(message, {
          priority: "high",
          dedupeKey: `quantity-max:${producto.id}`,
          cooldownMs: 1800,
          interrupt: true
        });
        return;
      }

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
    },
    [announce, isTurnoOpen, notifyTurnoClosed, playSoundCue]
  );

  const clearPedidoForm = () => {
    setItems({});
    setPersonalizaciones({});
    setPendingVariantProduct(null);
    setMetodoPago("");
    setClienteNombre("");
    setObservacion("");
    setAccessibleObservationType("cocina");
  };

  const commitAddProduct = useCallback(
    (
      producto: Producto,
      variante?: VarianteProducto,
      cantidadAgregar = 1,
      personalizacion: PersonalizacionProducto = { aderezos: [] }
    ) => {
      if (!isTurnoOpen) {
        notifyTurnoClosed();
        return;
      }

      const signature = encodeURIComponent(JSON.stringify(personalizacion));
      const itemKey = `${producto.id}:${variante?.id ?? "base"}:${signature}`;
      const nextQuantity = (items[itemKey] || 0) + cantidadAgregar;

      if (nextQuantity > PEDIDO_MAX_CANTIDAD_DETALLE) {
        const message = `La cantidad máxima por producto es ${PEDIDO_MAX_CANTIDAD_DETALLE}.`;
        setFeedback({ type: "error", message });
        playSoundCue("error");
        return;
      }

      setItems((currentItems) => ({
        ...currentItems,
        [itemKey]: (currentItems[itemKey] || 0) + cantidadAgregar
      }));
      setPersonalizaciones((current) => ({ ...current, [itemKey]: personalizacion }));
      const msg = "Producto agregado al pedido.";
      setFeedback({ type: "success", message: msg });
      playSoundCue("add");
      announce(`${producto.nombre}${variante ? `, ${variante.nombre}` : ""} agregado. Cantidad ${nextQuantity}.`, {
        priority: "normal",
        dedupeKey: `product-added:${producto.id}:${nextQuantity}`,
        cooldownMs: 1800
      });
    },
    [announce, isTurnoOpen, items, notifyTurnoClosed, playSoundCue]
  );

  const addProduct = useCallback(
    (producto: Producto) => {
      if (usesProductConfigurator(producto)) {
        setPendingVariantProduct(producto);
        announce(`Elige una opción para ${producto.nombre}.`, {
          priority: "high",
          dedupeKey: `variant-required:${producto.id}`,
          cooldownMs: 1500,
          interrupt: true
        });
        return;
      }
      commitAddProduct(producto);
    },
    [announce, commitAddProduct]
  );

  const selectPendingVariant = (
    variante: VarianteProducto | undefined,
    cantidad: number,
    personalizacion: PersonalizacionProducto
  ) => {
    if (!pendingVariantProduct) return;
    const producto = pendingVariantProduct;
    setPendingVariantProduct(null);
    commitAddProduct(producto, variante, cantidad, personalizacion);
  };

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
    if (!isTurnoOpen) {
      notifyTurnoClosed();
      return;
    }

    const nextQuantity = (items[producto.id] || 0) + 1;
    setItemQuantity(producto, nextQuantity);
    playSoundCue("add");
    announce(`${producto.nombre}. Cantidad ${nextQuantity}.`, {
      priority: "low",
      dedupeKey: `quantity-up:${producto.id}:${nextQuantity}`,
      cooldownMs: 1500
    });
  };

  const decreaseProduct = (producto: Producto) => {
    if (!isTurnoOpen) {
      notifyTurnoClosed();
      return;
    }

    const currentQuantity = items[producto.id] || 0;
    setItemQuantity(producto, currentQuantity - 1);

    if (currentQuantity <= 1) {
      playSoundCue("remove");
      announce(`${producto.nombre} quitado del pedido.`, {
        priority: "low",
        dedupeKey: `product-removed:${producto.id}`,
        cooldownMs: 1500
      });
      return;
    }

    playSoundCue("decrease");
    announce(`${producto.nombre}. Cantidad ${currentQuantity - 1}.`, {
      priority: "low",
      dedupeKey: `quantity-down:${producto.id}:${currentQuantity - 1}`,
      cooldownMs: 1500
    });
  };

  const removeProduct = (itemKey: string) => {
    setItems((prevItems) => {
      const newItems = { ...prevItems };
      delete newItems[itemKey];
      return newItems;
    });
    setPersonalizaciones((current) => {
      const next = { ...current };
      delete next[itemKey];
      return next;
    });

    playSoundCue("remove");
    setFeedback({ type: "success", message: "Producto eliminado del pedido." });
    announce("Producto eliminado del pedido.", {
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
    announce("Pedido cancelado.", {
      priority: "high",
      dedupeKey: "pedido-reset",
      cooldownMs: 2000,
      interrupt: true
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === TURNO_ABIERTO_STORAGE_KEY) {
        setIsTurnoOpen(readTurnoAbierto());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleToggleTurno = async () => {
    if (isTurnoOpen) {
      const closeError = validateTurnoClose(isTurnoOpen);
      if (closeError) {
        setFeedback({ type: "error", message: closeError });
        return;
      }

      try {
        await guardarCierreTurno();
        setTurnoAbierto(false);
        setIsTurnoOpen(false);
        setAccessibleStep(1);
        const message = "Turno cerrado correctamente.";
        setFeedback({ type: "success", message });
        playSoundCue("success");
        announce(message, {
          priority: "high",
          dedupeKey: "pdv-turno-cerrado",
          cooldownMs: 2200,
          interrupt: true
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "No fue posible cerrar el turno"
        });
      }
      return;
    }

    try {
      const turno = await abrirTurnoRemoto();
      setTurnoAbierto(true);
      setTurnoFechaInicio(turno.fechaInicio);
      setIsTurnoOpen(true);
      setAccessibleStep(1);
      const message = "Turno abierto correctamente.";
      setFeedback({ type: "success", message });
      announce(message, { priority: "high", dedupeKey: "pdv-turno-abierto", cooldownMs: 2200, interrupt: true });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "No fue posible abrir el turno" });
    }
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
      value === "efectivo" ? "Pago en efectivo" : value === "tarjeta" ? "Pago con tarjeta" : "Pago por transferencia";

    announce(voiceMessage, {
      priority: "normal",
      dedupeKey: `payment-${value}`,
      cooldownMs: 1400
    });
  };

  async function getNumeroTurnoPedidoCreado(pedidoCreado: PedidoResponse) {
    if (!pedidoCreado.id) {
      return null;
    }

    try {
      const pedidoIdsCerrados = obtenerPedidoIdsCerrados();
      const pedidosActivos = (await getPedidos()).filter((pedido) => !pedidoIdsCerrados.has(pedido.id));
      const pedidoActivo = withPedidoNumerosTurno(pedidosActivos).find((pedido) => pedido.id === pedidoCreado.id);

      return pedidoActivo ? getPedidoDisplayNumber(pedidoActivo) : pedidoCreado.id;
    } catch {
      return pedidoCreado.id;
    }
  }

  const handleSubmit = async () => {
    setFeedback(null);
    let shouldResetAccessibleFlow = false;

    if (submitValidationError) {
      const message = submitValidationError;
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
        cantidad: item.cantidad,
        varianteId: item.variante?.id,
        personalizacion: item.personalizacion
      })),
      metodoPago: metodoPago as MetodoPago,
      observacion: observacion.trim() || undefined
    };

    try {
      setSending(true);
      const pedidoCreado = (await createPedido(payload)) as PedidoResponse;
      const numeroPedido = await getNumeroTurnoPedidoCreado(pedidoCreado);
      const successMsg = numeroPedido ? `Pedido #${numeroPedido} registrado` : "Pedido registrado";
      setFeedback({ type: "success", message: successMsg });
      clearPedidoForm();
      playSoundCue("success");
      announce(
        numeroPedido ? `Pedido numero ${numeroPedido} registrado correctamente.` : "Pedido registrado correctamente.",
        {
          priority: "high",
          dedupeKey: "pedido-registrado",
          cooldownMs: 3000,
          interrupt: true
        }
      );
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
        setSelectedCategory("Destacados");
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
  const cardBorder = isHighContrast
    ? "border-2 border-yellow-400"
    : isAccessible
      ? "border-2 border-slate-900"
      : "border border-slate-200";
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
  const accessibleObservationPlaceholder =
    accessibleObservationType === "cocina"
      ? "Ej: sin cebolla, extra salsa, bien tostado..."
      : "Ej: cliente retira afuera, llamar al llegar, sin apuro...";
  const getAccessibleStepMessage = useCallback(
    (step: number) => {
      if (!isTurnoOpen) {
        return `Paso 1 de ${ACCESSIBLE_STEP_COUNT}. Abre turno para registrar pedidos.`;
      }

      switch (step) {
        case 1:
          return `Paso 2 de ${ACCESSIBLE_STEP_COUNT}. Selecciona una categoria.`;
        case 2:
          return `Paso 3 de ${ACCESSIBLE_STEP_COUNT}. Elige un producto.`;
        case 3:
          return `Paso 4 de ${ACCESSIBLE_STEP_COUNT}. Revisa tu pedido. Total ${formatCurrency(total)}.`;
        case 4:
          return `Comentario opcional.`;
        case 5:
          return `Paso 5 de ${ACCESSIBLE_STEP_COUNT}. Metodo de pago.`;
        case ACCESSIBLE_STEP_COUNT:
          return `Paso 6 de ${ACCESSIBLE_STEP_COUNT}. Registrar pedido. Total ${formatCurrency(total)}. ${metodoPago ? `Pago ${getPaymentLabel(metodoPago)}.` : "Falta metodo de pago."}`;
        default:
          return `Paso ${step} de ${ACCESSIBLE_STEP_COUNT}.`;
      }
    },
    [isTurnoOpen, metodoPago, total]
  );

  const getAccessibleStepValidation = useCallback(
    (step: number) => {
      if (!isAccessible) {
        return null;
      }

      if (!isTurnoOpen) {
        return "Turno cerrado. Abre turno para registrar pedidos.";
      }

      if ((step === 2 || step === 3) && pedidoDetalles.length === 0) {
        return "Agrega al menos un producto para continuar.";
      }

      if (step === 4 && observacion.trim().length > PEDIDO_OBSERVACION_MAX_LENGTH) {
        return `La observación no puede superar ${PEDIDO_OBSERVACION_MAX_LENGTH} caracteres.`;
      }

      if (step === 5 && metodoPago === "") {
        return "Selecciona un método de pago para continuar.";
      }

      if (step === ACCESSIBLE_STEP_COUNT) {
        return submitValidationError;
      }

      return null;
    },
    [isAccessible, isTurnoOpen, metodoPago, observacion, pedidoDetalles.length, submitValidationError]
  );

  const accessibleStepValidation = getAccessibleStepValidation(accessibleStep);

  const announceAccessibleStep = useCallback(
    (step: number) => {
      announce(getAccessibleStepMessage(step), {
        priority: "high",
        dedupeKey: `pdv-step-button:${step}`,
        cooldownMs: 700,
        delayMs: 0,
        force: true,
        interrupt: true
      });
    },
    [announce, getAccessibleStepMessage]
  );

  const goNextAccessibleStep = useCallback(() => {
    const validationMessage = getAccessibleStepValidation(accessibleStep);

    if (validationMessage) {
      setFeedback({ type: "error", message: validationMessage });
      playSoundCue("error");
      announce(validationMessage, {
        priority: "high",
        dedupeKey: `pdv-step-validation:${accessibleStep}:${validationMessage}`,
        cooldownMs: 1800,
        interrupt: true
      });
      return;
    }

    setAccessibleStep((currentStep) => {
      const nextStep = Math.min(ACCESSIBLE_STEP_COUNT, currentStep + 1);
      announceAccessibleStep(nextStep);
      return nextStep;
    });
  }, [accessibleStep, announce, announceAccessibleStep, getAccessibleStepValidation, playSoundCue]);

  const goPrevAccessibleStep = useCallback(() => {
    setAccessibleStep((currentStep) => {
      const nextStep = Math.max(1, currentStep - 1);
      announceAccessibleStep(nextStep);
      return nextStep;
    });
  }, [announceAccessibleStep]);

  useEffect(() => {
    if (!isAccessible) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditingText =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (isEditingText) {
        return;
      }

      if (event.key === "Escape") {
        setAccessibleStep(1);
      }

      if (event.key === "ArrowRight") {
        goNextAccessibleStep();
      }

      if (event.key === "ArrowLeft") {
        goPrevAccessibleStep();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNextAccessibleStep, goPrevAccessibleStep, isAccessible]);

  const viewContext = {
    accessibleObservationPlaceholder,
    accessibleObservationType,
    accessibleProductos,
    accessibleStep,
    accessibleStepValidation,
    addProduct,
    bgWrapper,
    cardBorder,
    categoryFilters,
    clienteNombre,
    decreaseProduct,
    feedback,
    feedbackRef,
    goNextAccessibleStep,
    goPrevAccessibleStep,
    handlePrint,
    handleReadPedidoSummary,
    handleSubmit,
    handleToggleTurno,
    increaseProduct,
    isAccessible,
    isHighContrast,
    isPanelOpen,
    isTurnoOpen,
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
    total,
    totalItems
  } satisfies PdvViewContextValue;

  return (
    <PdvViewProvider value={viewContext}>
      <main className={`min-h-screen ${bgWrapper} ${textColor}`}>
        <div
          className={`w-full print:px-0 print:py-0 ${isAccessible ? "mx-auto max-w-[1520px] px-3 py-4 sm:px-4 sm:py-5 lg:px-5 xl:px-6" : "px-0 py-0"}`}
          style={{ backgroundColor: isHighContrast ? "#000000" : isAccessible ? "white" : "#F7F7F7" }}
        >
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

          {isAccessible ? <PdvFacilView /> : <PdvNormalView />}

          {pendingVariantProduct && (
            <VariantSelectionDialog
              isAccessible={isAccessible}
              isHighContrast={isHighContrast}
              onClose={() => setPendingVariantProduct(null)}
              onSelect={selectPendingVariant}
              producto={pendingVariantProduct}
            />
          )}

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

const ADEREZOS_DISPONIBLES = ["Mostaza", "Mayonesa", "Ketchup", "Poca mayo"];

function VariantSelectionDialog({
  isAccessible,
  isHighContrast,
  onClose,
  onSelect,
  producto
}: {
  isAccessible: boolean;
  isHighContrast: boolean;
  onClose: () => void;
  onSelect: (
    variante: VarianteProducto | undefined,
    cantidad: number,
    personalizacion: PersonalizacionProducto
  ) => void;
  producto: Producto;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [aderezos, setAderezos] = useState<string[]>([]);
  const [comentario, setComentario] = useState("");
  const varianteSeleccionada = producto.variantes?.find((variante) => variante.id === selectedVariantId);
  const variantesDisponibles = producto.variantes?.filter((item) => item.disponible !== false) ?? [];
  const requiereOpcion = variantesDisponibles.length > 0;
  const esSandwich = producto.nombre.toLocaleLowerCase("es").includes("sandwich");
  const total = producto.precio * cantidad;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-3 py-5 backdrop-blur-[1px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-selection-title"
        className={`w-full overflow-hidden rounded-[22px] shadow-2xl ${isAccessible ? "max-w-3xl border-2" : "max-w-[680px] border"} ${isHighContrast ? "contrast-panel border-yellow-400" : "border-slate-300 bg-white"}`}
      >
        <header
          className={`flex items-center justify-between border-b px-5 ${isAccessible ? "min-h-[72px]" : "min-h-[56px]"} ${isHighContrast ? "border-yellow-400" : "border-slate-200"}`}
        >
          <div>
            <p
              className={`font-black uppercase tracking-[0.14em] ${isAccessible ? "text-sm" : "text-[11px] text-slate-500"}`}
            >
              {producto.tipo === "promo" ? "Configurar promoción" : "Configurar producto"}
            </p>
            <h2
              id="variant-selection-title"
              className={`${isAccessible ? "text-2xl" : "text-lg"} font-black text-slate-950`}
            >
              {producto.nombre}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center justify-center rounded-full transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${isAccessible ? "h-12 w-12" : "h-10 w-10"}`}
            aria-label="Cerrar configuración"
          >
            <X className={isAccessible ? "h-7 w-7" : "h-5 w-5"} aria-hidden="true" />
          </button>
        </header>

        <div
          className={`grid border-b ${isHighContrast ? "border-yellow-400" : "border-slate-200"} sm:grid-cols-[minmax(0,1fr)_210px]`}
        >
          <div className={isAccessible ? "p-6" : "p-5"}>
            <p
              className={`font-semibold leading-relaxed ${isAccessible ? "text-lg" : "text-sm"} ${isHighContrast ? "contrast-body-text" : "text-slate-600"}`}
            >
              {producto.descripcion || "Selecciona cómo preparar esta promoción."}
            </p>
            <p className={`mt-6 font-black text-slate-950 ${isAccessible ? "text-3xl" : "text-2xl"}`}>
              {formatCurrency(producto.precio)}
            </p>
          </div>
          <div
            className={`flex min-h-[150px] items-center justify-center overflow-hidden ${isHighContrast ? "bg-black" : "bg-[#FFF8DC]"}`}
          >
            {producto.imagen ? (
              <img
                src={producto.imagen}
                alt={producto.altText || producto.nombre}
                className="h-full max-h-[190px] w-full object-cover"
              />
            ) : (
              <span
                className={`px-5 text-center font-black uppercase tracking-wide ${isHighContrast ? "text-yellow-300" : "text-yellow-800"}`}
              >
                Riquísimo
              </span>
            )}
          </div>
        </div>

        {requiereOpcion && (
          <div className={isAccessible ? "p-6" : "p-5"}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`font-black text-slate-950 ${isAccessible ? "text-2xl" : "text-base"}`}>
                  {esSandwich ? "Elige la carne de tu sándwich" : "Elige una opción"}
                </h3>
                <p
                  className={`mt-1 font-semibold ${isAccessible ? "text-lg" : "text-sm"} ${isHighContrast ? "contrast-body-text" : "text-slate-500"}`}
                >
                  Selecciona una opción obligatoria
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 font-black ${isAccessible ? "text-base" : "text-xs"} ${isHighContrast ? "border-yellow-400 text-yellow-300" : "border-yellow-400 bg-yellow-50 text-yellow-800"}`}
              >
                Obligatorio
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de completo">
              {variantesDisponibles.map((variante) => {
                const isSelected = selectedVariantId === variante.id;
                return (
                  <button
                    key={variante.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedVariantId(variante.id)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 text-left font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 ${isAccessible ? "min-h-[76px] text-xl" : "min-h-[58px] text-base"} ${
                      isSelected
                        ? isHighContrast
                          ? "contrast-button-primary"
                          : "border-slate-900 bg-yellow-50 text-slate-950"
                        : isHighContrast
                          ? "contrast-button-secondary"
                          : "border-slate-300 bg-white text-slate-800 hover:border-yellow-500 hover:bg-yellow-50"
                    }`}
                  >
                    <span
                      className={`inline-flex shrink-0 items-center justify-center rounded-md border-2 ${isAccessible ? "h-8 w-8" : "h-6 w-6"} ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-400 bg-white"}`}
                    >
                      {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    {variante.nombre}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div
          className={`border-t ${isAccessible ? "p-6" : "p-5"} ${isHighContrast ? "border-yellow-400" : "border-slate-200"}`}
        >
          <div>
            <h3 className={`font-black text-slate-950 ${isAccessible ? "text-2xl" : "text-base"}`}>Aderezos</h3>
            <p
              className={`mt-1 font-semibold ${isAccessible ? "text-lg" : "text-sm"} ${isHighContrast ? "contrast-body-text" : "text-slate-500"}`}
            >
              Selecciona hasta 3 opciones
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ADEREZOS_DISPONIBLES.map((aderezo) => {
              const isSelected = aderezos.includes(aderezo);
              const isDisabled = !isSelected && aderezos.length >= 3;
              return (
                <button
                  key={aderezo}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={isDisabled}
                  onClick={() =>
                    setAderezos((current) =>
                      current.includes(aderezo) ? current.filter((item) => item !== aderezo) : [...current, aderezo]
                    )
                  }
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${isAccessible ? "min-h-[68px] text-lg" : "min-h-[54px] text-sm"} ${
                    isSelected
                      ? isHighContrast
                        ? "contrast-button-primary"
                        : "border-slate-900 bg-yellow-50 text-slate-950"
                      : isHighContrast
                        ? "contrast-button-secondary"
                        : "border-slate-300 bg-white text-slate-700 hover:border-yellow-500"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-400 bg-white"}`}
                  >
                    {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
                  </span>
                  {aderezo}
                </button>
              );
            })}
          </div>

          <label className="mt-5 block border-t border-slate-200 pt-5">
            <span className={`block font-black text-slate-950 ${isAccessible ? "text-xl" : "text-sm"}`}>
              Comentarios
            </span>
            <textarea
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              maxLength={200}
              rows={isAccessible ? 3 : 2}
              placeholder="Opcional"
              className={`mt-2 w-full resize-none rounded-xl border-2 border-slate-300 bg-white px-3 py-2 font-semibold text-slate-950 outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 ${isAccessible ? "text-lg" : "text-sm"}`}
            />
          </label>
        </div>

        <footer
          className={`grid gap-3 border-t p-4 sm:grid-cols-[220px_minmax(0,1fr)] ${isHighContrast ? "border-yellow-400" : "border-slate-200 bg-slate-50"}`}
        >
          <div
            className={`grid grid-cols-[1fr_auto_1fr] items-center overflow-hidden rounded-xl border bg-white ${isHighContrast ? "border-yellow-400" : "border-slate-300"}`}
          >
            <button
              type="button"
              onClick={() => setCantidad((current) => Math.max(1, current - 1))}
              disabled={cantidad <= 1}
              className={`inline-flex items-center justify-center text-slate-700 transition hover:bg-slate-100 disabled:opacity-35 ${isAccessible ? "min-h-[64px]" : "min-h-[50px]"}`}
              aria-label="Disminuir cantidad"
            >
              <Minus className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className={`${isAccessible ? "text-2xl" : "text-lg"} min-w-12 text-center font-black text-slate-950`}>
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => setCantidad((current) => Math.min(PEDIDO_MAX_CANTIDAD_DETALLE, current + 1))}
              className={`inline-flex items-center justify-center text-slate-950 transition hover:bg-yellow-50 ${isAccessible ? "min-h-[64px]" : "min-h-[50px]"}`}
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            disabled={requiereOpcion && !varianteSeleccionada}
            onClick={() =>
              (!requiereOpcion || varianteSeleccionada) &&
              onSelect(varianteSeleccionada, cantidad, {
                aderezos,
                ...(comentario.trim() && { comentario: comentario.trim() })
              })
            }
            className={`inline-flex items-center justify-center rounded-xl border-2 px-5 font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 ${isAccessible ? "min-h-[64px] text-xl" : "min-h-[50px] text-base"} ${!requiereOpcion || varianteSeleccionada ? (isHighContrast ? "contrast-button-primary" : "border-slate-900 bg-[#FECE00] text-slate-950 hover:bg-[#FFD633]") : ""}`}
          >
            {!requiereOpcion || varianteSeleccionada ? `Agregar · ${formatCurrency(total)}` : "Selecciona una opción"}
          </button>
        </footer>
      </section>
    </div>
  );
}
