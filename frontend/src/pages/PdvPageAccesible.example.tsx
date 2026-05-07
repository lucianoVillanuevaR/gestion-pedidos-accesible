/**
 * EJEMPLO DE INTEGRACIÓN: PdvPage Mejorada
 * 
 * Este archivo muestra cómo integrar todos los componentes accesibles
 * en la página principal de PDV con DOS experiencias visuales claramente diferenciadas.
 * 
 * CARACTERÍSTICAS:
 * - Interfaz adaptable según modo
 * - Navegación completa por teclado
 * - Voz integrada
 * - Alto contraste opcional
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import { createPedido } from "../services/pedidos";
import { getProductos } from "../services/productos";
import useVoice from "../hooks/useVoice";
import AccessibleProductCard from "../components/AccessibleProductCard";
import AccessibleButton from "../components/AccessibleButton";
import AccessibleCard from "../components/AccessibleCard";
import AccessibleFeedback from "../components/AccessibleFeedback";
import type { CreatePedidoPayload, MetodoPago, PedidoResponse, Producto } from "../types";
import {
  FILTROS,
  buildPedidoSummary,
  detectCategoria,
  formatCurrency,
  type FiltroCategoria,
  type ProductoCategoria
} from "../utils/pdv";

// Tipos locales
type FeedbackState = {
  type: "success" | "error";
  message: string;
};

/**
 * Página principal con layout completamente adaptable
 */
