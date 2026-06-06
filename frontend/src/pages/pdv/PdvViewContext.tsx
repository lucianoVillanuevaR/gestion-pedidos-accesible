import { createContext, useContext, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { MetodoPago, Producto } from "../../types";
import type { FiltroCategoria } from "../../utils/pdv";
import type { FeedbackState } from "./PdvShared";

export type PedidoDetalleItem = {
  productoId: number;
  cantidad: number;
  producto: Producto;
  subtotal: number;
};

export type PdvViewContextValue = {
  accessibleObservationPlaceholder: string;
  accessibleObservationType: "cocina" | "cliente";
  accessibleProductos: Producto[];
  accessibleStep: number;
  addProduct: (producto: Producto) => void;
  bgWrapper: string;
  cardBorder: string;
  decreaseProduct: (producto: Producto) => void;
  feedback: FeedbackState | null;
  feedbackRef: RefObject<HTMLDivElement>;
  goNextAccessibleStep: () => void;
  goPrevAccessibleStep: () => void;
  handlePrint: () => void;
  handleReadPedidoSummary: () => void;
  handleSubmit: () => void;
  increaseProduct: (producto: Producto) => void;
  isAccessible: boolean;
  isHighContrast: boolean;
  isPanelOpen: boolean;
  items: Record<number, number>;
  loadingError: string | null;
  loadingProductos: boolean;
  loadProductos: () => void;
  metodoPago: MetodoPago | "";
  navigate: NavigateFunction;
  observacion: string;
  openAccessibilityPanel: () => void;
  openResetConfirm: () => void;
  panelBg: string;
  pedidoDetalles: PedidoDetalleItem[];
  puedeRegistrar: boolean;
  quickActionButtonClass: string;
  quickActionIconButtonClass: string;
  removeProduct: (productoId: number) => void;
  resetPedido: () => void;
  searchTerm: string;
  selectedCategory: FiltroCategoria;
  selectMetodoPago: (value: MetodoPago) => void;
  sending: boolean;
  setAccessibleObservationType: Dispatch<SetStateAction<"cocina" | "cliente">>;
  setAccessibleStep: Dispatch<SetStateAction<number>>;
  setLoadingError: (value: string | null) => void;
  setObservacion: Dispatch<SetStateAction<string>>;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  setSelectedCategory: Dispatch<SetStateAction<FiltroCategoria>>;
  setShowResetConfirm: Dispatch<SetStateAction<boolean>>;
  showResetConfirm: boolean;
  textColor: string;
  total: number;
  productosFiltrados: Producto[];
};

const PdvViewContext = createContext<PdvViewContextValue | null>(null);

export const PdvViewProvider = PdvViewContext.Provider;

export function usePdvViewContext() {
  const context = useContext(PdvViewContext);

  if (!context) {
    throw new Error("usePdvViewContext must be used within PdvViewProvider");
  }

  return context;
}
