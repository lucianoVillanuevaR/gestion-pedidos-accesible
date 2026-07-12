import { useCallback, useEffect, useMemo, useState } from "react";
import type { MetodoPago, PersonalizacionProducto, Producto, VarianteProducto } from "../../../types";
import { buildPedidoSummary } from "../../../utils/pdv";
import { PEDIDO_MAX_CANTIDAD_DETALLE } from "../../../validations/pedido.validation";
import { usesProductConfigurator, type FeedbackState, type SoundCue } from "../PdvShared";

type Announce = (message: string, options?: Record<string, unknown>) => void;
type PlaySoundCue = (cue: SoundCue) => void;
type AccessibleObservationType = "cocina" | "cliente";

const PDV_ORDER_DRAFT_STORAGE_KEY = "riquisimo:pdv-order-draft";
const METODOS_PAGO_VALIDOS: Array<MetodoPago | ""> = ["", "efectivo", "tarjeta", "transferencia"];
const ACCESSIBLE_OBSERVATION_TYPES: AccessibleObservationType[] = ["cocina", "cliente"];

type StoredPdvOrderDraft = {
  accessibleObservationType?: AccessibleObservationType;
  clienteNombre?: string;
  items?: Record<string, number>;
  metodoPago?: MetodoPago | "";
  observacion?: string;
  personalizaciones?: Record<string, PersonalizacionProducto>;
};

function getStoredPdvOrderDraft(): StoredPdvOrderDraft {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(PDV_ORDER_DRAFT_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as StoredPdvOrderDraft;
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {};
  }
}

