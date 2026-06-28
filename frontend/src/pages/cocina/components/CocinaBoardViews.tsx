import {
  Check,
  ChefHat,
  Clock3,
  LoaderCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  Settings,
  UtensilsCrossed
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import EasyModeActions from "../../../components/EasyModeActions";
import ErrorAlert from "../../../components/ErrorAlert";
import { FOCUS_VISIBLE_CLASS } from "../../../constants/ui";
import type { EstadoPedido, PedidoResponse } from "../../../types";
import {
  PedidoModal,
  StatusBadge,
  formatElapsedTime,
  formatTime,
  getPedidoCounts,
  getPedidoSummary,
  getProductCount,
  type ActiveModal
} from "../../pedidos/PedidosShared";
import { getKitchenComments, getKitchenTicketInteractionProps, getKitchenTicketState } from "../utils/cocinaUtils";

export type CocinaViewProps = {
  activeModal: ActiveModal;
  counts: ReturnType<typeof getPedidoCounts>;
  error: string | null;
  isAutoRefreshEnabled: boolean;
  isFullscreen: boolean;
  isHighContrast: boolean;
  isLoading: boolean;
  onAdvanceVisible: () => void;
  onAutoRefreshToggle: () => void;
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onFullscreenToggle: () => void;
  onOpenModal: (modal: ActiveModal) => void;
  onRefresh: () => void;
  pedidos: PedidoResponse[];
  updatingPedidoId: number | null;
  urgentCount: number;
};

type TicketProps = {
  isHighContrast: boolean;
  isUpdating: boolean;
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onOpenModal: (modal: ActiveModal) => void;
  pedido: PedidoResponse;
};

export function CocinaNormalView({
  activeModal,
  counts,
  error,
  isAutoRefreshEnabled,
  isFullscreen,
  isHighContrast,
  isLoading,
  onAdvanceVisible,
  onAutoRefreshToggle,
  onEstadoChange,
  onFullscreenToggle,
  onOpenModal,
  onRefresh,
  pedidos,
  updatingPedidoId,
  urgentCount
}: CocinaViewProps) {
  const panelClass = isHighContrast
    ? "contrast-panel border-yellow-400"
    : "border border-slate-200 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.08)]";

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <section className="mx-auto w-full max-w-[1640px] space-y-4 px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <KitchenTitlePill counts={counts} isHighContrast={isHighContrast} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onAdvanceVisible}
              disabled={pedidos.length === 0 || updatingPedidoId !== null}
              className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isHighContrast
                  ? "contrast-button-primary"
                  : "border border-yellow-400 bg-[#FECE00] text-slate-950 shadow-md hover:bg-[#FFD633]"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <Check className="h-5 w-5" aria-hidden="true" />
              Marcar todas
            </button>
            <IconButton
              label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              onClick={onFullscreenToggle}
              icon={isFullscreen ? Minimize2 : Maximize2}
              isHighContrast={isHighContrast}
            />
            <IconButton label="Actualizar" onClick={onRefresh} icon={RefreshCw} isHighContrast={isHighContrast} />
            <IconButton
              label="Cocinas"
              onClick={onRefresh}
              icon={Settings}
              isHighContrast={isHighContrast}
              text="Cocinas"
            />
          </div>
        </div>

        <div
          className={`flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${panelClass}`}
        >
          <button
            type="button"
            onClick={onAutoRefreshToggle}
            aria-pressed={isAutoRefreshEnabled}
            className={`inline-flex min-h-[48px] items-center justify-center rounded-lg px-5 text-sm font-black transition ${
              isAutoRefreshEnabled
                ? isHighContrast
                  ? "contrast-button-primary"
                  : "border border-yellow-400 bg-[#FECE00] text-slate-950 hover:bg-[#FFD633]"
                : isHighContrast
                  ? "contrast-button-secondary"
                  : "border border-yellow-300 bg-white text-slate-950 hover:bg-[#FFF8DC]"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isAutoRefreshEnabled ? "Actualización automática activa" : "Activar actualización automática"}
          </button>
          <p
            className={`flex items-center gap-2 text-sm font-semibold ${isHighContrast ? "contrast-secondary-text" : "text-slate-700"}`}
          >
            <RefreshCw className={`h-5 w-5 ${isAutoRefreshEnabled ? "animate-spin" : ""}`} aria-hidden="true" />
            {isAutoRefreshEnabled
              ? "Los tickets nuevos entran solos a cocina."
              : "Actualiza manualmente para ver nuevos tickets."}
          </p>
        </div>

        <CocinaSummary counts={counts} isHighContrast={isHighContrast} urgentCount={urgentCount} />

        {error && <ErrorAlert isHighContrast={isHighContrast} message={error} />}

        {isLoading ? (
          <LoadingPanel isHighContrast={isHighContrast} label="Cargando tickets de cocina..." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {pedidos.length === 0 ? (
              <EmptyKitchenSlots isHighContrast={isHighContrast} />
            ) : (
              pedidos.map((pedido) => (
                <KitchenTicket
                  key={pedido.id}
                  isHighContrast={isHighContrast}
                  isUpdating={updatingPedidoId === pedido.id}
                  onEstadoChange={onEstadoChange}
                  onOpenModal={onOpenModal}
                  pedido={pedido}
                />
              ))
            )}
          </div>
        )}

        {activeModal && (
          <PedidoModal
            activeModal={activeModal}
            isUpdating={updatingPedidoId === activeModal.pedido.id}
            onClose={() => onOpenModal(null)}
            onEstadoChange={onEstadoChange}
            onOpenModal={onOpenModal}
          />
        )}
      </section>
    </div>
  );
}

export function CocinaFacilView({
  activeModal,
  counts,
  error,
  isAutoRefreshEnabled,
  isFullscreen,
  isHighContrast,
  isLoading,
  onAdvanceVisible,
  onAutoRefreshToggle,
  onEstadoChange,
  onFullscreenToggle,
  onOpenModal,
  onRefresh,
  pedidos,
  updatingPedidoId,
  urgentCount
}: CocinaViewProps) {
  const pageBg = isHighContrast ? "bg-black" : "bg-white";
  const panelClass = isHighContrast
    ? "contrast-panel border-2 border-yellow-400"
    : "border-2 border-slate-900 bg-white";
  const secondaryButtonClass = isHighContrast
    ? "contrast-button-secondary"
    : "border-slate-300 bg-white text-slate-950 hover:border-slate-900 hover:bg-slate-50";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <section className="mx-auto w-full max-w-[1520px] space-y-5 px-3 py-6 sm:px-4 lg:px-5 xl:px-6">
        <header className={`rounded-[28px] p-5 sm:p-6 ${panelClass}`}>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(520px,760px)] xl:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Modo fácil</p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-slate-950">Preparación</h1>
              <p className="mt-3 text-xl font-bold text-slate-700">Aquí aparecen los pedidos que deben prepararse.</p>
            </div>
            <EasyModeActions />
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <p className="text-xl font-black text-slate-950">
              {isAutoRefreshEnabled
                ? "La preparación se actualiza sola cada pocos segundos."
                : "La preparación está en actualización manual."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onFullscreenToggle}
                aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-black transition ${secondaryButtonClass} ${FOCUS_VISIBLE_CLASS}`}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Maximize2 className="h-6 w-6" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Pantalla</span>
              </button>
              <button
                type="button"
                onClick={onRefresh}
                className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-black transition ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : "border-slate-950 bg-slate-950 text-white hover:bg-black"
                } ${FOCUS_VISIBLE_CLASS}`}
              >
                <RefreshCw className="h-6 w-6" aria-hidden="true" />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        <div className={`rounded-[26px] p-5 ${panelClass}`}>
          <div className="flex min-h-[64px] w-fit items-center gap-3 rounded-2xl border-2 border-slate-900 bg-slate-900 px-5 text-xl font-black text-white">
            <ChefHat className="h-7 w-7" aria-hidden="true" />
            Pedidos para preparar
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LargeMetric label="Pendientes" value={counts.pendientes} />
            <LargeMetric label="En preparación" value={counts.enPreparacion} />
            <LargeMetric label="Listos" value={counts.listos} />
            <LargeMetric label="Urgentes (más de 20 min)" value={urgentCount} />
          </div>
        </div>

        <div className={`grid gap-4 rounded-[26px] p-4 ${panelClass} md:grid-cols-[1fr_auto] md:items-center`}>
          <p className="text-xl font-black text-slate-950">Controles de preparación</p>
          <div className="grid gap-3 sm:grid-cols-2 md:min-w-[460px]">
            <button
              type="button"
              onClick={onAutoRefreshToggle}
              className={`min-h-[70px] rounded-2xl border-2 px-5 text-xl font-black transition ${
                isAutoRefreshEnabled
                  ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              {isAutoRefreshEnabled ? "Auto activo" : "Activar auto"}
            </button>
            <button
              type="button"
              onClick={onAdvanceVisible}
              disabled={pedidos.length === 0 || updatingPedidoId !== null}
              className={`min-h-[70px] rounded-2xl border-2 border-emerald-700 bg-emerald-600 px-5 text-xl font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
            >
              Marcar todas
            </button>
          </div>
        </div>

        {error && <ErrorAlert isHighContrast={isHighContrast} message={error} />}

        {isLoading ? (
          <LoadingPanel isHighContrast={isHighContrast} label="Cargando tickets de cocina..." />
        ) : pedidos.length === 0 ? (
          <div
            className={`rounded-[26px] p-8 text-center ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
          >
            <UtensilsCrossed className="mx-auto h-12 w-12 text-slate-400" aria-hidden="true" />
            <p className="mt-4 text-3xl font-black text-slate-950">No hay tickets en esta estación</p>
            <p className="mt-2 text-xl font-bold text-slate-600">
              Cuando entre un pedido aparecerá aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {pedidos.map((pedido) => (
              <AccessibleKitchenTicket
                key={pedido.id}
                isHighContrast={isHighContrast}
                isUpdating={updatingPedidoId === pedido.id}
                onEstadoChange={onEstadoChange}
                onOpenModal={onOpenModal}
                pedido={pedido}
              />
            ))}
          </div>
        )}

        {activeModal && (
          <PedidoModal
            activeModal={activeModal}
            isUpdating={updatingPedidoId === activeModal.pedido.id}
            onClose={() => onOpenModal(null)}
            onEstadoChange={onEstadoChange}
            onOpenModal={onOpenModal}
          />
        )}
      </section>
    </div>
  );
}