export default function PdvPageAccesible() {
  const { isAccessible, isHighContrast, isVoiceEnabled, prefersReducedMotion } =
    useAccessibilityContext();
  const { speak } = useVoice({ enabled: isVoiceEnabled });

  // Estados
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroActual, setFiltroActual] = useState<FiltroCategoria>("Todos");
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [observacion, setObservacion] = useState("");
  const [creandoPedido, setCreandoPedido] = useState(false);
  const productsGridRef = useRef<HTMLDivElement>(null);

  // Cargar productos
  useEffect(() => {
    const loadProductos = async () => {
      try {
        const data = await getProductos();
        setProductos(data);
        if (isVoiceEnabled) {
          speak(`Sistema listo. ${data.length} productos disponibles.`);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
        setFeedback({
          type: "error",
          message: "Error al cargar productos"
        });
      } finally {
        setLoading(false);
      }
    };

    loadProductos();
  }, [isVoiceEnabled, speak]);

  // Obtener icono de categoría
  const getCategoryIcon = (categoria: ProductoCategoria) => {
    const icons: Record<ProductoCategoria, string> = {
      Sandwich: "🍔",
      Bebidas: "🥤",
      Extras: "🍟",
      Otros: "📦"
    };
    return icons[categoria];
  };

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      if (filtroActual === "Todos") return true;
      if (filtroActual === "Destacados") return p.destacado;
      return detectCategoria(p) === filtroActual;
    });
  }, [productos, filtroActual]);

  // Calcular totales
  const { total, cantidad } = useMemo(() => {
    return buildPedidoSummary(cantidades, productos);
  }, [cantidades, productos]);

  // Funciones de manejo
  const handleIncrease = (id: number) => {
    setCantidades(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const handleDecrease = (id: number) => {
    setCantidades(prev => {
      const newVal = (prev[id] || 1) - 1;
      if (newVal <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newVal };
    });
  };

  const handleAdd = (id: number) => {
    handleIncrease(id);
    const producto = productos.find(p => p.id === id);
    if (producto) {
      setFeedback({
        type: "success",
        message: `${producto.nombre} agregado`
      });
      speak(`${producto.nombre} agregado al pedido`);
    }
  };

  // Crear pedido
  const handleCrearPedido = async () => {
    if (cantidad === 0) {
      setFeedback({
        type: "error",
        message: "Selecciona al menos un producto"
      });
      speak("Selecciona al menos un producto");
      return;
    }

    setCreandoPedido(true);
    try {
      const detalles: CreatePedidoPayload["detalles"] = Object.entries(
        cantidades
      )
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({
          productoId: parseInt(id),
          cantidad: q
        }));

      const payload: CreatePedidoPayload = {
        detalles,
        metodoPago,
        observacion: observacion || undefined
      };

      const result = (await createPedido(payload)) as PedidoResponse;

      setFeedback({
        type: "success",
        message: `Pedido #${result.id} registrado con éxito`
      });

      speak(`Pedido número ${result.id} registrado exitosamente`);

      // Limpiar
      setCantidades({});
      setObservacion("");
      setMetodoPago("efectivo");

      // Scroll al top
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error creando pedido:", error);
      setFeedback({
        type: "error",
        message: "Error al registrar pedido"
      });
      speak("Error al registrar el pedido");
    } finally {
      setCreandoPedido(false);
    }
  };

  // Clases dinámicas
  const pageClass = isAccessible
    ? "bg-white min-h-screen"
    : "bg-amber-50 min-h-screen";

  const containerPaddingClass = isAccessible ? "px-6 py-8" : "px-4 py-6";

  const titleClass = isAccessible ? "text-4xl" : "text-3xl";
  const sectionTitleClass = isAccessible ? "text-3xl" : "text-2xl";

  if (loading) {
    return (
      <div
        className={`${pageClass} flex items-center justify-center min-h-screen`}
      >
        <div className="text-center">
          <div
            className={`animate-spin text-6xl mb-4 ${
              prefersReducedMotion ? "animation-none" : ""
            }`}
          >
            ⏳
          </div>
          <p className={isAccessible ? "text-2xl" : "text-lg"}>
            Cargando productos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <header
        className={`
          ${isAccessible
            ? "border-b-4 border-slate-900 bg-slate-900 text-white"
            : "border-b-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50"
          }
          ${containerPaddingClass}
        `}
      >
        <h1
          className={`font-black text-slate-900 mb-2 ${titleClass} ${
            isAccessible ? "text-white" : ""
          }`}
        >
          {isAccessible ? "🍽️ SISTEMA DE PEDIDOS" : "Sistema de Pedidos"}
        </h1>
        <p
          className={`${
            isAccessible
              ? "text-lg text-slate-100"
              : "text-base text-slate-600"
          }`}
        >
          {isAccessible
            ? "Elige productos y crea tu pedido"
            : "Selecciona productos y procesa tu pedido"}
        </p>
      </header>

      <main className={`max-w-7xl mx-auto ${containerPaddingClass}`}>
        {/* Filtros */}
        <section className={isAccessible ? "mb-8" : "mb-6"}>
          <h2 className={`font-bold text-slate-900 mb-4 ${sectionTitleClass}`}>
            {isAccessible ? "🔍 CATEGORÍAS" : "Filtrar por categoría"}
          </h2>

          <div
            className={`
              grid gap-3
              ${isAccessible
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5"
              }
            `}
          >
            {FILTROS.map(filtro => (
              <button
                key={filtro.value}
                onClick={() => {
                  setFiltroActual(filtro.value);
                  speak(`Mostrando ${filtro.label}`);
                  // Scroll a productos
                  productsGridRef.current?.scrollIntoView({
                    behavior: "smooth"
                  });
                }}
                aria-pressed={filtroActual === filtro.value}
                className={`
                  min-h-[56px] px-4 py-2 font-bold rounded-lg
                  border-2 transition
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-blue-500
                  ${
                    filtroActual === filtro.value
                      ? isAccessible
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-yellow-400 text-slate-900 border-yellow-500"
                      : isAccessible
                        ? "bg-white text-slate-900 border-slate-300 hover:border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:border-yellow-400"
                  }
                `}
              >
                {isAccessible && filtro.value === "Sandwich" && "🍔"}
                {isAccessible && filtro.value === "Bebidas" && "🥤"}
                {isAccessible && filtro.value === "Extras" && "🍟"}
                {isAccessible && filtro.value === "Destacados" && "⭐"}
                {isAccessible && filtro.value === "Todos" && "📋"}
                {filtro.label}
              </button>
            ))}
          </div>
        </section>

        <section className={isAccessible ? "mb-8" : "mb-6"}>
          <h2 className={`font-bold text-slate-900 mb-4 ${sectionTitleClass}`}>
            {isAccessible ? "🍔 NUESTROS PRODUCTOS" : "Productos disponibles"}
          </h2>

          <div
            ref={productsGridRef}
            className="product-grid"
          >
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map(producto => (
                <AccessibleProductCard
                  key={producto.id}
                  id={producto.id}
                  nombre={producto.nombre}
                  precio={producto.precio}
                  descripcion={producto.descripcion}
                  imagen={producto.imagen}
                  altText={
                    producto.altText || `${producto.nombre} - Producto de comida`
                  }
                  categoria={detectCategoria(producto)}
                  categoryIcon={getCategoryIcon(detectCategoria(producto))}
                  cantidad={cantidades[producto.id] || 0}
                  onIncrease={() => handleIncrease(producto.id)}
                  onDecrease={() => handleDecrease(producto.id)}
                  onAdd={() => handleAdd(producto.id)}
                />
              ))
            ) : (
              <AccessibleCard
                title="Sin productos"
                subtitle="No hay productos en esta categoría"
                variant="warning"
              />
            )}
          </div>
        </section>

        {/* Resumen de Pedido */}
        {cantidad > 0 && (
          <section className={isAccessible ? "mb-8" : "mb-6"}>
            <h2 className={`font-bold text-slate-900 mb-4 ${sectionTitleClass}`}>
              {isAccessible ? "📋 TU PEDIDO" : "Resumen de pedido"}
            </h2>

            <div
              className={`
                grid gap-4
                ${isAccessible ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-3"}
              `}
            >
              {/* Cantidad */}
              <AccessibleCard
                title={`${cantidad} producto${cantidad !== 1 ? "s" : ""}`}
                variant="highlighted"
              >
                <p
                  className={isAccessible ? "text-2xl font-bold" : "text-lg"}
                >
                  {isAccessible ? "CANTIDAD EN EL PEDIDO" : ""}
                </p>
              </AccessibleCard>

              {/* Total */}
              <AccessibleCard
                title={formatCurrency(total)}
                variant="highlighted"
              >
                <p
                  className={isAccessible ? "text-2xl font-bold" : "text-lg"}
                >
                  {isAccessible ? "TOTAL" : ""}
                </p>
              </AccessibleCard>

              {/* Método de pago */}
              <AccessibleCard>
                <label
                  className={`
                    block font-bold mb-3
                    ${isAccessible ? "text-xl" : "text-base"}
                  `}
                >
                  {isAccessible ? "💳 MÉTODO DE PAGO" : "Método de pago"}
                </label>
                <select
                  value={metodoPago}
                  onChange={e => {
                    setMetodoPago(e.target.value as MetodoPago);
                    speak(`Método de pago: ${e.target.value}`);
                  }}
                  className={`
                    w-full px-3 py-2 rounded-lg border-2 font-bold
                    ${isAccessible
                      ? "text-lg border-slate-900 p-3"
                      : "border-slate-300"
                    }
                    focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-blue-500
                  `}
                >
                  <option value="efectivo">
                    💰 {isAccessible ? "EFECTIVO" : "Efectivo"}
                  </option>
                  <option value="tarjeta">
                    💳 {isAccessible ? "TARJETA" : "Tarjeta"}
                  </option>
                  <option value="transferencia">
                    🏦 {isAccessible ? "TRANSFERENCIA" : "Transferencia"}
                  </option>
                </select>
              </AccessibleCard>
            </div>

            {/* Observaciones */}
            <div className={isAccessible ? "mt-6" : "mt-4"}>
              <label
                className={`
                  block font-bold mb-3
                  ${isAccessible ? "text-xl" : "text-base"}
                `}
              >
                {isAccessible ? "📝 NOTAS ESPECIALES (OPCIONAL)" : "Observaciones"}
              </label>
              <textarea
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
                placeholder={
                  isAccessible
                    ? "Ej: Sin cebolla, extra mayonesa, etc."
                    : "Notas especiales..."
                }
                className={`
                  w-full px-4 py-3 rounded-lg border-2 font-bold
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-blue-500
                  ${isAccessible
                    ? "text-lg border-slate-900 p-4 min-h-[120px]"
                    : "border-slate-300 min-h-[90px]"
                  }
                `}
              />
            </div>

            {/* Botón Registrar */}
            <div className={isAccessible ? "mt-8" : "mt-6"}>
              <AccessibleButton
                variant="primary"
                size={isAccessible ? "large" : "medium"}
                fullWidth
                isLoading={creandoPedido}
                onClick={handleCrearPedido}
                ariaLabel="Registrar pedido"
              >
                {isAccessible ? "✅ REGISTRAR PEDIDO" : "Registrar pedido"}
              </AccessibleButton>
            </div>
          </section>
        )}
      </main>

      {feedback && (
        <AccessibleFeedback
          {...feedback}
          visible={Boolean(feedback)}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
