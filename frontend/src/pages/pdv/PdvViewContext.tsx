import { createContext, useContext, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { MetodoPago, PersonalizacionProducto, Producto, VarianteProducto } from "../../types";
import type { FiltroCategoria } from "../../utils/pdv";
import type { FeedbackState } from "./PdvShared";

type PedidoDetalleItem = {
  itemKey: string;
  productoId: number;
  cantidad: number;
  producto: Producto;
  subtotal: number;
  variante?: VarianteProducto;
  personalizacion?: PersonalizacionProducto;
};

export type PdvViewContextValue = {
  accessibleObservationPlaceholder: string;
  accessibleObservationType: "cocina" | "cliente";
  accessibleProductos: Producto[];
  accessibleStep: number;
  accessibleStepValidation: string | null;
  addProduct: (producto: Producto) => void;
  announceSearchBar: () => void;
  bgWrapper: string;
  cardBorder: string;
  categoryFilters: Array<{ label: string; value: FiltroCategoria }>;
  clienteNombre: string;
  decreaseProduct: (producto: Producto) => void;
  feedback: FeedbackState | null;
  feedbackRef: RefObject<HTMLDivElement>;
  goNextAccessibleStep: () => void;
  goPrevAccessibleStep: () => void;
  handlePrint: () => void;
  handleReadPedidoSummary: () => void;
  handleSubmit: () => void;
  handleToggleTurno: () => void;
  increaseProduct: (producto: Producto) => void;
  isAccessible: boolean;
  isHighContrast: boolean;
  isPanelOpen: boolean;
  isTurnoOpen: boolean;
  items: Record<string, number>;
  loadingError: string | null;
  loadingProductos: boolean;
  loadProductos: () => void;
  metodoPago: MetodoPago | "";
  navigate: NavigateFunction;
  nextPedidoNumber: number;
  observacion: string;
  openAccessibilityPanel: () => void;
  openResetConfirm: () => void;
  panelBg: string;
  pedidoDetalles: PedidoDetalleItem[];
  puedeRegistrar: boolean;
  quickActionButtonClass: string;
  quickActionIconButtonClass: string;
  removeProduct: (itemKey: string) => void;
  resetPedido: () => void;
  searchTerm: string;
  selectedCategory: FiltroCategoria;
  selectCategory: (value: FiltroCategoria, label?: string) => void;
  selectMetodoPago: (value: MetodoPago) => void;
  sending: boolean;
  setAccessibleObservationType: Dispatch<SetStateAction<"cocina" | "cliente">>;
  setAccessibleStep: Dispatch<SetStateAction<number>>;
  setClienteNombre: Dispatch<SetStateAction<string>>;
  setLoadingError: (value: string | null) => void;
  setObservacion: Dispatch<SetStateAction<string>>;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  setSelectedCategory: Dispatch<SetStateAction<FiltroCategoria>>;
  setShowResetConfirm: Dispatch<SetStateAction<boolean>>;
  showResetConfirm: boolean;
  textColor: string;
  total: number;
  totalItems: number;
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
