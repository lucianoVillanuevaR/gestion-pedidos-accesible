import { useEffect, useMemo, useRef, useState } from "react";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import { createPedido } from "../services/pedidos";
import { getProductos } from "../services/productos";
import useVoice from "../hooks/useVoice";
import type { CreatePedidoPayload, MetodoPago, PedidoResponse, Producto } from "../types";
import {
  FILTROS,
  buildPedidoSummary,
  detectCategoria,
  formatCurrency,
  getCategoriaLabel,
  getPaymentLabel,
  type FiltroCategoria,
  type ProductoCategoria
} from "../utils/pdv";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

function getProductIcon(categoria: ProductoCategoria) {
  switch (categoria) {
    case "Sandwich":
      return "";
    case "Bebidas":
      return "";
    case "Extras":
      return "";
    default:
      return "";
  }
}

function Toast({ feedback, isAccessible, isHighContrast }: { feedback: FeedbackState | null; isAccessible: boolean; isHighContrast: boolean }) {
  if (!feedback) return null;

  const isSuccess = feedback.type === "success";
  const bgClass = isAccessible
    ? "bg-white border-4 border-slate-900 text-slate-950 shadow-lg"
    : isSuccess
      ? "bg-emerald-50 border border-emerald-300 text-emerald-950"
      : "bg-red-50 border border-red-300 text-red-950";

  return (
    <div className={`fixed bottom-6 right-6 max-w-sm rounded-2xl px-6 py-4 ${bgClass} animate-in fade-in slide-in-from-bottom-4 duration-300 z-50`}>
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
  const icon = getProductIcon(categoria);

  return (
    <article
      className={`flex h-full flex-col rounded-2xl overflow-hidden border transition ${
        isAccessible
          ? "bg-white border-2 border-slate-900"
          : "bg-white border border-slate-200 hover:shadow-md hover:border-amber-200"
      }`}
    >
      <div
        className={`h-32 flex items-end justify-center font-bold text-5xl ${
          isAccessible
            ? "bg-slate-100 border-b-2 border-slate-900"
            : "bg-gradient-to-br from-[#FFF8DC] via-[#FFFBF0] to-[#F7F7F7]"
        }`}
      >
        {icon}
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
        {cantidad > 0 && (
          <div
            className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl p-2 ${
              isAccessible ? "bg-slate-100 border-2 border-slate-900" : "bg-[#FFFBF0] border border-[#FFF4BF]"
            }`}
          >
            <button
              type="button"
              onClick={onDecrease}
              className={`py-2 rounded-lg font-bold transition ${
                isAccessible
                  ? "bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-100"
                  : "bg-white border border-slate-300 text-slate-900 hover:bg-slate-100"
              }`}
              aria-label={`Disminuir ${producto.nombre}`}
            >
              −
            </button>

            <div className={`text-center font-black ${isAccessible ? "text-2xl" : "text-xl"}`}>{cantidad}</div>

            <button
              type="button"
              onClick={onIncrease}
              className={`py-2 rounded-lg font-bold text-white transition ${
                isAccessible
                  ? "bg-slate-900 border-2 border-slate-900 hover:bg-black"
                  : "bg-slate-600 border border-slate-500 hover:bg-slate-700"
              }`}
              aria-label={`Aumentar ${producto.nombre}`}
            >
              +
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onAdd}
          className={`w-full rounded-xl font-bold transition py-3 ${
            isAccessible
              ? "bg-slate-900 text-white border-2 border-slate-900 hover:bg-black min-h-[56px] text-lg"
              : "bg-slate-600 text-white border border-slate-500 hover:bg-slate-700 min-h-[48px]"
          }`}
          aria-label={`Agregar ${producto.nombre}`}
        >
          {cantidad > 0 ? "Agregar más" : "Agregar"}
        </button>
      </div>
    </article>
  );
}

function PdvPage() {
  const { isAccessible, isHighContrast, isVoiceEnabled, isSoundEnabled } = useAccessibilityContext();
  const { speak } = useVoice({ enabled: isVoiceEnabled });

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FiltroCategoria>("Todos");

    const [searchTerm, setSearchTerm] = useState("");

  const [items, setItems] = useState<Record<number, number>>({});
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("");
  const [observacion, setObservacion] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [lastPedidoNumero, setLastPedidoNumero] = useState<number | null>(null);

  const feedbackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoadingProductos(true);
    setLoadingError(null);

    getProductos()
      .then((list) => {
        if (isMounted) {
          setProductos(list || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadingError("No fue posible cargar productos");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingProductos(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (feedback && feedbackRef.current) {
      feedbackRef.current.focus();
    }
  }, [feedback]);

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

  const productosConCategoria = useMemo(() => {
    return productos.map((producto) => ({
      ...producto,
      categoria: detectCategoria(producto)
    }));
  }, [productos]);

  const productosFiltrados = useMemo(() => {
      let filtrados = productosConCategoria;

      // Filtrar por categoría
      if (selectedCategory !== "Todos") {
        if (selectedCategory === "Destacados") {
          const destacados = filtrados.filter((producto) => (items[producto.id] || 0) > 0);
          filtrados = destacados.length > 0 ? destacados : productosConCategoria.slice(0, 4);
        } else {
          filtrados = filtrados.filter((producto) => producto.categoria === selectedCategory);
        }
      }

      // Filtrar por búsqueda
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        filtrados = filtrados.filter((producto) => 
          producto.nombre.toLowerCase().includes(search) ||
          (producto.descripcion && producto.descripcion.toLowerCase().includes(search))
        );
      }

      return filtrados;

    }, [items, productosConCategoria, selectedCategory, searchTerm]);
  const { detalles: pedidoDetalles, total, cantidad: totalItems } = useMemo(() => {
    return buildPedidoSummary(items, productos);
  }, [items, productos]);

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

  const addProduct = (producto: Producto) => {
    const nextQuantity = (items[producto.id] || 0) + 1;
    setItemQuantity(producto, nextQuantity);
    setFeedback({ type: "success", message: `${producto.nombre} agregado` });
    playTone(880, 90);
    announce("Producto agregado");
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
        setFeedback({ type: "success", message: `${producto.nombre} removido` });
        playTone(740, 90);
      }
    };

  const resetPedido = () => {
    setItems({});
    setMetodoPago("");
    setObservacion("");
    setLastPedidoNumero(null);
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
      setLastPedidoNumero(numeroPedido);
      setFeedback({
        type: "success",
        message: numeroPedido ? `Pedido #${numeroPedido} registrado` : "Pedido registrado"
      });
      setItems({});
      setMetodoPago("");
      setObservacion("");
      playTone(990, 170);
      announce("Pedido registrado correctamente");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al registrar pedido";
      setFeedback({ type: "error", message: message || "Error al registrar" });
      playTone(220, 160);
      announce("Error al registrar pedido");
    } finally {
      setSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const bgWrapper = isAccessible ? "bg-white" : "bg-[#F7F7F7]";
  const textColor = isAccessible ? "text-slate-950" : "text-[#1F2937]";
  const cardBorder = isAccessible ? "border-2 border-slate-900" : "border border-slate-200";
  const headerBg = isAccessible ? "bg-slate-900 text-white" : "bg-[#FECE00] text-[#1F2937]";
  const panelBg = isAccessible ? "bg-white" : "bg-[#F7F7F7]";

  return (
    <main className={`min-h-screen ${bgWrapper} ${textColor}`}>
      <div className={`${headerBg} shadow-md print:hidden`}>
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${isAccessible ? "py-5" : "py-3"}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className={`font-black tracking-tight ${isAccessible ? "text-2xl" : "text-xl"}`}>
                🍽 Riquísimo - Punto de Venta
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
                  setLoadingProductos(true);
                  getProductos()
                    .then((list) => setProductos(list || []))
                    .catch(() => setLoadingError("No fue posible cargar productos"))
                    .finally(() => setLoadingProductos(false));
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

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <section className={`rounded-2xl ${cardBorder} p-6 ${panelBg} print:hidden`}>
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
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

          <aside className={`rounded-2xl ${cardBorder} p-6 ${panelBg} h-fit sticky top-6 print:static print:p-0 print:border-0 print:rounded-none print:bg-transparent`}>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className={`font-black ${isAccessible ? "text-2xl" : "text-lg"}`}>Resumen del pedido</h2>
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
                {([
                  { value: "efectivo", label: "Efectivo", icon: "💵" },
                  { value: "tarjeta", label: "Tarjeta", icon: "💳" },
                  { value: "transferencia", label: "Transferencia", icon: "↔️" }
                ] as const).map((option) => {
                  const active = metodoPago === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMetodoPago(option.value)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-lg py-3 font-bold transition ${
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

            <div className="flex gap-2 mb-4 print:hidden">
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

            <div className="hidden print:block border-t border-slate-900 pt-4 space-y-3 text-sm">
              <h3 className="text-xl font-black">Comanda Riquísimo</h3>
              <div className="space-y-2 border-b border-dashed border-slate-400 pb-3">
                {pedidoDetalles.map((item) => (
                  <div key={item.productoId} className="flex justify-between gap-2 text-xs">
                    <span>{item.cantidad}x {item.producto.nombre}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold border-t border-slate-900 pt-2">
                <span>TOTAL:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="text-xs space-y-1 pt-2 border-t border-slate-900">
                <p><strong>Método:</strong> {getPaymentLabel(metodoPago)}</p>
                {observacion && <p><strong>Obs:</strong> {observacion}</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {feedback && (
        <div ref={feedbackRef} tabIndex={-1} role={feedback.type === "success" ? "status" : "alert"} aria-live="polite">
          <Toast feedback={feedback} isAccessible={isAccessible} isHighContrast={isHighContrast} />
        </div>
      )}
    </main>
  );
}

export default PdvPage;
