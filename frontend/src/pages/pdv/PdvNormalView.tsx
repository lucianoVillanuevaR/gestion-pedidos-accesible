import { CalendarDays, Check, Info, LockKeyhole, Printer, Search, Trash2, UnlockKeyhole, User, Volume2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import type { Producto } from "../../types";
import { PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH } from "../../validations/pedido.validation";
import { FILTROS, formatCurrency, getPaymentLabel } from "../../utils/pdv";
import { FOCUS_VISIBLE_CLASS } from "../pedidos/PedidosShared";
import { PAYMENT_OPTIONS, Toast } from "./PdvShared";
import { usePdvViewContext } from "./PdvViewContext";

function PdvNormalView() {
  const { user } = useAuthContext();
  const [showOpenTurnoConfirm, setShowOpenTurnoConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const {
    addProduct,
    decreaseProduct,
    feedback,
    feedbackRef,
    handlePrint,
    handleReadPedidoSummary,
    handleSubmit,
    handleToggleTurno,
    increaseProduct,
    isHighContrast,
    isTurnoOpen,
    items,
    clienteNombre,
    loadingError,
    loadingProductos,
    metodoPago,
    openResetConfirm,
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
    setSearchTerm,
    setSelectedCategory,
    setClienteNombre,
    setShowResetConfirm,
    showResetConfirm,
    total
  } = usePdvViewContext();

  const selectedCategoryLabel = FILTROS.find((filtro) => filtro.value === selectedCategory)?.label ?? "Productos";
  const orderDate = new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
  const fullDate = new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date());
  const canPrint = isTurnoOpen && pedidoDetalles.length > 0;

  const handleTurnoButtonClick = () => {
    if (isTurnoOpen) {
      handleToggleTurno();
      return;
    }

    setShowOpenTurnoConfirm(true);
  };

  const handleConfirmOpenTurno = () => {
    setShowOpenTurnoConfirm(false);
    handleToggleTurno();
  };

  const handleAcceptClick = () => {
    if (!puedeRegistrar) {
      return;
    }

    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitConfirm(false);
    handleSubmit();
  };

  return (
    <div className="grid h-[calc(100dvh-48px)] min-h-0 overflow-hidden bg-slate-100 print:block md:grid-cols-[162px_minmax(0,1fr)] xl:grid-cols-[162px_minmax(0,1fr)_400px] 2xl:grid-cols-[162px_minmax(0,1fr)_430px]">
      <nav className="hidden min-h-0 border-r border-slate-200 bg-slate-50 print:hidden md:block" aria-label="Categorías de productos">
        <div className="sticky top-0">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black uppercase text-slate-950">
            Categorías
          </div>
          <div className="divide-y divide-slate-200">
            {FILTROS.map((filtro) => (
              <button
                key={filtro.value}
                type="button"
                onClick={() => setSelectedCategory(filtro.value)}
                className={`flex min-h-[44px] w-full items-center justify-between px-3 text-left text-sm font-bold uppercase transition ${
                  selectedCategory === filtro.value
                    ? "bg-amber-50 text-slate-950"
                    : "bg-slate-50 text-slate-800 hover:bg-white"
                } ${isHighContrast ? "contrast-button-secondary" : ""}`}
                aria-current={selectedCategory === filtro.value ? "page" : undefined}
              >
                <span className="truncate">{filtro.label}</span>
                {selectedCategory === filtro.value && <span className="text-lg leading-none">›</span>}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <section className="flex min-h-0 min-w-0 flex-col bg-slate-100 print:hidden no-print">
        <div className="shrink-0 border-b border-slate-200 bg-slate-100 px-3 py-1.5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="searchProducto" className="relative block w-full sm:max-w-[250px]">
                <span className="sr-only">Buscar producto</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700" aria-hidden="true" />
                <input
                  id="searchProducto"
                  type="text"
                  placeholder="Buscar producto"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 contrast-input"
                />
              </label>
            </div>
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {FILTROS.map((filtro) => (
              <button
                key={filtro.value}
                type="button"
                onClick={() => setSelectedCategory(filtro.value)}
                className={`h-9 shrink-0 rounded-full border px-3 text-xs font-black uppercase ${
                  selectedCategory === filtro.value
                    ? "border-[#FECE00] bg-[#FECE00] text-slate-950"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {filtro.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <h2 className="mb-2 text-xl font-black uppercase text-slate-800">{selectedCategoryLabel}</h2>
          {!loadingProductos && productosFiltrados.length === 0 && !loadingError ? (
            <div className="rounded-md border-2 border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-bold text-base">No hay productos en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-7">
              {productosFiltrados.map((producto) => (
                <PdvProductTile
                  key={producto.id}
                  producto={producto}
                  cantidad={items[producto.id] || 0}
                  disabled={!isTurnoOpen}
                  onIncrease={() => increaseProduct(producto)}
                  onDecrease={() => decreaseProduct(producto)}
                  onAdd={() => addProduct(producto)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white print:static print:block print:min-h-0 print:border-0 print:bg-transparent">
        <div className="bg-[#FECE00] text-slate-950 no-print print:hidden">
          <div className="flex min-h-[42px] items-center justify-between gap-2 px-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-2xl font-light leading-none">#1</span>
              <span className="rounded-full border border-white/70 px-2 py-0.5 text-xs font-bold">En el local</span>
              <span className="text-sm font-bold">{getPaymentLabel(metodoPago)}</span>
            </div>
            <button
              type="button"
              onClick={handleTurnoButtonClick}
              className={`inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full border px-3 text-xs font-black transition ${
                isTurnoOpen
                  ? "border-red-700 bg-red-700 text-white hover:bg-red-800"
                  : "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
              } ${isHighContrast ? (isTurnoOpen ? "contrast-button-danger" : "contrast-button-primary") : ""}`}
              aria-pressed={isTurnoOpen}
              aria-label={isTurnoOpen ? "Cerrar turno" : "Abrir turno"}
              title={isTurnoOpen ? "Cerrar turno" : "Abrir turno"}
            >
              {isTurnoOpen ? <LockKeyhole className="h-4 w-4" aria-hidden="true" /> : <UnlockKeyhole className="h-4 w-4" aria-hidden="true" />}
              <span>{isTurnoOpen ? "Cerrar turno" : "Abrir turno"}</span>
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-amber-300 bg-amber-50 px-4 py-1 text-xs font-bold text-slate-700">
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-700">PDV</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {orderDate}
            </span>
          </div>
        </div>

        <div className="border-b border-slate-200 no-print print:hidden">
          <div className="grid gap-2 border-t border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Origen</span>
              <span className="font-black text-slate-950">PDV</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Estado</span>
              <span className="font-black text-slate-950">Pendiente</span>
            </div>
          </div>
          <div className="grid grid-cols-[52px_minmax(0,1fr)] border-t border-slate-200">
            <div className="flex items-center justify-center gap-1 text-slate-700">
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs">⌄</span>
            </div>
            <input
              type="text"
              value={clienteNombre}
              maxLength={PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH}
              onChange={(event) => setClienteNombre(event.target.value)}
              placeholder="Agregar un nombre de cliente"
              className="h-14 border-0 border-l border-[#FECE00] bg-amber-50 px-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-400 px-3 py-3 text-sm font-bold text-white no-print print:hidden">
          Productos del pedido
        </div>

        <div className="px-3 pt-3 no-print print:hidden">
          <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!canPrint}
              className={`w-full min-w-0 ${quickActionButtonClass} ${!canPrint ? "cursor-not-allowed opacity-40" : ""}`}
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
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {showResetConfirm && (
          <div className={`mx-3 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 no-print print:hidden ${isHighContrast ? "contrast-panel-soft" : "border-red-200 bg-red-50"}`}>
            <p className="font-bold text-sm">¿Está seguro de borrar el pedido?</p>
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
                className={quickActionButtonClass}
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
            className="mx-3 mt-3 min-w-0 outline-none"
          >
            <Toast
              feedback={feedback}
              isAccessible={false}
              isHighContrast={isHighContrast}
              className="w-full"
            />
          </div>
        )}

        {!isTurnoOpen && (
          <div className="mx-3 mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-3 text-sm font-bold text-red-800 no-print print:hidden" role="alert">
            <p>Turno cerrado. Abre turno para poder registrar pedidos.</p>
            <p className="mt-1 text-red-700">Para comenzar a vender, abre un turno.</p>
          </div>
        )}

        <div className="min-h-[260px] flex-1 overflow-y-auto border-b border-dashed border-slate-300 bg-white p-3">
          {pedidoDetalles.length === 0 ? (
            <div className="flex h-full min-h-[360px] items-center justify-center text-center text-sm text-slate-500">
              Agrega productos antes de aceptar el pedido
            </div>
          ) : (
            <div className="space-y-2">
              {pedidoDetalles.map((item) => (
                <div
                  key={item.productoId}
                  className="grid grid-cols-[1fr_auto] gap-2 border-b border-slate-100 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {item.producto.nombre}
                    </p>
                    <p className="text-xs text-slate-600">
                      {item.cantidad} x {formatCurrency(item.producto.precio)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-sm font-bold">
                      {formatCurrency(item.subtotal)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeProduct(item.productoId)}
                      className="rounded p-1 text-lg transition hover:bg-red-50 hover:opacity-70"
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

        <div className="border-b border-dashed border-slate-300 px-3 py-3 no-print print:hidden">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Subtotal Productos ({pedidoDetalles.length})</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Descuento</span>
            <span>{formatCurrency(0)}</span>
          </div>
        </div>

        <div className="border-b border-slate-200 px-3 py-3 no-print print:hidden">
          <div className="mb-3 flex items-center justify-end">
            <div className="text-right">
              <span className="mr-2 text-xs font-black text-slate-900">Total</span>
              <span className="text-2xl font-black text-slate-950">{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_OPTIONS.map((option) => {
              const active = metodoPago === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectMetodoPago(option.value)}
                  className={`flex min-h-[42px] items-center justify-center gap-1 rounded-md border px-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                    active
                      ? "border-[#FECE00] bg-[#FECE00] text-slate-950"
                      : "border-slate-300 bg-white text-slate-950 hover:bg-amber-50"
                  }`}
                  aria-pressed={active}
                >
                  <option.Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-xs">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1.1fr] gap-1.5 p-3 no-print print:hidden">
          <button
            type="button"
            onClick={openResetConfirm}
            disabled={pedidoDetalles.length === 0}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-red-500 bg-white px-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAcceptClick}
            disabled={!puedeRegistrar}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border font-bold transition ${
              puedeRegistrar
                ? "border-slate-700 bg-slate-700 text-white hover:bg-slate-800"
                : "cursor-not-allowed border-slate-300 bg-slate-300 text-white"
            } ${isHighContrast && puedeRegistrar ? "contrast-button-success" : ""}`}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {sending ? "Aceptando..." : "Aceptar"}
          </button>
        </div>
      </aside>

      {showOpenTurnoConfirm && (
        <ConfirmDialog
          title="Abrir turno"
          description="Al abrir el turno podrás comenzar a registrar pedidos."
          primaryLabel="Abrir turno"
          onCancel={() => setShowOpenTurnoConfirm(false)}
          onConfirm={handleConfirmOpenTurno}
        >
          <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
            <div className="flex items-center justify-between gap-3">
              <span>Cajero actual</span>
              <span className="font-black text-slate-950">{user?.label ?? "Sin usuario"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Fecha y hora</span>
              <span className="font-black text-slate-950">{fullDate}</span>
            </div>
          </div>
        </ConfirmDialog>
      )}

      {showSubmitConfirm && (
        <ConfirmDialog
          title="Registrar pedido"
          description="¿Deseas registrar este pedido?"
          primaryLabel={sending ? "Registrando..." : "Aceptar pedido"}
          onCancel={() => setShowSubmitConfirm(false)}
          onConfirm={handleConfirmSubmit}
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
            <p>{pedidoDetalles.length} productos</p>
            <p className="mt-1 text-xl font-black text-slate-950">{formatCurrency(total)}</p>
            <p className="mt-1">Pago: {getPaymentLabel(metodoPago)}</p>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}

function PdvProductTile({
  producto,
  cantidad,
  disabled,
  onIncrease,
  onDecrease,
  onAdd
}: {
  producto: Producto;
  cantidad: number;
  disabled: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onAdd: () => void;
}) {
  return (
    <article className={`group relative overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm transition ${disabled ? "opacity-60" : "hover:border-amber-400 hover:shadow-md"}`}>
      <button type="button" onClick={onAdd} disabled={disabled} className="block w-full text-left disabled:cursor-not-allowed" aria-label={`Agregar ${producto.nombre}`}>
        <div className="relative h-[120px] overflow-hidden bg-slate-300">
          {producto.imagen ? (
            <img src={producto.imagen} alt={`Imagen de ${producto.nombre}`} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-300 text-center text-xs font-bold uppercase text-slate-600">
              Producto
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-2 pb-1.5 pt-8">
            <h3 className="line-clamp-2 min-h-[34px] text-sm font-black uppercase leading-tight text-white">{producto.nombre}</h3>
          </div>
          {cantidad > 0 && (
            <span className="absolute right-2 top-2 rounded-full bg-[#FECE00] px-2 py-0.5 text-xs font-black text-slate-950">
              {cantidad}
            </span>
          )}
        </div>
      </button>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-2 py-1.5">
        <p className="truncate text-base font-black text-slate-800">{formatCurrency(producto.precio)}</p>
        <button type="button" onClick={onAdd} disabled={disabled} className="rounded-full p-1 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed" aria-label={`Agregar ${producto.nombre}`}>
          <Info className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {cantidad > 0 && (
        <div className="grid grid-cols-2 border-t border-slate-200">
          <button type="button" onClick={onDecrease} disabled={disabled} className="min-h-[32px] bg-slate-50 text-lg font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed" aria-label={`Disminuir ${producto.nombre}`}>
            -
          </button>
          <button type="button" onClick={onIncrease} disabled={disabled} className="min-h-[32px] bg-[#FECE00] text-lg font-black text-slate-950 transition hover:bg-[#FFD633] disabled:cursor-not-allowed" aria-label={`Aumentar ${producto.nombre}`}>
            +
          </button>
        </div>
      )}
      {disabled && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/45 px-2 text-center text-xs font-black text-slate-700">
          Abrir turno
        </div>
      )}
    </article>
  );
}

function ConfirmDialog({
  children,
  description,
  onCancel,
  onConfirm,
  primaryLabel,
  title
}: {
  children?: ReactNode;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  primaryLabel: string;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 no-print" role="dialog" aria-modal="true" aria-labelledby="pdv-confirm-title">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 id="pdv-confirm-title" className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 text-sm font-bold text-slate-600">{description}</p>
        </div>
        <div className="space-y-4 p-5">
          {children}
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4">
          <button type="button" onClick={onCancel} className={`min-h-[46px] rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className={`min-h-[46px] rounded-xl border border-slate-900 bg-slate-900 px-4 font-black text-white transition hover:bg-black ${FOCUS_VISIBLE_CLASS}`}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PdvNormalView;
