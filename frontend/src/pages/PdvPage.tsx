import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, Banknote, CreditCard, Printer, Search, Volume2 } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useNavigate } from "react-router-dom";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import { createPedido } from "../services/pedidos";
import { getProductos } from "../services/productos";
import useVoice from "../hooks/useVoice";
import TicketComanda from "../components/TicketComanda";
import type { CreatePedidoPayload, MetodoPago, PedidoResponse, Producto } from "../types";
import {
  FILTROS,
  buildPedidoSummary,
  detectCategoria,
  filterProductosByCategory,
  filterProductosBySearch,
  formatCurrency,
  getCategoriaLabel,
  getPaymentLabel,
  type FiltroCategoria,
  type ProductoConCategoria
} from "../utils/pdv";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

type SoundCue = "add" | "decrease" | "remove" | "clear" | "success" | "error";

type ToneStep = {
  delayMs?: number;
  durationMs: number;
  frequency: number;
  type?: OscillatorType;
  volume?: number;
};

const ACCESSIBLE_STEP_COUNT = 6;
const PAYMENT_OPTIONS = [
  { value: "efectivo", label: "Efectivo", Icon: Banknote },
  { value: "tarjeta", label: "Tarjeta", Icon: CreditCard },
  { value: "transferencia", label: "Transferencia", Icon: ArrowLeftRight }
] as const;

const SOUND_CUES: Record<SoundCue, ToneStep[]> = {
  add: [
    { frequency: 880, durationMs: 70, type: "triangle", volume: 0.07 }
  ],
  decrease: [
    { frequency: 640, durationMs: 75, type: "sine", volume: 0.062 }
  ],
  remove: [
    { frequency: 620, durationMs: 65, type: "sine", volume: 0.062 },
    { frequency: 520, durationMs: 90, delayMs: 55, type: "sine", volume: 0.07 }
  ],
  clear: [
    { frequency: 660, durationMs: 60, type: "triangle", volume: 0.055 },
    { frequency: 520, durationMs: 75, delayMs: 60, type: "triangle", volume: 0.062 },
    { frequency: 380, durationMs: 110, delayMs: 135, type: "sine", volume: 0.07 }
  ],
  success: [
    { frequency: 880, durationMs: 75, type: "triangle", volume: 0.062 },
    { frequency: 1040, durationMs: 120, delayMs: 70, type: "triangle", volume: 0.075 }
  ],
  error: [
    { frequency: 260, durationMs: 90, type: "sawtooth", volume: 0.055 },
    { frequency: 220, durationMs: 140, delayMs: 75, type: "sawtooth", volume: 0.062 }
  ]
};

function Toast({
  feedback,
  isAccessible,
  isHighContrast,
  className = ""
}: {
  feedback: FeedbackState | null;
  isAccessible: boolean;
  isHighContrast: boolean;
  className?: string;
}) {
  if (!feedback) return null;

  const isSuccess = feedback.type === "success";
  const bgClass = isHighContrast
    ? `contrast-panel-soft ${isSuccess ? "border-emerald-300" : "border-red-300"}`
    : isAccessible
    ? "bg-white border-4 border-slate-900 text-slate-950 shadow-lg"
    : isSuccess
      ? "bg-emerald-50 border border-emerald-300 text-emerald-950"
      : "bg-red-50 border border-red-300 text-red-950";

  return (
    <div className={`rounded-2xl px-4 py-3 ${bgClass} animate-in fade-in slide-in-from-right-4 duration-300 ${className}`}>
      <div className="flex items-start gap-3">
        <span className={`text-2xl font-bold shrink-0 ${isAccessible ? "" : isSuccess ? "text-emerald-600" : "text-red-600"}`}>
          {isSuccess ? "✅" : "❌"}
        </span>
        <div className="min-w-0">
          <p className={`font-bold ${isAccessible ? "text-lg" : "text-base"} ${isHighContrast ? "contrast-important" : ""}`}>{feedback.message}</p>
        </div>
      </div>
    </div>
  );
}

function CategoryButton({
  filtro,
  active,
  isAccessible,
  isHighContrast,
  onClick
}: {
  filtro: { value: FiltroCategoria; label: string };
  active: boolean;
  isAccessible: boolean;
  isHighContrast: boolean;
  onClick: () => void;
}) {
  const baseClass = `inline-flex items-center justify-center rounded-xl border px-4 py-2 font-bold transition min-h-[48px] text-center`;

  if (active) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} ${
          isAccessible
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-[#FECE00] text-[#1F2937] border-[#FECE00] shadow-md hover:shadow-lg hover:bg-[#FFD633]"
        } ${isHighContrast ? "contrast-button-primary" : ""}`}
        aria-current="page"
      >
        {filtro.label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClass} ${
        isAccessible
          ? "bg-white text-slate-900 border-2 border-slate-300 hover:border-slate-900"
          : "bg-white text-[#1F2937] border-slate-200 hover:border-[#FECE00] hover:bg-[#FFFBF0]"
      } ${isHighContrast ? "contrast-button-secondary" : ""}`}
    >
      {filtro.label}
    </button>
  );
}