function KitchenTitlePill({
  counts,
  isHighContrast
}: {
  counts: ReturnType<typeof getPedidoCounts>;
  isHighContrast: boolean;
}) {
  return (
    <div
      className={`inline-flex w-fit min-h-[56px] items-center gap-2 rounded-xl border px-5 text-sm font-black ${isHighContrast ? "contrast-panel border-yellow-400" : "border-yellow-300 bg-[#FFF8DC] text-slate-950 shadow-sm"}`}
    >
      <ChefHat className="h-5 w-5" aria-hidden="true" />
      Cocina principal
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FECE00] px-1.5 text-xs text-slate-950">
        {counts.pendientes + counts.enPreparacion}
      </span>
    </div>
  );
}

function CocinaSummary({
  counts,
  isHighContrast,
  urgentCount
}: {
  counts: ReturnType<typeof getPedidoCounts>;
  isHighContrast: boolean;
  urgentCount: number;
}) {
  const summaryItems = [
    { label: "Pendientes", value: counts.pendientes },
    { label: "En preparación", value: counts.enPreparacion },
    { label: "Listos", value: counts.listos },
    { label: "Urgentes", value: urgentCount }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {summaryItems.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl px-4 py-3 ${isHighContrast ? "contrast-panel border-yellow-400" : "border border-slate-200 bg-white"}`}
        >
          <p className="text-xs font-black uppercase text-slate-500">{item.label}</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function KitchenTicket({ isHighContrast, isUpdating, onEstadoChange, onOpenModal, pedido }: TicketProps) {
  const { delayed, isPending, isPreparing, isReady, numeroPedido } = getKitchenTicketState(pedido);
  const interactionProps = getKitchenTicketInteractionProps(pedido, onOpenModal);
  const comentarios = getKitchenComments(pedido);

  return (
    <article
      {...interactionProps}
      className={`flex min-h-[246px] cursor-pointer flex-col justify-between rounded-xl border border-dashed p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${
        isHighContrast
          ? "contrast-panel border-yellow-400"
          : delayed
            ? "border-yellow-300 bg-yellow-50"
            : "border-slate-300 bg-white"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-black text-slate-950">Pedido #{numeroPedido}</p>
            <p
              className={`mt-1 flex items-center gap-1.5 text-sm font-bold ${delayed ? "text-yellow-700" : "text-slate-600"}`}
            >
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              {formatElapsedTime(pedido.createdAt)}
            </p>
          </div>
          <StatusBadge estado={pedido.estado} />
        </div>

        <p className="mt-4 text-base font-black leading-snug text-slate-950">{getPedidoSummary(pedido)}</p>
        <p className="mt-2 text-sm font-bold text-slate-500">
          {getProductCount(pedido)} productos · {formatTime(pedido.createdAt)}
        </p>
        {pedido.observacion && (
          <p className="mt-3 rounded-lg border border-yellow-200 bg-[#FFF8DC] px-3 py-2 text-sm font-bold text-slate-800">
            {pedido.observacion}
          </p>
        )}
        {comentarios.length > 0 && (
          <div className="mt-3 rounded-lg border-2 border-yellow-300 bg-[#FFF8DC] px-3 py-2 text-sm text-slate-950">
            <p className="text-xs font-black uppercase tracking-wide text-yellow-950">Comentarios para cocina</p>
            {comentarios.map((comentario) => (
              <p key={`${comentario.productoId}-${comentario.texto}`} className="mt-1 font-black leading-snug">
                {comentario.producto}: {comentario.texto}
              </p>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs font-black uppercase text-slate-400">Haz clic para ver todos los detalles</p>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="grid grid-cols-2 gap-2" aria-label="Flujo del pedido">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (isPending) {
                onEstadoChange(pedido, "en_preparacion");
              }
            }}
            disabled={!isPending || isUpdating}
            className={`min-h-[44px] rounded-lg border px-3 text-sm font-black transition disabled:cursor-not-allowed ${
              isPreparing
                ? "border-yellow-300 bg-yellow-100 text-yellow-900"
                : isPending
                  ? "border-yellow-600 bg-yellow-500 text-white hover:bg-yellow-600"
                  : "border-slate-200 bg-slate-100 text-slate-400"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isPreparing ? "En preparación" : isUpdating && isPending ? "Guardando..." : "En preparación"}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (isPreparing) {
                onEstadoChange(pedido, "listo");
              }
            }}
            disabled={!isPreparing || isUpdating}
            className={`min-h-[44px] rounded-lg border px-3 text-sm font-black transition disabled:cursor-not-allowed ${
              isPreparing
                ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                : "border-slate-200 bg-slate-100 text-slate-400"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isUpdating && isPreparing ? "Guardando..." : "Listo"}
          </button>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (isReady) {
              onEstadoChange(pedido, "entregado");
            }
          }}
          disabled={!isReady || isUpdating}
          className={`min-h-[44px] rounded-lg border px-3 text-sm font-black transition disabled:cursor-not-allowed ${
            isReady
              ? "border-slate-900 bg-slate-900 text-white hover:bg-black"
              : "border-slate-200 bg-slate-100 text-slate-400"
          } ${FOCUS_VISIBLE_CLASS}`}
        >
          {isUpdating && isReady ? "Guardando..." : "Entregar"}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenModal({ action: "detail", pedido });
          }}
          className={`min-h-[44px] rounded-lg border px-3 text-sm font-black transition ${isHighContrast ? "contrast-button-secondary" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"} ${FOCUS_VISIBLE_CLASS}`}
        >
          Ver detalle completo
        </button>
      </div>
    </article>
  );
}

function AccessibleKitchenTicket({ isHighContrast, isUpdating, onEstadoChange, onOpenModal, pedido }: TicketProps) {
  const { delayed, isPending, isPreparing, isReady, numeroPedido } = getKitchenTicketState(pedido);
  const interactionProps = getKitchenTicketInteractionProps(pedido, onOpenModal);
  const comentarios = getKitchenComments(pedido);

  return (
    <article
      {...interactionProps}
      className={`cursor-pointer rounded-[26px] p-6 transition hover:-translate-y-0.5 hover:shadow-xl ${
        isHighContrast
          ? "contrast-panel border-2 border-yellow-400"
          : delayed
            ? "border-2 border-yellow-500 bg-yellow-50"
            : "border-2 border-slate-900 bg-white"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-3xl font-black text-slate-950">Pedido #{numeroPedido}</p>
          <p
            className={`mt-3 flex items-center gap-2 text-xl font-bold ${delayed ? "text-yellow-700" : "text-slate-700"}`}
          >
            <Clock3 className="h-6 w-6" aria-hidden="true" />
            {formatElapsedTime(pedido.createdAt)}
          </p>
        </div>
        <StatusBadge estado={pedido.estado} isLarge />
      </div>

      <div
        className={`mt-6 rounded-2xl p-5 ${isHighContrast ? "contrast-panel-soft border-2 border-yellow-400" : "border-2 border-slate-300 bg-slate-50"}`}
      >
        <p className="text-2xl font-black leading-snug text-slate-950">{getPedidoSummary(pedido)}</p>
        <p className="mt-4 text-xl font-bold text-slate-700">
          {getProductCount(pedido)} productos · Hora {formatTime(pedido.createdAt)}
        </p>
        <p className="mt-3 text-lg font-black text-slate-500">Toca la tarjeta para ver todos los productos.</p>
        {pedido.observacion && (
          <p className="mt-4 rounded-2xl border-2 border-yellow-300 bg-[#FFF8DC] p-4 text-xl font-black text-slate-950">
            {pedido.observacion}
          </p>
        )}
        {comentarios.length > 0 && (
          <div className="mt-4 rounded-2xl border-2 border-yellow-400 bg-[#FFF8DC] p-4 text-slate-950">
            <p className="text-lg font-black uppercase tracking-wide text-yellow-950">Comentarios para cocina</p>
            {comentarios.map((comentario) => (
              <p key={`${comentario.productoId}-${comentario.texto}`} className="mt-2 text-xl font-black leading-snug">
                {comentario.producto}: {comentario.texto}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Flujo del pedido">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (isPending) {
                onEstadoChange(pedido, "en_preparacion");
              }
            }}
            disabled={!isPending || isUpdating}
            className={`min-h-[72px] rounded-2xl border-2 px-5 text-xl font-black transition disabled:cursor-not-allowed ${
              isPreparing
                ? "border-yellow-400 bg-yellow-100 text-yellow-950"
                : isPending
                  ? "border-yellow-700 bg-yellow-600 text-white hover:bg-yellow-700"
                  : "border-slate-300 bg-slate-100 text-slate-400"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isUpdating && isPending ? "Guardando..." : "En preparación"}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (isPreparing) {
                onEstadoChange(pedido, "listo");
              }
            }}
            disabled={!isPreparing || isUpdating}
            className={`min-h-[72px] rounded-2xl border-2 px-5 text-xl font-black transition disabled:cursor-not-allowed ${
              isPreparing
                ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                : "border-slate-300 bg-slate-100 text-slate-400"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isUpdating && isPreparing ? "Guardando..." : "Listo"}
          </button>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (isReady && window.confirm("¿Deseas marcar este pedido como entregado?")) {
              onEstadoChange(pedido, "entregado");
            }
          }}
          disabled={!isReady || isUpdating}
          className={`min-h-[72px] rounded-2xl border-2 px-5 text-xl font-black transition disabled:cursor-not-allowed ${
            isReady
              ? "border-slate-950 bg-slate-950 text-white hover:bg-black"
              : "border-slate-300 bg-slate-100 text-slate-400"
          } ${FOCUS_VISIBLE_CLASS}`}
        >
          {isUpdating && isReady ? "Guardando..." : "Entregar"}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenModal({ action: "detail", pedido });
          }}
          className={`min-h-[72px] rounded-2xl border-2 px-5 text-xl font-black transition ${isHighContrast ? "contrast-button-secondary" : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"} ${FOCUS_VISIBLE_CLASS}`}
        >
          Ver detalle completo
        </button>
      </div>
    </article>
  );
}

function EmptyKitchenSlots({ isHighContrast }: { isHighContrast: boolean }) {
  return (
    <>
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className={`flex min-h-[214px] items-center justify-center rounded-xl border border-dashed ${
            isHighContrast ? "contrast-panel border-yellow-400" : "border-slate-300 bg-white/50 text-slate-300"
          }`}
          aria-hidden="true"
        >
          <UtensilsCrossed className="h-9 w-9" />
        </div>
      ))}
      <p className="sr-only">No hay tickets de cocina en esta estación.</p>
    </>
  );
}

function IconButton({
  icon: Icon,
  isHighContrast,
  label,
  onClick,
  text
}: {
  icon: LucideIcon;
  isHighContrast: boolean;
  label: string;
  onClick: () => void;
  text?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border px-4 font-black transition ${
        isHighContrast
          ? "contrast-button-secondary"
          : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {text && <span>{text}</span>}
    </button>
  );
}

function LargeMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
      <p className="text-lg font-black text-slate-600">{label}</p>
      <p className="mt-2 text-4xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function LoadingPanel({ isHighContrast, label }: { isHighContrast: boolean; label: string }) {
  return (
    <div
      className={`flex min-h-[260px] items-center justify-center rounded-[26px] ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
    >
      <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
      <span className="ml-3 text-xl font-black">{label}</span>
    </div>
  );
}
