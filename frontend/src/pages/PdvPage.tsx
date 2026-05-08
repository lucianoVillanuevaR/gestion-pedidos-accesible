import { useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
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
  type FiltroCategoria,
  type ProductoConCategoria
} from "../utils/pdv";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

const ACCESSIBLE_STEP_COUNT = 6;
const PAYMENT_OPTIONS = [
  { value: "efectivo", label: "Efectivo", icon: "💵" },
  { value: "tarjeta", label: "Tarjeta", icon: "💳" },
  { value: "transferencia", label: "Transferencia", icon: "↔️" }
] as const;

function Toast({
  feedback,
  isAccessible,
  className = ""
}: {
  feedback: FeedbackState | null;
  isAccessible: boolean;
  className?: string;
}) {
  if (!feedback) return null;

  const isSuccess = feedback.type === "success";
  const bgClass = isAccessible
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
          <p className={`font-bold ${isAccessible ? "text-lg" : "text-base"}`}>{feedback.message}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, isAccessible }: { label: string; value: string | number; isAccessible: boolean }) {
  return (
    <div
      className={`rounded-2xl px-4 ${isAccessible ? "py-3" : "py-2"} ${
        isAccessible
          ? "bg-white border-2 border-slate-900 shadow-none"
          : "bg-white border border-slate-200 shadow-sm"
      }`}
    >
      <p className={`uppercase tracking-wide text-slate-600 font-semibold ${isAccessible ? "text-base" : "text-xs"}`}>{label}</p>
      <p className={`mt-1 font-black text-slate-900 ${isAccessible ? "text-3xl" : "text-lg"}`}>{value}</p>
    </div>
  );
}

function CategoryButton({ filtro, active, isAccessible, onClick }: { filtro: { value: FiltroCategoria; label: string }; active: boolean; isAccessible: boolean; onClick: () => void }) {
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
        }`}
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
      }`}
    >
      {filtro.label}
    </button>
  );
}