function hasPedidoDraftContent(draft: StoredPdvOrderDraft) {
  return Boolean(
    Object.keys(draft.items ?? {}).length ||
    Object.keys(draft.personalizaciones ?? {}).length ||
    draft.clienteNombre?.trim() ||
    draft.metodoPago ||
    draft.observacion?.trim()
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function usePdvOrderDraft({
  announce,
  isTurnoOpen,
  notifyTurnoClosed,
  playSoundCue,
  productos,
  setFeedback,
  showFeedback
}: {
  announce: Announce;
  isTurnoOpen: boolean;
  notifyTurnoClosed: () => void;
  playSoundCue: PlaySoundCue;
  productos: Producto[];
  setFeedback: (feedback: FeedbackState | null) => void;
  showFeedback: (feedback: FeedbackState) => void;
}) {
  const [storedDraft] = useState(getStoredPdvOrderDraft);
  const [items, setItems] = useState<Record<string, number>>(() =>
    isPlainRecord(storedDraft.items) ? (storedDraft.items as Record<string, number>) : {}
  );
  const [personalizaciones, setPersonalizaciones] = useState<Record<string, PersonalizacionProducto>>(() =>
    isPlainRecord(storedDraft.personalizaciones)
      ? (storedDraft.personalizaciones as Record<string, PersonalizacionProducto>)
      : {}
  );
  const [pendingVariantProduct, setPendingVariantProduct] = useState<Producto | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">(() =>
    METODOS_PAGO_VALIDOS.includes(storedDraft.metodoPago ?? "") ? (storedDraft.metodoPago ?? "") : ""
  );
  const [clienteNombre, setClienteNombre] = useState(() =>
    typeof storedDraft.clienteNombre === "string" ? storedDraft.clienteNombre : ""
  );
  const [observacion, setObservacion] = useState(() =>
    typeof storedDraft.observacion === "string" ? storedDraft.observacion : ""
  );
  const [accessibleObservationType, setAccessibleObservationType] = useState<AccessibleObservationType>(() =>
    ACCESSIBLE_OBSERVATION_TYPES.includes(storedDraft.accessibleObservationType ?? "cocina")
      ? (storedDraft.accessibleObservationType ?? "cocina")
      : "cocina"
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    detalles: pedidoDetalles,
    total,
    cantidad: totalItems
  } = useMemo(() => {
    return buildPedidoSummary(items, productos, personalizaciones);
  }, [items, personalizaciones, productos]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const draft: StoredPdvOrderDraft = {
      accessibleObservationType,
      clienteNombre,
      items,
      metodoPago,
      observacion,
      personalizaciones
    };

    if (!hasPedidoDraftContent(draft)) {
      window.localStorage.removeItem(PDV_ORDER_DRAFT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(PDV_ORDER_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [accessibleObservationType, clienteNombre, items, metodoPago, observacion, personalizaciones]);

  const setItemQuantity = useCallback(
    (producto: Producto, nextQuantity: number) => {
      if (!isTurnoOpen) {
        notifyTurnoClosed();
        return;
      }

      if (nextQuantity > PEDIDO_MAX_CANTIDAD_DETALLE) {
        const message = `La cantidad máxima por producto es ${PEDIDO_MAX_CANTIDAD_DETALLE}.`;
        showFeedback({
          type: "error",
          title: "Cantidad máxima alcanzada",
          message
        });
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
    [announce, isTurnoOpen, notifyTurnoClosed, playSoundCue, showFeedback]
  );

  const clearPedidoForm = useCallback(() => {
    setItems({});
    setPersonalizaciones({});
    setPendingVariantProduct(null);
    setMetodoPago("");
    setClienteNombre("");
    setObservacion("");
    setAccessibleObservationType("cocina");
  }, []);

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
        showFeedback({
          type: "error",
          title: "Cantidad máxima alcanzada",
          message
        });
        playSoundCue("error");
        return;
      }

      setItems((currentItems) => ({
        ...currentItems,
        [itemKey]: (currentItems[itemKey] || 0) + cantidadAgregar
      }));
      setPersonalizaciones((current) => ({ ...current, [itemKey]: personalizacion }));
      playSoundCue("add");
      announce(`${producto.nombre}${variante ? `, ${variante.nombre}` : ""} agregado. Cantidad ${nextQuantity}.`, {
        priority: "normal",
        dedupeKey: `product-added:${producto.id}:${nextQuantity}`,
        cooldownMs: 1800
      });
    },
    [announce, isTurnoOpen, items, notifyTurnoClosed, playSoundCue, showFeedback]
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

  const selectPendingVariant = useCallback(
    (variante: VarianteProducto | undefined, cantidad: number, personalizacion: PersonalizacionProducto) => {
      if (!pendingVariantProduct) {
        return;
      }

      const producto = pendingVariantProduct;
      setPendingVariantProduct(null);
      commitAddProduct(producto, variante, cantidad, personalizacion);
    },
    [commitAddProduct, pendingVariantProduct]
  );

  const increaseProduct = useCallback(
    (producto: Producto) => {
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
    },
    [announce, isTurnoOpen, items, notifyTurnoClosed, playSoundCue, setItemQuantity]
  );

  const decreaseProduct = useCallback(
    (producto: Producto) => {
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
    },
    [announce, isTurnoOpen, items, notifyTurnoClosed, playSoundCue, setItemQuantity]
  );

  const removeProduct = useCallback(
    (itemKey: string) => {
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
      announce("Producto eliminado del pedido.", {
        priority: "normal",
        dedupeKey: "product-removed",
        cooldownMs: 1500
      });
    },
    [announce, playSoundCue]
  );

  const resetPedido = useCallback(() => {
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
  }, [announce, clearPedidoForm, playSoundCue, setFeedback]);

  const openResetConfirm = useCallback(() => {
    setShowResetConfirm(true);
    announce("¿Seguro que quieres borrar?", {
      priority: "high",
      dedupeKey: "confirm-reset",
      cooldownMs: 1800,
      interrupt: true
    });
  }, [announce]);

  const selectMetodoPago = useCallback(
    (value: MetodoPago) => {
      setMetodoPago(value);

      const voiceMessage =
        value === "efectivo" ? "Pago en efectivo" : value === "tarjeta" ? "Pago con tarjeta" : "Pago por transferencia";

      announce(voiceMessage, {
        priority: "normal",
        dedupeKey: `payment-${value}`,
        cooldownMs: 1400
      });
    },
    [announce]
  );

  return {
    accessibleObservationType,
    addProduct,
    clearPedidoForm,
    clienteNombre,
    decreaseProduct,
    increaseProduct,
    items,
    metodoPago,
    observacion,
    openResetConfirm,
    pedidoDetalles,
    pendingVariantProduct,
    removeProduct,
    resetPedido,
    selectMetodoPago,
    selectPendingVariant,
    setAccessibleObservationType,
    setClienteNombre,
    setObservacion,
    setPendingVariantProduct,
    setShowResetConfirm,
    showResetConfirm,
    total,
    totalItems
  };
}