function ProductCard({
  producto,
  cantidad,
  isAccessible,
  isHighContrast,
  onIncrease,
  onDecrease,
  onAdd
}: {
  producto: Producto;
  cantidad: number;
  isAccessible: boolean;
  isHighContrast: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onAdd: () => void;
}) {
  const categoria = detectCategoria(producto);

  return (
    <article
      className={`flex h-full flex-col rounded-2xl overflow-hidden border transition ${
        isAccessible
          ? "bg-white border-2 border-slate-900"
          : "bg-white border border-slate-200 hover:shadow-md hover:border-amber-200"
      } ${isHighContrast ? "contrast-panel" : ""}`}
    >
      <div
        className={`h-32 overflow-hidden ${
          isAccessible
            ? "bg-slate-100 border-b-2 border-slate-900"
            : "bg-[#FECE00]"
        }`}
      >
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.altText || producto.nombre}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-end justify-center bg-gradient-to-br from-[#FFF8DC] via-[#FFFBF0] to-[#F7F7F7] pb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
            aria-hidden="true"
          >
            {categoria}
          </div>
        )}
      </div>

      <div className={`flex-1 p-4 ${isAccessible ? "space-y-2" : "space-y-3"}`}>
        <span
          className={`inline-block px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wide ${
            isAccessible
              ? "bg-slate-100 text-slate-900 border border-slate-300"
              : "bg-[#FFF4BF] text-[#B8860B] border border-[#FECE00]"
          } ${isHighContrast ? "contrast-badge" : ""}`}
        >
          {getCategoriaLabel(categoria)}
        </span>

        <div>
          <h3 className={`font-black leading-tight text-slate-950 ${isAccessible ? "text-2xl" : "text-lg"} ${isHighContrast ? "contrast-important" : ""}`}>
            {producto.nombre}
          </h3>
          {producto.descripcion && (
            <p className={`mt-1 text-slate-600 ${isAccessible ? "text-base" : "text-sm"} ${isHighContrast ? "contrast-body-text" : ""}`}>{producto.descripcion}</p>
          )}
        </div>

        <div className={`pt-2 border-t ${isAccessible ? "border-slate-300" : "border-amber-100"}`}>
          <p className={`font-black ${isAccessible ? "text-2xl" : "text-xl"} ${isAccessible ? "text-slate-900" : "text-amber-700"} ${isHighContrast ? "contrast-important" : ""}`}>
            {formatCurrency(producto.precio)}
          </p>
        </div>
      </div>

      <div className={`px-4 ${isAccessible ? "pb-3" : "pb-4"} space-y-2`}>
        {isAccessible ? (
          <div className="rounded-xl border-2 border-slate-900 bg-slate-50 p-3">
            <p className="mb-3 text-center text-lg font-bold text-slate-900">¿Cuánto?</p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <button
                type="button"
                onClick={onDecrease}
                disabled={cantidad === 0}
                className={`min-h-[56px] rounded-lg border-2 border-slate-900 bg-white text-3xl font-bold text-slate-900 transition ${
                  cantidad === 0 ? "cursor-not-allowed opacity-40" : "hover:bg-slate-100"
                }`}
                aria-label={`Disminuir ${producto.nombre}`}
              >
                −
              </button>

              <div className="min-w-[84px] text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cantidad</p>
                <p className="text-3xl font-black text-slate-900">{cantidad}</p>
              </div>

              <button
                type="button"
                onClick={cantidad > 0 ? onIncrease : onAdd}
                className="min-h-[56px] rounded-lg border-2 border-slate-900 bg-slate-900 text-3xl font-bold text-white transition hover:bg-black"
                aria-label={`Aumentar ${producto.nombre}`}
              >
                +
              </button>
            </div>

            <p className="mt-3 text-center text-sm font-medium text-slate-600">
              {cantidad === 0 ? "Usa + para agregar este producto" : `Seleccionaste ${cantidad}`}
            </p>
          </div>
        ) : (
          <>
            {cantidad > 0 && (
              <div
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-[#FFF4BF] bg-[#FFFBF0] p-2"
              >
                <button
                  type="button"
                  onClick={onDecrease}
                  className="rounded-lg border border-slate-300 bg-white py-2 font-bold text-slate-900 transition hover:bg-slate-100"
                  aria-label={`Disminuir ${producto.nombre}`}
                >
                  −
                </button>

                <div className="text-center text-xl font-black">{cantidad}</div>

                <button
                  type="button"
                  onClick={onIncrease}
                  className="rounded-lg border border-slate-500 bg-slate-600 py-2 font-bold text-white transition hover:bg-slate-700"
                  aria-label={`Aumentar ${producto.nombre}`}
                >
                  +
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onAdd}
              className="min-h-[48px] w-full rounded-xl border border-slate-500 bg-slate-600 py-3 font-bold text-white transition hover:bg-slate-700"
              aria-label={`Agregar ${producto.nombre}`}
            >
              {cantidad > 0 ? "Agregar más" : "Agregar"}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function PdvPage() {
  const navigate = useNavigate();
  const { isAccessible, isHighContrast, isVoiceEnabled, isSoundEnabled, isPanelOpen, openAccessibilityPanel } = useAccessibilityContext();
  const { speak } = useVoice({ enabled: isVoiceEnabled });
  const { speak: speakOnDemand } = useVoice({ enabled: true });

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FiltroCategoria>("Todos");

  const [searchTerm, setSearchTerm] = useState("");

  const [items, setItems] = useState<Record<number, number>>({});
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("");
  const [observacion, setObservacion] = useState("");
  const [accessibleObservationType, setAccessibleObservationType] = useState<"cocina" | "cliente">("cocina");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [accessibleStep, setAccessibleStep] = useState<number>(1);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const ticketRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundEndRef = useRef(0);

  const loadProductos = (isMountedRef?: { current: boolean }) => {
    setLoadingProductos(true);
    setLoadingError(null);

    getProductos()
      .then((list) => {
        if (!isMountedRef || isMountedRef.current) {
          setProductos(list || []);
        }
      })
      .catch(() => {
        if (!isMountedRef || isMountedRef.current) {
          setLoadingError("No fue posible cargar productos");
        }
      })
      .finally(() => {
        if (!isMountedRef || isMountedRef.current) {
          setLoadingProductos(false);
        }
      });
  };

  useEffect(() => {
    const isMountedRef = { current: true };

    loadProductos(isMountedRef);

    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  const getAudioContext = () => {
    if (!isSoundEnabled || typeof window === "undefined") {
      return null;
    }

    const AudioContextClass = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume().catch(() => {});
    }

    return audioContextRef.current;
  };

  const scheduleTone = (context: AudioContext, startAt: number, step: ToneStep) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = step.type || "sine";
    oscillator.frequency.setValueAtTime(step.frequency, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(step.volume || 0.045, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + step.durationMs / 1000);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startAt);
    oscillator.stop(startAt + step.durationMs / 1000 + 0.02);
  };

  const playSoundCue = (cue: SoundCue) => {
    const context = getAudioContext();
    if (!context) {
      return;
    }

    const steps = SOUND_CUES[cue];
    const baseStart = Math.max(context.currentTime + 0.01, lastSoundEndRef.current + 0.03);
    let soundEnd = baseStart;

    steps.forEach((step) => {
      const startAt = baseStart + (step.delayMs || 0) / 1000;
      scheduleTone(context, startAt, step);
      soundEnd = Math.max(soundEnd, startAt + step.durationMs / 1000);
    });

    lastSoundEndRef.current = soundEnd;
  };

  useEffect(() => {
    return () => {
      if (!audioContextRef.current) {
        return;
      }

      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, []);

  const productosConCategoria = useMemo<ProductoConCategoria[]>(() => {
    return productos.map((producto) => ({
      ...producto,
      categoria: detectCategoria(producto)
    }));
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const filtradosPorCategoria = filterProductosByCategory(
      productosConCategoria,
      selectedCategory
    );

    return filterProductosBySearch(filtradosPorCategoria, searchTerm);
  }, [productosConCategoria, searchTerm, selectedCategory]);

  const { detalles: pedidoDetalles, total, cantidad: totalItems } = useMemo(() => {
    return buildPedidoSummary(items, productos);
  }, [items, productos]);

  useEffect(() => {
    if (pedidoDetalles.length === 0) {
      setShowResetConfirm(false);
    }
  }, [pedidoDetalles.length]);

  const accessibleProductos = useMemo(() => {
    return filterProductosByCategory(productosConCategoria, selectedCategory);
  }, [productosConCategoria, selectedCategory]);

  const puedeRegistrar = pedidoDetalles.length > 0 && metodoPago !== "" && !sending;

  const announce = (message: string, options = {}) => {
    if (isVoiceEnabled) {
      speak(message, options);
    }
  };

  const handleReadPedidoSummary = () => {
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

    speakOnDemand(parts.join(" "), {
      priority: "high",
      dedupeKey: "read-summary",
      force: true,
      interrupt: true,
      rate: isAccessible ? 0.8 : 0.86
    });
  };

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

  const setItemQuantity = (producto: Producto, nextQuantity: number) => {
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
  };

  const clearPedidoForm = () => {
    setItems({});
    setMetodoPago("");
    setObservacion("");
    setAccessibleObservationType("cocina");
  };

  const addProduct = (producto: Producto) => {
    const nextQuantity = (items[producto.id] || 0) + 1;
    setItemQuantity(producto, nextQuantity);
    const msg = "Producto agregado";
    setFeedback({ type: "success", message: msg });
    playSoundCue("add");
    announce(msg, {
      priority: "normal",
      dedupeKey: "product-added",
      cooldownMs: 1800
    });
  };

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
  const easyContinueOffset = "mr-20 sm:mr-28 md:mr-40 xl:mr-48";
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
    const stepGuidance = [
      {
        title: "Elige una categoría",
        description: "Toca una sola categoría para ver solo lo necesario y seguir sin perderte."
      },
      {
        title: "Elige un producto",
        description: "Selecciona un producto y usa los botones grandes para indicar la cantidad."
      },
      {
        title: "Revisa tu pedido",
        description: "Confirma lo que elegiste antes de seguir al siguiente paso."
      },
      {
        title: "Agrega un comentario",
        description: "Este paso es opcional. Solo úsalo si realmente necesitas dejar una nota."
      },
      {
        title: "Selecciona el pago",
        description: "Escoge un método de pago con una sola pulsación."
      },
      {
        title: "Registrar pedido",
        description: "Revisa todo y presiona el botón principal para finalizar."
      }
    ][accessibleStep - 1];

    return (
      <div className="space-y-5">
        <header className={`rounded-3xl ${cardBorder} p-6 sm:p-8 ${panelBg}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className={`text-sm font-black uppercase tracking-[0.18em] ${isHighContrast ? "contrast-secondary-text" : "text-slate-500"}`}>
                Riquísimo · Modo Fácil
              </p>
              <h1 className={`mt-3 font-black tracking-tight ${isAccessible ? "text-[2rem] sm:text-[2.35rem]" : "text-2xl"}`}>
                {stepGuidance.title}
              </h1>
              <p className={`mt-3 max-w-2xl leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-600"} ${isAccessible ? "text-lg" : "text-base"}`}>
                {stepGuidance.description}
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3">
              <div className={`inline-flex min-h-[56px] items-center rounded-2xl border px-4 py-3 ${isHighContrast ? "contrast-panel-soft border-yellow-400" : isAccessible ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-900"}`}>
                <p className="font-black">
                  Paso {accessibleStep} de {ACCESSIBLE_STEP_COUNT}
                </p>
              </div>

              <button
                type="button"
                onClick={openAccessibilityPanel}
                aria-haspopup="dialog"
                aria-expanded={isPanelOpen}
                className={`inline-flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border px-4 py-3 font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-slate-900"
                }`}
              >
                <span aria-hidden="true" className="text-2xl">♿</span>
                <span>Accesibilidad</span>
              </button>
            </div>
          </div>
        </header>

        {feedback && (
          <div className={`rounded-2xl ${cardBorder} p-4 ${feedback.type === "success" ? "bg-emerald-50 border-emerald-300" : "bg-red-50 border-red-300"}`} role={feedback.type === "success" ? "status" : "alert"} aria-live="polite">
            <div className="flex items-center justify-center gap-3">
              <span className={`text-2xl font-bold ${feedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                {feedback.type === "success" ? "✅" : "❌"}
              </span>
              <p className="font-bold text-lg">{feedback.message}</p>
            </div>
          </div>
        )}

        {/* Step panels */}
        {accessibleStep === 1 && (
          <section aria-labelledby="step1" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
            <h2 id="step1" className="font-black text-2xl mb-4">Paso 1: Elige categoría</h2>
            <div className="grid grid-cols-2 gap-4">
              {FILTROS.map((filtro) => (
                <button
                  key={filtro.value}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(filtro.value);
                    setAccessibleStep(2);
                  }}
                  className={`min-h-[56px] rounded-xl font-bold text-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-4 ${
                    selectedCategory === filtro.value ? "bg-slate-900 text-white border-2 border-slate-900" : "bg-white text-slate-900 border-2 border-slate-300"
                  } ${isHighContrast ? (selectedCategory === filtro.value ? "contrast-button-primary" : "contrast-button-secondary") : ""}`}
                  aria-pressed={selectedCategory === filtro.value}
                >
                  <span>{filtro.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="mb-3 text-base font-semibold text-slate-600">Accesos rápidos</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate("/pedidos")}
                  className={`min-h-[56px] rounded-xl border-2 px-4 py-3 text-lg font-bold transition ${
                    isHighContrast
                      ? "contrast-button-secondary"
                      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-900"
                  }`}
                >
                  Ir a Pedidos
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/productos")}
                  className={`min-h-[56px] rounded-xl border-2 px-4 py-3 text-lg font-bold transition ${
                    isHighContrast
                      ? "contrast-button-secondary"
                      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-900"
                  }`}
                >
                  Ir a Productos
                </button>
              </div>
            </div>
          </section>
        )}

        {accessibleStep === 2 && (
          <section aria-labelledby="step2" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
            <h2 id="step2" className="font-black text-2xl mb-4">Paso 2: Elige productos</h2>
            <p className="mb-3 text-lg font-semibold">Elige el producto y responde: ¿cuánto quieres?</p>
            <p className="mb-4 text-base text-slate-600">Usa los botones de menos y más para ajustar la cantidad.</p>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {accessibleProductos.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed p-8 text-center col-span-2">
                  <p className="font-bold text-lg">No hay productos en esta categoría.</p>
                  <p className="mt-2">Prueba otra categoría o selecciona "Todos".</p>
                  <div className="mt-4 flex justify-center">
                    <button type="button" onClick={() => setAccessibleStep(1)} className={`rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Volver a categorías</button>
                  </div>
                </div>
              ) : (
                accessibleProductos.map((producto) => (
                  <div key={producto.id}>
                    <ProductCard
                      producto={producto}
                      cantidad={items[producto.id] || 0}
                      isAccessible={true}
                      isHighContrast={isHighContrast}
                      onIncrease={() => increaseProduct(producto)}
                      onDecrease={() => decreaseProduct(producto)}
                      onAdd={() => {
                        addProduct(producto);
                        // remain in step 2 so user can add more
                      }}
                    />
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={goPrevAccessibleStep} className={`rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Atrás</button>
              <button type="button" onClick={goNextAccessibleStep} className={`ml-auto rounded-lg bg-slate-900 py-3 px-4 font-bold text-white ${easyContinueOffset} ${isHighContrast ? "contrast-button-primary" : ""}`}>Continuar</button>
            </div>
          </section>
        )}

        {accessibleStep === 3 && (
          <section aria-labelledby="step3" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
            <h2 id="step3" className="font-black text-2xl mb-4">Paso 3: Revisa tu pedido</h2>
            {pedidoDetalles.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed p-8 text-center">
                <p className="font-bold text-lg">Todavía no hay productos agregados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pedidoDetalles.map((item) => (
                  <div key={item.productoId} className="rounded-lg p-4 bg-white border-2 border-slate-300 flex items-center justify-between">
                    <div>
                      <p className="font-black text-lg">{item.producto.nombre}</p>
                      <p className="text-slate-600">{item.cantidad} x {formatCurrency(item.producto.precio)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-lg">{formatCurrency(item.subtotal)}</p>
                      <button type="button" onClick={() => { removeProduct(item.productoId); }} className="rounded-lg bg-red-50 p-3 text-xl">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <p className="font-semibold">Subtotal: {formatCurrency(total)}</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={goPrevAccessibleStep} className={`rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Atrás</button>
              <button type="button" onClick={goNextAccessibleStep} disabled={pedidoDetalles.length === 0} className={`ml-auto rounded-lg py-3 px-4 font-bold ${easyContinueOffset} ${pedidoDetalles.length === 0 ? "bg-slate-300 text-slate-500" : "bg-slate-900 text-white"} ${isHighContrast && pedidoDetalles.length > 0 ? "contrast-button-primary" : ""}`}>Continuar</button>
            </div>
          </section>
        )}

        {accessibleStep === 4 && (
          <section aria-labelledby="step4" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
            <h2 id="step4" className="font-black text-2xl mb-4">Paso 4: Agrega comentario</h2>
            <p className="mb-3 text-lg font-semibold">Puedes dejar una nota para cocina o para el cliente.</p>
            <p className="mb-4 text-base text-slate-600">Este paso es opcional. Si no necesitas comentario, puedes continuar igual.</p>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAccessibleObservationType("cocina")}
                className={`rounded-xl border-2 px-4 py-4 text-left font-bold transition ${
                  accessibleObservationType === "cocina"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                }`}
                aria-pressed={accessibleObservationType === "cocina"}
              >
                <span className="block text-lg">Para cocina</span>
                <span className={`mt-1 block text-sm ${accessibleObservationType === "cocina" ? "text-white/80" : "text-slate-500"}`}>
                  Instrucciones de preparacion
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAccessibleObservationType("cliente")}
                className={`rounded-xl border-2 px-4 py-4 text-left font-bold transition ${
                  accessibleObservationType === "cliente"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                }`}
                aria-pressed={accessibleObservationType === "cliente"}
              >
                <span className="block text-lg">Para cliente</span>
                <span className={`mt-1 block text-sm ${accessibleObservationType === "cliente" ? "text-white/80" : "text-slate-500"}`}>
                  Indicaciones de entrega o retiro
                </span>
              </button>
            </div>

            <div className="mb-4">
              <label htmlFor="accessibleObservacion" className="mb-2 block font-bold text-base">
                Comentario
              </label>
              <textarea
                id="accessibleObservacion"
                rows={4}
                value={observacion}
                onChange={(event) => setObservacion(event.target.value)}
                placeholder={accessibleObservationPlaceholder}
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900 focus:ring-offset-2"
              />
            </div>

            {observacion.trim() && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {accessibleObservationType === "cocina" ? "Comentario para cocina" : "Comentario para cliente"}
                </p>
                <p className="mt-2 font-medium text-slate-900">{observacion}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={goPrevAccessibleStep} className={`rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Atrás</button>
              <button type="button" onClick={goNextAccessibleStep} className={`ml-auto rounded-lg bg-slate-900 py-3 px-4 font-bold text-white ${easyContinueOffset} ${isHighContrast ? "contrast-button-primary" : ""}`}>Continuar</button>
            </div>
          </section>
        )}

        {accessibleStep === 5 && (
          <section aria-labelledby="step5" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
            <h2 id="step5" className="font-black text-2xl mb-4">Paso 5: Método de pago</h2>
            <div className="space-y-3">
	              {PAYMENT_OPTIONS.map((option) => {
	                const active = metodoPago === option.value;
	                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectMetodoPago(option.value)}
	                    className={`w-full flex items-center justify-between rounded-xl py-4 px-4 font-bold ${active ? "bg-slate-900 text-white" : "bg-white text-slate-900 border-2 border-slate-300"}`}
	                    aria-pressed={active}
	                  >
	                    <option.Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
	                    <span>{option.label}</span>
	                    {active && <span className="text-sm">Seleccionado</span>}
	                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={goPrevAccessibleStep} className={`rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Atrás</button>
              <button type="button" onClick={goNextAccessibleStep} disabled={metodoPago === ""} className={`ml-auto rounded-lg py-3 px-4 font-bold ${easyContinueOffset} ${metodoPago === "" ? "bg-slate-300 text-slate-500" : "bg-slate-900 text-white"} ${isHighContrast && metodoPago !== "" ? "contrast-button-primary" : ""}`}>Continuar</button>
            </div>
          </section>
        )}

        {accessibleStep === 6 && (
          <section aria-labelledby="step6" className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
            <h2 id="step6" className="font-black text-2xl mb-4">Paso 6: Registrar pedido</h2>
            <p className="mb-4">Verifica y confirma. Luego presiona Registrar pedido.</p>

            <div className="rounded-xl bg-white border-2 border-slate-300 p-4 mb-4">
              <p className="font-bold">Total a pagar</p>
              <p className="font-black text-3xl">{formatCurrency(total)}</p>
            </div>

            {observacion.trim() && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-4">
                <p className="font-bold text-slate-900">
                  {accessibleObservationType === "cocina" ? "Comentario para cocina" : "Comentario para cliente"}
                </p>
                <p className="mt-2 text-slate-700">{observacion}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={goPrevAccessibleStep} className={`rounded-lg bg-white border-2 border-slate-900 py-4 px-6 font-bold ${isHighContrast ? "contrast-button-secondary" : ""}`}>Atrás</button>
              <div className={`ml-auto flex flex-wrap items-center gap-3 ${easyContinueOffset}`}>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={pedidoDetalles.length === 0}
                  className={`rounded-lg border-2 py-4 px-6 font-bold text-lg transition ${
                    pedidoDetalles.length === 0
                      ? "border-slate-300 bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "border-slate-900 bg-white text-slate-900 hover:bg-slate-100"
                  } ${isHighContrast && pedidoDetalles.length > 0 ? "contrast-button-secondary" : ""}`}
                  style={{ minHeight: 64 }}
                >
                  🖨 Imprimir comanda
                </button>
                <button type="button" onClick={handleSubmit} disabled={!puedeRegistrar} className={`rounded-lg border-2 py-4 px-6 font-black text-lg ${puedeRegistrar ? "border-emerald-900 bg-emerald-700 text-white hover:bg-emerald-800" : "border-slate-300 bg-slate-300 text-slate-500"} ${isHighContrast && puedeRegistrar ? "contrast-button-success" : ""}`} style={{ minHeight: 64 }}>
                  {sending ? "Registrando..." : "Registrar pedido"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <main className={`min-h-screen ${bgWrapper} ${textColor}`}>
	      <div className={`${headerBg} no-print`}>
	        <div className={`mx-auto flex w-full max-w-[1520px] items-center px-3 sm:px-4 lg:px-5 xl:px-6 ${isAccessible ? "min-h-[84px] py-4" : "min-h-[64px] py-3"}`}>
            <h1 className={`font-black leading-none tracking-tight contrast-important ${isAccessible ? "text-3xl" : "text-xl"}`}>
              Punto de Venta
            </h1>
	        </div>
	      </div>

      <div className={`mx-auto w-full max-w-[1520px] px-3 sm:px-4 lg:px-5 xl:px-6 print:px-0 print:py-0 ${isAccessible ? "py-6" : "py-2 sm:py-3"}`} style={{ backgroundColor: isHighContrast ? "#000000" : isAccessible ? "white" : "#F7F7F7" }}>
        {loadingProductos && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-6 flex items-center gap-4 rounded-2xl p-6 ${
              isAccessible ? "bg-white border-2 border-slate-900" : "bg-[#FFF8DC] border border-[#FFF4BF]"
            }`}
          >
            <span className="text-4xl animate-spin">⏳</span>
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
            <span className="text-4xl shrink-0">⚠️</span>
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

        {isAccessible ? (
          <AccessibleFlow />
	        ) : (
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
              <section className={`rounded-[22px] ${cardBorder} p-5 ${panelBg} print:hidden no-print`}>
              <div className="mb-5">
              <h2 className={`font-black mb-3 ${isAccessible ? "text-2xl" : "text-lg"}`}>Filtrar por categoría</h2>
              <div className={`flex flex-wrap gap-2`}>
                {FILTROS.map((filtro) => (
                  <CategoryButton
                    key={filtro.value}
                    filtro={filtro}
                    active={selectedCategory === filtro.value}
                    isAccessible={isAccessible}
                    isHighContrast={isHighContrast}
                    onClick={() => setSelectedCategory(filtro.value)}
                  />
                ))}
              </div>
            </div>

                <div className="mb-5">
	                <label htmlFor="searchProducto" className={`block font-bold mb-2 ${isAccessible ? "text-lg" : "text-sm"}`}>
	                  <span className="inline-flex items-center gap-2 contrast-important">
	                    <Search className={`h-4 w-4 ${isHighContrast ? "text-current" : "text-black"}`} aria-hidden="true" />
	                    <span>Buscar producto</span>
	                  </span>
	                </label>
	                <input
                  id="searchProducto"
                  type="text"
                  placeholder={isAccessible ? "Escribe nombre o descripción..." : "Buscar..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full rounded-lg border px-4 py-2 outline-none transition focus:ring-2 contrast-input ${isAccessible ? "border-2 border-slate-900 text-lg py-3 focus:ring-slate-900" : "border border-slate-300 focus:ring-blue-400"}`}
                />
              </div>

            <div className="space-y-5">
              {!loadingProductos && productosFiltrados.length === 0 && !loadingError ? (
                <div className={`rounded-2xl border-2 border-dashed p-8 text-center ${isAccessible ? "border-slate-300 bg-slate-50" : "border-slate-300 bg-slate-50"}`}>
                  <p className={`font-bold ${isAccessible ? "text-xl" : "text-base"}`}>No hay productos en esta categoría</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:[grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
                  {productosFiltrados.map((producto) => (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      cantidad={items[producto.id] || 0}
                      isAccessible={isAccessible}
                      isHighContrast={isHighContrast}
                      onIncrease={() => increaseProduct(producto)}
                      onDecrease={() => decreaseProduct(producto)}
                      onAdd={() => addProduct(producto)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className={`rounded-[22px] ${cardBorder} p-6 ${panelBg} h-fit sticky top-6 print:static print:p-0 print:border-0 print:rounded-none print:bg-transparent`}>
            <div className="mb-5 flex flex-col gap-3">
              <h2 className={`font-black ${isAccessible ? "text-2xl" : "text-lg"}`}>Resumen del pedido</h2>
              <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_48px] items-center gap-3 no-print print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={pedidoDetalles.length === 0}
                  className={`w-full min-w-0 ${quickActionButtonClass} ${pedidoDetalles.length === 0 ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  <Printer className={`h-4 w-4 shrink-0 ${isHighContrast ? "text-current" : "text-slate-700"}`} aria-hidden="true" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={handleReadPedidoSummary}
                  className={`w-full min-w-0 ${quickActionButtonClass}`}
                  aria-label="Leer resumen del pedido"
                  title="Leer resumen del pedido"
                >
                  <span className="inline-flex items-center gap-2">
                    <Volume2 className={`h-4 w-4 ${isHighContrast ? "text-current" : "text-black"}`} aria-hidden="true" />
                    <span>Leer</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={openResetConfirm}
                  disabled={pedidoDetalles.length === 0}
                  className={`justify-self-end ${quickActionIconButtonClass} ${pedidoDetalles.length === 0 ? "cursor-not-allowed opacity-40" : ""}`}
                  title="Vaciar pedido"
                  aria-label="Vaciar pedido"
                >
                  🗑
                </button>
              </div>
            </div>

            {showResetConfirm && (
              <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 no-print print:hidden ${
                isHighContrast
                  ? "contrast-panel-soft"
                  : isAccessible
                    ? "border-red-700 bg-red-50"
                    : "border-red-200 bg-red-50"
              }`}>
                <p className={`font-bold ${isAccessible ? "text-lg" : "text-sm"}`}>
                  ¿Está seguro de borrar el pedido?
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={resetPedido}
                    className={`rounded-lg border px-4 py-2 font-bold transition ${
                      isHighContrast
                        ? "contrast-button-danger"
                        : "border-red-700 bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    Sí, borrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className={`${quickActionButtonClass}`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {feedback && (
              <div
                ref={feedbackRef}
                tabIndex={-1}
                role={feedback.type === "success" ? "status" : "alert"}
                aria-live="polite"
                className="mb-6 min-w-0 outline-none"
              >
                <Toast
                  feedback={feedback}
                  isAccessible={isAccessible}
                  isHighContrast={isHighContrast}
                  className="w-full"
                />
              </div>
            )}

            <div className={`mb-5 max-h-96 overflow-y-auto rounded-xl p-5 ${isAccessible ? "bg-slate-50 border-2 border-slate-900" : "bg-slate-50 border border-slate-200"}`}>
              {pedidoDetalles.length === 0 ? (
                <p className={`text-center font-bold text-slate-500 ${isAccessible ? "text-lg" : "text-base"}`}>
                  Sin productos seleccionados
                </p>
              ) : (
                <div className="space-y-3">
                  {pedidoDetalles.map((item) => (
                    <div
                      key={item.productoId}
                      className={`rounded-xl p-4 flex items-start justify-between gap-3 ${
                        isAccessible
                          ? "bg-white border border-slate-300"
                          : "bg-white border border-slate-200"
                      }`}
                    >
                        <div className="min-w-0 flex-1">
                        <p className={`font-bold text-slate-950 ${isAccessible ? "text-base" : "text-sm"}`}>
                          {item.producto.nombre}
                        </p>
                        <p className={`text-slate-600 ${isAccessible ? "text-base" : "text-xs"}`}>
                          {item.cantidad} x {formatCurrency(item.producto.precio)}
                        </p>
                      </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className={`font-bold ${isAccessible ? "text-base" : "text-sm"}`}>
                            {formatCurrency(item.subtotal)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeProduct(item.productoId)}
                            className={`text-lg p-1 rounded transition hover:opacity-70 ${isAccessible ? "hover:bg-red-50" : "hover:bg-red-50"}`}
                            title={`Eliminar ${item.producto.nombre}`}
                            aria-label={`Eliminar ${item.producto.nombre} del pedido`}
                          >
                            ✕
                          </button>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className={`mb-5 rounded-xl p-5 ${
                isAccessible
                  ? "bg-slate-100 border-2 border-slate-900"
                  : "bg-[#FFF8DC] border border-[#FFF4BF]"
              }`}
            >
              <p className={`text-slate-600 font-semibold ${isAccessible ? "text-base" : "text-xs"} uppercase ${isHighContrast ? "contrast-secondary-text" : ""}`}>Total a pagar</p>
              <p className={`mt-2 font-black ${isAccessible ? "text-4xl text-slate-900" : "text-3xl text-amber-700"} ${isHighContrast ? "contrast-important" : ""}`}>
                {formatCurrency(total)}
              </p>
            </div>

            <div className="mb-5 space-y-3">
              <h3 className={`font-bold ${isAccessible ? "text-xl" : "text-base"}`}>Método de pago</h3>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_OPTIONS.map((option) => {
                  const active = metodoPago === option.value;
	                return (
	                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectMetodoPago(option.value)}
                        className={`flex min-h-[64px] flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 font-bold transition focus:outline-none focus:ring-4 focus:ring-slate-900 focus:ring-offset-2 ${
                          active
                            ? isAccessible
                              ? "bg-slate-900 text-white border-2 border-slate-900"
                              : "bg-slate-600 text-white border-2 border-slate-600"
                            : isAccessible
                              ? "bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-50"
                              : "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50"
                        }`}
	                      aria-pressed={active}
	                    >
	                      <option.Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
	                      <span className={`${isAccessible ? "text-sm" : "text-xs"}`}>{option.label}</span>
	                    </button>
	                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="observacion" className={`block font-bold mb-2 ${isAccessible ? "text-base" : "text-sm"}`}>
                <span className="contrast-important">Observación</span>
              </label>
              <textarea
                id="observacion"
                rows={3}
                value={observacion}
                onChange={(event) => setObservacion(event.target.value)}
                placeholder="Ej: sin cebolla, extra salsa..."
                className={`w-full rounded-lg border px-3 py-2 outline-none transition focus:ring-2 contrast-input ${
                  isAccessible
                    ? "border-2 border-slate-900 bg-white text-slate-950 focus:ring-slate-900 min-h-[80px] text-base"
                    : "border-slate-300 bg-white text-slate-950 focus:ring-[#2F5FE3] min-h-[72px] text-sm"
                }`}
              />
            </div>

            <div className="space-y-2 mb-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!puedeRegistrar}
                className={`w-full rounded-lg border-2 font-bold transition py-3 ${
                  puedeRegistrar
                    ? isAccessible
                      ? "border-emerald-900 bg-emerald-700 text-white hover:bg-emerald-800 min-h-[56px] text-lg"
                      : "border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-800 min-h-[56px]"
                    : "border-slate-300 bg-slate-300 text-slate-500 cursor-not-allowed min-h-[56px]"
                } ${isHighContrast && puedeRegistrar ? "contrast-button-success" : ""}`}
              >
                {sending ? "Registrando..." : "Registrar pedido"}
              </button>
            </div>
          </aside>
          </div>
        )}

        <div className="hidden print:block" ref={ticketRef}>
          <TicketComanda
            pedidoDetalles={pedidoDetalles}
            total={total}
            metodoPago={metodoPago}
            observacion={observacion}
            numeroPedido={undefined}
            isAccessible={isAccessible}
          />
        </div>
      </div>

    </main>
  );
}

export default PdvPage;