function ProductCard({
  producto,
  cantidad,
  isAccessible,
  onIncrease,
  onDecrease,
  onAdd
}: {
  producto: Producto;
  cantidad: number;
  isAccessible: boolean;
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
      }`}
    >
      <div
        className={`h-32 overflow-hidden ${
          isAccessible
            ? "bg-slate-100 border-b-2 border-slate-900"
            : "bg-gradient-to-br from-[#FFF8DC] via-[#FFFBF0] to-[#F7F7F7]"
        }`}
      >
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.altText || producto.nombre}
            className="h-full w-full object-cover"
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
          }`}
        >
          {getCategoriaLabel(categoria)}
        </span>

        <div>
          <h3 className={`font-black leading-tight text-slate-950 ${isAccessible ? "text-2xl" : "text-lg"}`}>
            {producto.nombre}
          </h3>
          {producto.descripcion && (
            <p className={`mt-1 text-slate-600 ${isAccessible ? "text-base" : "text-sm"}`}>{producto.descripcion}</p>
          )}
        </div>

        <div className={`pt-2 border-t ${isAccessible ? "border-slate-300" : "border-amber-100"}`}>
          <p className={`font-black ${isAccessible ? "text-2xl" : "text-xl"} ${isAccessible ? "text-slate-900" : "text-amber-700"}`}>
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
  const { isAccessible, isVoiceEnabled, isSoundEnabled } = useAccessibilityContext();
  const { speak } = useVoice({ enabled: isVoiceEnabled });

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

  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const ticketRef = useRef<HTMLDivElement | null>(null);

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

  const playTone = (frequency = 880, duration = 120) => {
    if (!isSoundEnabled || typeof window === "undefined") {
      return;
    }

    const AudioContextClass = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.04;

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + duration / 1000);
    oscillator.onended = () => {
      context.close();
    };
  };

  const productosConCategoria = useMemo<ProductoConCategoria[]>(() => {
    return productos.map((producto) => ({
      ...producto,
      categoria: detectCategoria(producto)
    }));
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const filtradosPorCategoria = filterProductosByCategory(
      productosConCategoria,
      selectedCategory,
      items
    );

    return filterProductosBySearch(filtradosPorCategoria, searchTerm);
  }, [items, productosConCategoria, searchTerm, selectedCategory]);

  const { detalles: pedidoDetalles, total, cantidad: totalItems } = useMemo(() => {
    return buildPedidoSummary(items, productos);
  }, [items, productos]);

  const accessibleProductos = useMemo(() => {
    return filterProductosByCategory(productosConCategoria, selectedCategory, items);
  }, [items, productosConCategoria, selectedCategory]);

  const puedeRegistrar = pedidoDetalles.length > 0 && metodoPago !== "" && !sending;

  const announce = (message: string) => {
    if (isVoiceEnabled) {
      speak(message);
    }
  };

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
    const msg = `${producto.nombre} agregado al pedido`;
    setFeedback({ type: "success", message: msg });
    playTone(880, 90);
    announce(msg);
  };

  const increaseProduct = (producto: Producto) => {
    const nextQuantity = (items[producto.id] || 0) + 1;
    setItemQuantity(producto, nextQuantity);
  };

  const decreaseProduct = (producto: Producto) => {
    const currentQuantity = items[producto.id] || 0;
    setItemQuantity(producto, currentQuantity - 1);
  };

    const removeProduct = (productoId: number) => {
      setItems((prevItems) => {
        const newItems = { ...prevItems };
        delete newItems[productoId];
        return newItems;
      });
      const producto = productos.find(p => p.id === productoId);
      if (producto) {
        const msg = `${producto.nombre} removido del pedido`;
        setFeedback({ type: "success", message: msg });
        playTone(740, 90);
        announce(msg);
      }
    };

  const resetPedido = () => {
    clearPedidoForm();
    setFeedback(null);
  };

  const handleSubmit = async () => {
    setFeedback(null);

    if (!puedeRegistrar) {
      setFeedback({ type: "error", message: "Seleccione productos y método de pago" });
      playTone(220, 160);
      announce("Error al registrar pedido");
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
      playTone(990, 170);
      announce(successMsg + ". Pedido registrado correctamente.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al registrar pedido";
      setFeedback({ type: "error", message: message || "Error al registrar" });
      playTone(220, 160);
      announce("Error al registrar pedido: " + (message || "desconocido"));
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
      // Opcional: Mostrar confirmación después de imprimir
      const msg = "Comanda impresa correctamente";
      setFeedback({ type: "success", message: msg });
      if (isVoiceEnabled) {
        speak(msg);
      }
    }
  });

  const bgWrapper = isAccessible ? "bg-white" : "bg-[#F7F7F7]";
  const textColor = isAccessible ? "text-slate-950" : "text-[#1F2937]";
  const cardBorder = isAccessible ? "border-2 border-slate-900" : "border border-slate-200";
  const headerBg = isAccessible ? "bg-slate-900 text-white" : "bg-[#FECE00] text-[#1F2937]";
  const panelBg = isAccessible ? "bg-white" : "bg-[#F7F7F7]";
  const easyContinueOffset = "mr-20 sm:mr-28 md:mr-40 xl:mr-48";
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
        speak("Modo fácil activado. Paso 1: elige una categoría.");
        break;
      case 2:
        speak("Paso 2: elige el producto y responde cuánto quieres con los botones más o menos.");
        break;
      case 3:
        speak("Paso 3: revisa tu pedido.");
        break;
      case 4:
        speak("Paso 4: si quieres, agrega un comentario para cocina o para el cliente.");
        break;
      case 5:
        speak("Paso 5: selecciona el método de pago.");
        break;
      case ACCESSIBLE_STEP_COUNT:
        speak("Paso 6: confirma y registra el pedido.");
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
        if (isVoiceEnabled) {
          speak("Volviendo al paso 1");
        }
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
    return (
      <div className="space-y-6">
        <header className={`rounded-2xl ${cardBorder} p-6 ${panelBg}`}>
          <h1 className="font-black text-2xl">Riquísimo - Modo Fácil</h1>
          <p className="mt-2 font-semibold">Paso {accessibleStep} de {ACCESSIBLE_STEP_COUNT}</p>
          <div className="mt-3 flex gap-4">
            <div className="rounded-xl bg-white border p-3">
              <p className="text-sm">Productos</p>
              <p className="font-black text-xl">{productos.length}</p>
            </div>
            <div className="rounded-xl bg-white border p-3">
              <p className="text-sm">Items</p>
              <p className="font-black text-xl">{totalItems}</p>
            </div>
            <div className="rounded-xl bg-white border p-3">
              <p className="text-sm">Total</p>
              <p className="font-black text-xl">{formatCurrency(total)}</p>
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
                    if (isVoiceEnabled) {
                      let available = [];
                      available = filterProductosByCategory(productosConCategoria, filtro.value, items);
                      const count = available.length;
                      const productList = available.map((p, i) => `${i + 1}. ${p.nombre}`).join(", ");
                      const countWord = count === 1 ? "producto" : "productos";
                      speak(`Has seleccionado ${filtro.label}. Hay ${count} ${countWord} disponibles: ${productList}. Ahora elige el producto y marca cuánto quieres con los botones más o menos.`);
                    }
                  }}
                  className={`min-h-[56px] rounded-xl font-bold text-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-4 ${
                    selectedCategory === filtro.value ? "bg-slate-900 text-white border-2 border-slate-900" : "bg-white text-slate-900 border-2 border-slate-300"
                  }`}
                  aria-pressed={selectedCategory === filtro.value}
                >
                  <span className="text-2xl">{getCategoriaLabel(filtro.value as any)}</span>
                  <span>{filtro.label}</span>
                </button>
              ))}
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
                    <button type="button" onClick={() => setAccessibleStep(1)} className="rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold">Volver a categorías</button>
                  </div>
                </div>
              ) : (
                accessibleProductos.map((producto) => (
                  <div key={producto.id}>
                    <ProductCard
                      producto={producto}
                      cantidad={items[producto.id] || 0}
                      isAccessible={true}
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
              <button type="button" onClick={goPrevAccessibleStep} className="rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold">Atrás</button>
              <button type="button" onClick={goNextAccessibleStep} className={`ml-auto rounded-lg bg-slate-900 py-3 px-4 font-bold text-white ${easyContinueOffset}`}>Continuar</button>
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
              <button type="button" onClick={goPrevAccessibleStep} className="rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold">Atrás</button>
              <button type="button" onClick={goNextAccessibleStep} disabled={pedidoDetalles.length === 0} className={`ml-auto rounded-lg py-3 px-4 font-bold ${easyContinueOffset} ${pedidoDetalles.length === 0 ? "bg-slate-300 text-slate-500" : "bg-slate-900 text-white"}`}>Continuar</button>
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
              <button type="button" onClick={goPrevAccessibleStep} className="rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold">Atrás</button>
              <button type="button" onClick={goNextAccessibleStep} className={`ml-auto rounded-lg bg-slate-900 py-3 px-4 font-bold text-white ${easyContinueOffset}`}>Continuar</button>
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
                    onClick={() => setMetodoPago(option.value)}
                    className={`w-full flex items-center justify-between rounded-xl py-4 px-4 font-bold ${active ? "bg-slate-900 text-white" : "bg-white text-slate-900 border-2 border-slate-300"}`}
                    aria-pressed={active}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span>{option.label}</span>
                    {active && <span className="text-sm">Seleccionado</span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={goPrevAccessibleStep} className="rounded-lg bg-white border-2 border-slate-900 py-3 px-4 font-bold">Atrás</button>
              <button type="button" onClick={goNextAccessibleStep} disabled={metodoPago === ""} className={`ml-auto rounded-lg py-3 px-4 font-bold ${easyContinueOffset} ${metodoPago === "" ? "bg-slate-300 text-slate-500" : "bg-slate-900 text-white"}`}>Continuar</button>
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
              <button type="button" onClick={goPrevAccessibleStep} className="rounded-lg bg-white border-2 border-slate-900 py-4 px-6 font-bold">Atrás</button>
              <div className={`ml-auto flex flex-wrap items-center gap-3 ${easyContinueOffset}`}>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={pedidoDetalles.length === 0}
                  className={`rounded-lg border-2 py-4 px-6 font-bold text-lg transition ${
                    pedidoDetalles.length === 0
                      ? "border-slate-300 bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "border-slate-900 bg-white text-slate-900 hover:bg-slate-100"
                  }`}
                  style={{ minHeight: 64 }}
                >
                  🖨 Imprimir comanda
                </button>
                <button type="button" onClick={handleSubmit} disabled={!puedeRegistrar} className={`rounded-lg py-4 px-6 font-black text-lg ${puedeRegistrar ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-500"}`} style={{ minHeight: 64 }}>
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
      <div className={`${headerBg} shadow-md no-print`}>
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${isAccessible ? "py-5" : "py-3"}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className={`font-black tracking-tight ${isAccessible ? "text-2xl" : "text-xl"}`}>
                Riquísimo - Punto de Venta
              </h1>
              <p className={`mt-1 opacity-90 font-medium ${isAccessible ? "text-sm" : "text-xs"}`}>Registra pedidos rápido y seguro</p>
            </div>

            <div className={`flex gap-3 flex-wrap justify-end`}>
              <StatCard label="Productos" value={productos.length} isAccessible={isAccessible} />
              <StatCard label="Items" value={totalItems} isAccessible={isAccessible} />
              <StatCard label="Total" value={formatCurrency(total)} isAccessible={isAccessible} />
            </div>
          </div>
        </div>
      </div>

      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 print:px-0 print:py-0 ${isAccessible ? "py-6" : "py-3"}`} style={{ backgroundColor: isAccessible ? "white" : "#F7F7F7" }}>
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
          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <section className={`rounded-2xl ${cardBorder} p-6 ${panelBg} print:hidden no-print`}>
            <div className="mb-6">
              <h2 className={`font-black mb-3 ${isAccessible ? "text-2xl" : "text-lg"}`}>Filtrar por categoría</h2>
              <div className={`flex flex-wrap gap-2`}>
                {FILTROS.map((filtro) => (
                  <CategoryButton
                    key={filtro.value}
                    filtro={filtro}
                    active={selectedCategory === filtro.value}
                    isAccessible={isAccessible}
                    onClick={() => setSelectedCategory(filtro.value)}
                  />
                ))}
              </div>
            </div>

              <div className="mb-6">
                <label htmlFor="searchProducto" className={`block font-bold mb-2 ${isAccessible ? "text-lg" : "text-sm"}`}>
                  🔍 Buscar producto
                </label>
                <input
                  id="searchProducto"
                  type="text"
                  placeholder={isAccessible ? "Escribe nombre o descripción..." : "Buscar..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full rounded-lg border px-4 py-2 outline-none transition focus:ring-2 ${isAccessible ? "border-2 border-slate-900 text-lg py-3 focus:ring-slate-900" : "border border-slate-300 focus:ring-blue-400"}`}
                />
              </div>

            <div className="space-y-6">
              {!loadingProductos && productosFiltrados.length === 0 && !loadingError ? (
                <div className={`rounded-2xl border-2 border-dashed p-8 text-center ${isAccessible ? "border-slate-300 bg-slate-50" : "border-slate-300 bg-slate-50"}`}>
                  <p className={`font-bold ${isAccessible ? "text-xl" : "text-base"}`}>No hay productos en esta categoría</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {productosFiltrados.map((producto) => (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      cantidad={items[producto.id] || 0}
                      isAccessible={isAccessible}
                      onIncrease={() => increaseProduct(producto)}
                      onDecrease={() => decreaseProduct(producto)}
                      onAdd={() => addProduct(producto)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className={`rounded-2xl ${cardBorder} p-6 ${panelBg} h-fit sticky top-6 print:static print:p-0 print:border-0 print:rounded-none print:bg-transparent`}>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <h2 className={`font-black ${isAccessible ? "text-2xl" : "text-lg"}`}>Resumen del pedido</h2>
              <div className="ml-auto flex max-w-full items-start gap-2">
                {feedback && (
                  <div
                    ref={feedbackRef}
                    tabIndex={-1}
                    role={feedback.type === "success" ? "status" : "alert"}
                    aria-live="polite"
                    className="min-w-0 outline-none"
                  >
                    <Toast
                      feedback={feedback}
                      isAccessible={isAccessible}
                      className="max-w-[240px] sm:max-w-[280px]"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={resetPedido}
                  disabled={pedidoDetalles.length === 0}
                  className={`text-2xl p-2 rounded-lg transition ${
                    isAccessible
                      ? "hover:bg-slate-100 disabled:opacity-30"
                      : "hover:bg-red-50 disabled:opacity-30"
                  }`}
                  title="Vaciar pedido"
                >
                  🗑
                </button>
              </div>
            </div>

            <div className={`mb-6 max-h-96 overflow-y-auto rounded-xl p-4 ${isAccessible ? "bg-slate-50 border-2 border-slate-900" : "bg-slate-50 border border-slate-200"}`}>
              {pedidoDetalles.length === 0 ? (
                <p className={`text-center font-bold text-slate-500 ${isAccessible ? "text-lg" : "text-base"}`}>
                  Sin productos seleccionados
                </p>
              ) : (
                <div className="space-y-2">
                  {pedidoDetalles.map((item) => (
                    <div
                      key={item.productoId}
                      className={`rounded-lg p-3 flex items-start justify-between gap-2 ${
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
              className={`mb-6 rounded-xl p-4 ${
                isAccessible
                  ? "bg-slate-100 border-2 border-slate-900"
                  : "bg-[#FFF8DC] border border-[#FFF4BF]"
              }`}
            >
              <p className={`text-slate-600 font-semibold ${isAccessible ? "text-base" : "text-xs"} uppercase`}>Total a pagar</p>
              <p className={`mt-2 font-black ${isAccessible ? "text-4xl text-slate-900" : "text-3xl text-amber-700"}`}>
                {formatCurrency(total)}
              </p>
            </div>

            <div className="mb-6 space-y-3">
              <h3 className={`font-bold ${isAccessible ? "text-xl" : "text-base"}`}>Método de pago</h3>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_OPTIONS.map((option) => {
                  const active = metodoPago === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMetodoPago(option.value)}
                        className={`flex flex-col items-center justify-center gap-2 rounded-lg py-3 font-bold transition focus:outline-none focus:ring-4 focus:ring-slate-900 focus:ring-offset-2 ${
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
                      <span className="text-2xl">{option.icon}</span>
                      <span className={`${isAccessible ? "text-sm" : "text-xs"}`}>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="observacion" className={`block font-bold mb-2 ${isAccessible ? "text-base" : "text-sm"}`}>
                Observación
              </label>
              <textarea
                id="observacion"
                rows={3}
                value={observacion}
                onChange={(event) => setObservacion(event.target.value)}
                placeholder="Ej: sin cebolla, extra salsa..."
                className={`w-full rounded-lg border px-3 py-2 outline-none transition focus:ring-2 ${
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
                className={`w-full rounded-lg font-bold transition py-3 ${
                  puedeRegistrar
                    ? isAccessible
                      ? "bg-slate-900 text-white border-2 border-slate-900 hover:bg-black min-h-[56px] text-lg"
                      : "bg-slate-600 text-white border border-slate-500 hover:bg-slate-700 min-h-[56px]"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed min-h-[56px]"
                }`}
              >
                {sending ? "Registrando..." : "Registrar pedido"}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={pedidoDetalles.length === 0}
                className={`w-full rounded-lg font-bold transition py-3 ${
                  isAccessible
                    ? "bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-100 disabled:opacity-30 min-h-[56px]"
                    : "bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200 disabled:opacity-30 min-h-[56px]"
                }`}
              >
                🖨 Imprimir comanda
              </button>
            </div>

            <div className="flex gap-2 mb-4 no-print print:hidden">
              <button
                type="button"
                onClick={() => speak("Voz de prueba")}
                className={`flex-1 rounded-lg font-bold py-2 text-sm transition ${
                  isAccessible
                    ? "bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50"
                    : "bg-slate-100 border border-slate-300 text-slate-900 hover:bg-slate-200"
                }`}
              >
                🔊 Voz
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
