import { Accessibility, AlertTriangle, Clock3, ClipboardPlus, LoaderCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import type { PedidoResponse } from "../../types";
import {
  EmptyPedidosMessage,
  ESTADO_OPTIONS,
  FOCUS_VISIBLE_CLASS,
  formatCurrency,
  formatTime,
  getPedidoCounts,
  getPedidoSummary,
  LargeActionButton,
  LargeStatusLabel,
  PedidoModal,
  StatusBadge,
  usePedidosController,
  type ActiveModal
} from "./PedidosShared";

function PedidosFacilPage() {
  const { isHighContrast, isPanelOpen, openAccessibilityPanel } = useAccessibilityContext();
  const {
    activeModal,
    error,
    estadoFilter,
    filteredPedidos,
    handleEstadoChange,
    isLoading,
    loadPedidos,
    pedidoCounts,
    setActiveModal,
    setEstadoFilter,
    updatingPedidoId
  } = usePedidosController({});

  const headerBg = isHighContrast
    ? "bg-black text-white border-b-2 border-yellow-400"
    : "bg-slate-900 text-white border-b border-slate-700";
  const pageBg = isHighContrast ? "bg-black" : "bg-white";
  const panelClass = isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className={headerBg}>
        <div className="mx-auto flex min-h-[84px] w-full max-w-[1520px] flex-wrap items-center justify-between gap-4 px-3 py-3 sm:px-4 lg:px-5 xl:px-6">
          <h1 className="font-black leading-none tracking-tight contrast-important text-3xl">
            Pedidos
          </h1>
          <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
            <Link
              to="/pdv"
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-lg font-black no-underline transition ${
                isHighContrast ? "contrast-button-secondary" : "border-white bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <ClipboardPlus className="h-6 w-6" aria-hidden="true" />
              Ir a Nuevo Pedido
            </Link>
            <button
              type="button"
              onClick={openAccessibilityPanel}
              aria-haspopup="dialog"
              aria-expanded={isPanelOpen}
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-lg font-black transition ${
                isHighContrast ? "contrast-button-secondary" : "border-white bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <Accessibility className="h-6 w-6" aria-hidden="true" />
              Accesibilidad
            </button>
            <button
              type="button"
              onClick={() => loadPedidos()}
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-lg font-black transition ${
                isHighContrast ? "contrast-button-secondary" : "border-white bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <RefreshCw className="h-6 w-6" aria-hidden="true" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <section className="mx-auto w-full max-w-[1520px] space-y-4 px-3 py-6 sm:px-4 lg:px-5 xl:px-6">
        <AccessibleIntroCard isHighContrast={isHighContrast} />
        <AccessibleEstadoSummary counts={pedidoCounts} isHighContrast={isHighContrast} />

        <div className={`rounded-[22px] px-3 py-3 sm:px-4 ${panelClass}`}>
          <div className="flex flex-wrap gap-4" role="group" aria-label="Filtros por estado">
            {ESTADO_OPTIONS.map((option) => {
              const isActive = estadoFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEstadoFilter(option.value)}
                  aria-pressed={isActive}
                  className={`min-h-[64px] whitespace-nowrap rounded-xl border px-6 text-lg font-black transition ${
                    isHighContrast
                      ? isActive
                        ? "contrast-button-primary"
                        : "contrast-button-secondary"
                      : isActive
                        ? "border-2 border-slate-900 bg-slate-900 text-white"
                        : "border-2 border-slate-300 bg-white text-slate-900 hover:border-slate-900 hover:bg-slate-50"
                  } ${FOCUS_VISIBLE_CLASS}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className={`flex items-start gap-3 rounded-2xl border p-4 ${isHighContrast ? "contrast-panel" : "border-red-200 bg-red-50 text-red-950"}`} role="alert">
            <AlertTriangle className="mt-1 h-5 w-5" aria-hidden="true" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className={`flex min-h-[260px] items-center justify-center rounded-[26px] ${panelClass}`}>
            <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
            <span className="ml-3 text-xl font-black">Cargando pedidos...</span>
          </div>
        ) : (
          <AccessiblePedidosList
            pedidos={filteredPedidos}
            isHighContrast={isHighContrast}
            onOpenModal={setActiveModal}
            updatingPedidoId={updatingPedidoId}
          />
        )}

        {activeModal && (
          <PedidoModal
            activeModal={activeModal}
            isUpdating={updatingPedidoId === activeModal.pedido.id}
            onClose={() => setActiveModal(null)}
            onEstadoChange={handleEstadoChange}
            onOpenModal={setActiveModal}
          />
        )}
      </section>
    </div>
  );
}

function AccessiblePedidosList({
  isHighContrast,
  onOpenModal,
  pedidos,
  updatingPedidoId
}: {
  isHighContrast: boolean;
  onOpenModal: (modal: ActiveModal) => void;
  pedidos: PedidoResponse[];
  updatingPedidoId: number | null;
}) {
  if (pedidos.length === 0) {
    return <EmptyPedidosMessage isAccessible />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {pedidos.map((pedido) => (
        <article
          key={pedido.id}
          className={`rounded-[26px] p-6 ${
            isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-3xl font-black text-slate-950">Pedido #{pedido.id}</p>
              <p className="mt-3 flex items-center gap-2 text-xl font-bold text-slate-700">
                <Clock3 className="h-5 w-5" aria-hidden="true" />
                Hora: {formatTime(pedido.createdAt)}
              </p>
            </div>
            <StatusBadge estado={pedido.estado} isLarge />
          </div>

          <div className={`mt-6 rounded-2xl p-5 ${isHighContrast ? "contrast-panel-soft border-2 border-yellow-400" : "border-2 border-slate-300 bg-slate-50"}`}>
            <p className="text-xl font-black leading-snug text-slate-950">{getPedidoSummary(pedido)}</p>
            <p className="mt-4 text-3xl font-black text-slate-950">Total: {formatCurrency(pedido.total)}</p>
          </div>

          <AccessiblePedidoActions
            isUpdating={updatingPedidoId === pedido.id}
            onOpenModal={onOpenModal}
            pedido={pedido}
          />
        </article>
      ))}
    </div>
  );
}

function AccessiblePedidoActions({
  isUpdating,
  onOpenModal,
  pedido
}: {
  isUpdating: boolean;
  onOpenModal: (modal: ActiveModal) => void;
  pedido: PedidoResponse;
}) {
  if (pedido.estado === "entregado") {
    return (
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <LargeActionButton label="Ver pedido" onClick={() => onOpenModal({ action: "detail", pedido })} />
        <LargeStatusLabel label="Pedido finalizado" />
      </div>
    );
  }

  if (pedido.estado === "cancelado") {
    return (
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <LargeActionButton label="Ver pedido" onClick={() => onOpenModal({ action: "detail", pedido })} />
        <LargeStatusLabel label="Pedido cancelado" tone="danger" />
      </div>
    );
  }

  if (pedido.estado === "listo") {
    return (
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <LargeActionButton label="Ver pedido" onClick={() => onOpenModal({ action: "detail", pedido })} />
        <LargeActionButton
          label="Finalizar pedido"
          onClick={() => onOpenModal({ action: "finish", pedido })}
          disabled={isUpdating}
          tone="success"
        />
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-3 lg:grid-cols-2">
      <LargeActionButton label="Ver pedido" onClick={() => onOpenModal({ action: "detail", pedido })} />
      <LargeActionButton label="Cambiar estado" onClick={() => onOpenModal({ action: "state", pedido })} />
    </div>
  );
}

function AccessibleIntroCard({ isHighContrast }: { isHighContrast: boolean }) {
  return (
    <header className={`rounded-3xl p-6 sm:p-8 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}>
      <p className={`text-sm font-black uppercase tracking-[0.18em] ${isHighContrast ? "contrast-secondary-text" : "text-slate-500"}`}>
        Riquísimo · Modo Fácil
      </p>
      <h2 className="mt-3 text-[2.35rem] font-black leading-tight tracking-tight text-slate-950">
        Pedidos del turno
      </h2>
      <p className={`mt-3 max-w-3xl text-xl font-semibold leading-relaxed ${isHighContrast ? "contrast-body-text" : "text-slate-600"}`}>
        Revisa pedidos activos, entregados o cancelados del turno actual.
      </p>
    </header>
  );
}

function AccessibleEstadoSummary({
  counts,
  isHighContrast
}: {
  counts: ReturnType<typeof getPedidoCounts>;
  isHighContrast: boolean;
}) {
  const cards = [
    { label: "Pendientes", value: counts.pendientes },
    { label: "En preparación", value: counts.enPreparacion },
    { label: "Listos", value: counts.listos },
    { label: "Entregados", value: counts.entregados },
    { label: "Total pedidos", value: counts.total }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Resumen de estados">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`rounded-2xl p-5 ${
            isHighContrast ? "contrast-panel-soft border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"
          }`}
        >
          <p className="text-lg font-black text-slate-700">{card.label}</p>
          <p className="mt-2 text-4xl font-black leading-none text-slate-950">{card.value}</p>
        </article>
      ))}
    </section>
  );
}

export default PedidosFacilPage;
