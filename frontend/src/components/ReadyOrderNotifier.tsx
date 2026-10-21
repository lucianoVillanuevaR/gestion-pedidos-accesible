import { BellRing, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FocusEvent, type MouseEvent } from "react";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import { useAuthContext } from "../contexts/AuthContext";
import { useSoundFeedback } from "../hooks/useSoundFeedback";
import { getPedidos } from "../services/pedidos";
import type { EstadoPedido, PedidoResponse } from "../types";
import { getPedidoDisplayNumber, withPedidoNumerosTurno } from "../pages/pedidos/PedidosShared";

export const READY_ORDER_POLL_MS = 3000;
export const READY_ORDER_VISIBLE_MS = 15000;

export function findNewlyReadyOrders(previousStates: Map<number, EstadoPedido>, pedidos: PedidoResponse[]) {
  return pedidos.filter(
    (pedido) => previousStates.has(pedido.id) && previousStates.get(pedido.id) !== "listo" && pedido.estado === "listo"
  );
}

function ReadyOrderToast({
  isHighContrast,
  onDismiss,
  pedido
}: {
  isHighContrast: boolean;
  onDismiss: (id: number) => void;
  pedido: PedidoResponse;
}) {
  const timerRef = useRef<number>();
  const startedAtRef = useRef(0);
  const remainingMsRef = useRef(READY_ORDER_VISIBLE_MS);
  const pauseReasonsRef = useRef(new Set<"focus" | "pointer">());
  const displayNumber = getPedidoDisplayNumber(pedido);

  const stopTimer = useCallback(() => {
    if (timerRef.current === undefined) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    remainingMsRef.current = Math.max(0, remainingMsRef.current - (Date.now() - startedAtRef.current));
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current !== undefined || pauseReasonsRef.current.size > 0) return;
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(() => onDismiss(pedido.id), remainingMsRef.current);
  }, [onDismiss, pedido.id]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  const pause = (reason: "focus" | "pointer") => {
    pauseReasonsRef.current.add(reason);
    stopTimer();
  };

  const resume = (reason: "focus" | "pointer") => {
    pauseReasonsRef.current.delete(reason);
    startTimer();
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    resume("focus");
  };

  const handleManualDismiss = (event: MouseEvent<HTMLButtonElement>) => {
    const restoreSafeFocus = event.currentTarget === document.activeElement;
    onDismiss(pedido.id);
    if (restoreSafeFocus) {
      window.requestAnimationFrame(() => document.getElementById("main-content")?.focus());
    }
  };

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-xl border-2 p-4 shadow-xl ${
        isHighContrast ? "contrast-panel border-yellow-400" : "border-emerald-700 bg-emerald-50 text-emerald-950"
      }`}
      onBlurCapture={handleBlur}
      onFocusCapture={() => pause("focus")}
      onMouseEnter={() => pause("pointer")}
      onMouseLeave={() => resume("pointer")}
      role="status"
    >
      <BellRing className="h-6 w-6 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 font-black">Pedido N.º {displayNumber} listo para entregar</p>
      <button
        type="button"
        aria-label={`Cerrar aviso del pedido ${displayNumber}`}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border-2"
        onClick={handleManualDismiss}
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function ReadyOrderNotifier() {
  const { user } = useAuthContext();
  const { isHighContrast, isSoundEnabled, soundVolume } = useAccessibilityContext();
  const soundFeedback = useSoundFeedback(isSoundEnabled, soundVolume);
  const soundRef = useRef(soundFeedback.orderReady);
  const soundEnabledRef = useRef(isSoundEnabled);
  const [readyOrders, setReadyOrders] = useState<PedidoResponse[]>([]);
  const [audioBlocked, setAudioBlocked] = useState(false);

  useEffect(() => {
    soundRef.current = soundFeedback.orderReady;
    soundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled, soundFeedback.orderReady]);

  const dismiss = useCallback((id: number) => {
    setReadyOrders((current) => current.filter((pedido) => pedido.id !== id));
  }, []);

  useEffect(() => {
    if (user?.role !== "cajero") {
      return;
    }

    let active = true;
    let inFlight = false;
    let initialized = false;
    let previousStates = new Map<number, EstadoPedido>();
    const controller = new AbortController();

    const poll = async () => {
      if (!active || inFlight) return;
      inFlight = true;
      try {
        const pedidos = withPedidoNumerosTurno(await getPedidos(controller.signal));
        if (!active) return;

        if (initialized) {
          const newlyReady = findNewlyReadyOrders(previousStates, pedidos);
          if (newlyReady.length > 0) {
            setReadyOrders((current) => {
              const byId = new Map(current.map((pedido) => [pedido.id, pedido]));
              newlyReady.forEach((pedido) => byId.set(pedido.id, pedido));
              return [...byId.values()];
            });
            if (soundEnabledRef.current) {
              void soundRef.current().then((played) => {
                if (active && !played) setAudioBlocked(true);
              });
            }
          }
        }

        previousStates = new Map(pedidos.map((pedido) => [pedido.id, pedido.estado]));
        initialized = true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      } finally {
        inFlight = false;
      }
    };

    void poll();
    const intervalId = window.setInterval(() => void poll(), READY_ORDER_POLL_MS);
    const pollWhenVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", pollWhenVisible);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", pollWhenVisible);
    };
  }, [user?.role]);

  if (user?.role !== "cajero" || (readyOrders.length === 0 && !audioBlocked)) return null;

  return (
    <section className="fixed right-3 top-3 z-[190] grid w-[min(92vw,420px)] gap-2 no-print lg:top-16">
      {readyOrders.map((pedido) => (
        <ReadyOrderToast key={pedido.id} isHighContrast={isHighContrast} onDismiss={dismiss} pedido={pedido} />
      ))}
      {audioBlocked && (
        <p
          aria-live="polite"
          className={`rounded-xl border-2 p-3 text-sm font-bold ${isHighContrast ? "contrast-panel" : "border-amber-700 bg-amber-50 text-amber-950"}`}
          role="status"
        >
          El navegador bloqueó el sonido. Abre Accesibilidad, activa Sonidos y usa “Probar sonido”.
        </p>
      )}
    </section>
  );
}
