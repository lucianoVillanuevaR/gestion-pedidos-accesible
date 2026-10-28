import {
  Check,
  ChefHat,
  Clock3,
  Eye,
  LoaderCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";
import EasyModeActions from "../../../components/EasyModeActions";
import ErrorAlert from "../../../components/ErrorAlert";
import { FOCUS_VISIBLE_CLASS } from "../../../constants/ui";
import useAccessibleDialog from "../../../hooks/useAccessibleDialog";
import type { EstadoPedido, PedidoResponse, UserRole } from "../../../types";
import {
  PedidoModal,
  StatusBadge,
  formatElapsedTime,
  formatTime,
  getPedidoCounts,
  getPedidoSummary,
  getProductCount,
  type ActiveModal,
} from "../../pedidos/PedidosShared";
import {
  getKitchenComments,
  getKitchenTicketInteractionProps,
  getKitchenTicketState,
} from "../utils/cocinaUtils";

export type CocinaFilter =
  | "todos"
  | "por_preparar"
  | "pendiente"
  | "en_preparacion"
  | "listo";

export type CocinaViewProps = {
  activeModal: ActiveModal;
  advanceCounts?: { pendientes: number; enPreparacion: number };
  advanceMessage?: string | null;
  counts: ReturnType<typeof getPedidoCounts>;
  error: string | null;
  filter?: CocinaFilter;
  isFullscreen: boolean;
  isHighContrast: boolean;
  isAdvanceDialogOpen?: boolean;
  isAdvancingAll?: boolean;
  isLoading: boolean;
  isRefreshing?: boolean;
  onAdvanceDialogClose?: () => void;
  onAdvanceVisible: () => void;
  onConfirmAdvance?: () => void;
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onFilterChange?: (filter: CocinaFilter) => void;
  onFullscreenToggle: () => void;
  onOpenModal: (modal: ActiveModal) => void;
  onRefresh: () => void;
  operationalAudioBlocked?: boolean;
  pedidos: PedidoResponse[];
  role: UserRole;
  updatingPedidoId: number | null;
  urgentCount: number;
};

type TicketProps = {
  isHighContrast: boolean;
  isUpdating: boolean;
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onOpenModal: (modal: ActiveModal) => void;
  pedido: PedidoResponse;
  role: UserRole;
};

export function CocinaNormalView({
  activeModal,
  advanceCounts: providedAdvanceCounts,
  advanceMessage = null,
  counts,
  error,
  filter = "todos",
  isFullscreen,
  isHighContrast,
  isAdvanceDialogOpen = false,
  isAdvancingAll = false,
  isLoading,
  isRefreshing = false,
  onAdvanceDialogClose = () => undefined,
  onAdvanceVisible,
  onConfirmAdvance = () => undefined,
  onEstadoChange,
  onFilterChange = () => undefined,
  onFullscreenToggle,
  onOpenModal,
  onRefresh,
  operationalAudioBlocked = false,
  pedidos,
  role,
  updatingPedidoId,
  urgentCount,
}: CocinaViewProps) {
  const advanceCounts = providedAdvanceCounts ?? {
    pendientes: counts.pendientes,
    enPreparacion: counts.enPreparacion,
  };
  const orderedPedidos = [...pedidos].sort(
    (left, right) =>
      getKitchenStatePriority(left.estado) -
      getKitchenStatePriority(right.estado),
  );

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <section className="mx-auto w-full max-w-[1640px] space-y-4 px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <KitchenTitlePill counts={counts} isHighContrast={isHighContrast} />

          <div className="flex flex-wrap items-center gap-3">
            {role === "cocina" && (
              <button
                type="button"
                onClick={onAdvanceVisible}
                disabled={
                  advanceCounts.pendientes + advanceCounts.enPreparacion ===
                    0 ||
                  updatingPedidoId !== null ||
                  isAdvancingAll
                }
                className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isHighContrast
                    ? "contrast-button-primary"
                    : "border border-yellow-400 bg-[#FECE00] text-slate-950 shadow-md hover:bg-[#FFD633]"
                } ${FOCUS_VISIBLE_CLASS}`}
              >
                <Check className="h-5 w-5" aria-hidden="true" />
                Avanzar todos
              </button>
            )}
            <IconButton
              label={
                isFullscreen
                  ? "Salir de pantalla completa"
                  : "Pantalla completa"
              }
              onClick={onFullscreenToggle}
              icon={isFullscreen ? Minimize2 : Maximize2}
              isHighContrast={isHighContrast}
            />
            <IconButton
              disabled={isLoading || isRefreshing}
              isBusy={isRefreshing}
              label="Actualizar preparación"
              onClick={onRefresh}
              icon={RefreshCw}
              isHighContrast={isHighContrast}
            />
          </div>
        </div>

        <CocinaSummary
          counts={counts}
          isHighContrast={isHighContrast}
          urgentCount={urgentCount}
        />

        <CocinaFilters
          counts={counts}
          filter={filter}
          isHighContrast={isHighContrast}
          onFilterChange={onFilterChange}
        />

        {error && (
          <ErrorAlert isHighContrast={isHighContrast} message={error} />
        )}
        {operationalAudioBlocked && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm font-bold ${
              isHighContrast
                ? "contrast-panel border-yellow-400"
                : "border-amber-700 bg-amber-50 text-amber-950"
            }`}
          >
            El navegador bloqueó la alerta de sonido. Abre Accesibilidad y usa
            «Probar sonido» para habilitarla.
          </div>
        )}
        {advanceMessage && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm font-bold ${
              isHighContrast
                ? "contrast-panel border-yellow-400"
                : "border-slate-300 bg-white text-slate-800"
            }`}
          >
            {advanceMessage}
          </div>
        )}

        {isLoading ? (
          <LoadingPanel
            isHighContrast={isHighContrast}
            label="Cargando tickets de cocina..."
          />
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {pedidos.length === 0 ? (
              <EmptyKitchenSlots isHighContrast={isHighContrast} />
            ) : (
              orderedPedidos.map((pedido) => (
                <KitchenTicket
                  key={pedido.id}
                  isHighContrast={isHighContrast}
                  isUpdating={updatingPedidoId === pedido.id}
                  onEstadoChange={onEstadoChange}
                  onOpenModal={onOpenModal}
                  pedido={pedido}
                  role={role}
                />
              ))
            )}
          </div>
        )}

        {activeModal && (
          <PedidoModal
            activeModal={activeModal}
            canReadPedido
            isUpdating={updatingPedidoId === activeModal.pedido.id}
            onClose={() => onOpenModal(null)}
            onEstadoChange={onEstadoChange}
            onOpenModal={onOpenModal}
            role={role}
          />
        )}

        {isAdvanceDialogOpen && (
          <AdvanceAllDialog
            counts={advanceCounts}
            isHighContrast={isHighContrast}
            isProcessing={isAdvancingAll}
            onClose={onAdvanceDialogClose}
            onConfirm={onConfirmAdvance}
          />
        )}
      </section>
    </div>
  );
}

export function CocinaFacilView({
  activeModal,
  advanceCounts: providedAdvanceCounts,
  advanceMessage = null,
  counts,
  error,
  isFullscreen,
  isHighContrast,
  isAdvanceDialogOpen = false,
  isAdvancingAll = false,
  isLoading,
  isRefreshing = false,
  onAdvanceDialogClose = () => undefined,
  onAdvanceVisible,
  onConfirmAdvance = () => undefined,
  onEstadoChange,
  onFullscreenToggle,
  onOpenModal,
  onRefresh,
  operationalAudioBlocked = false,
  pedidos,
  role,
  updatingPedidoId,
  urgentCount,
}: CocinaViewProps) {
  const advanceCounts = providedAdvanceCounts ?? {
    pendientes: counts.pendientes,
    enPreparacion: counts.enPreparacion,
  };
  const pageBg = isHighContrast ? "bg-black" : "bg-white";
  const panelClass = isHighContrast
    ? "contrast-panel border-2 border-yellow-400"
    : "border-2 border-slate-900 bg-white";
  const secondaryButtonClass = isHighContrast
    ? "contrast-button-secondary"
    : "border-slate-300 bg-white text-slate-950 hover:border-slate-900 hover:bg-slate-50";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <section className="mx-auto w-full max-w-[1520px] space-y-3 px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
        <header className={`rounded-[28px] p-4 ${panelClass}`}>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(480px,680px)] xl:items-start">
            <div>
              <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Preparación
              </h1>
              <p className="mt-2 text-lg font-bold text-slate-700">
                Aquí aparecen los pedidos que deben prepararse.
              </p>
            </div>
            <EasyModeActions compact />
          </div>

          <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <p className="text-lg font-black text-slate-950">
              La preparación se actualiza automáticamente.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={onFullscreenToggle}
                aria-label={
                  isFullscreen
                    ? "Salir de pantalla completa"
                    : "Pantalla completa"
                }
                title={
                  isFullscreen
                    ? "Salir de pantalla completa"
                    : "Pantalla completa"
                }
                className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 px-4 text-base font-black transition ${secondaryButtonClass} ${FOCUS_VISIBLE_CLASS}`}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Maximize2 className="h-6 w-6" aria-hidden="true" />
                )}
                <span>
                  {isFullscreen
                    ? "Salir de pantalla completa"
                    : "Pantalla completa"}
                </span>
              </button>
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading || isRefreshing}
                aria-busy={isRefreshing}
                aria-label={
                  isRefreshing
                    ? "Actualizando pedidos de preparación"
                    : "Actualizar pedidos de preparación"
                }
                className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 px-4 text-base font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isHighContrast
                    ? "contrast-button-secondary"
                    : "border-slate-300 bg-white text-slate-950 hover:border-slate-900 hover:bg-slate-50"
                } ${FOCUS_VISIBLE_CLASS}`}
              >
                <RefreshCw
                  className={`h-6 w-6 ${isLoading || isRefreshing ? "motion-safe:animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {isRefreshing ? "Actualizando…" : "Actualizar"}
              </button>
            </div>
          </div>
        </header>

        <div className={`rounded-[26px] p-3 ${panelClass}`}>
          <div className="flex items-center gap-2 text-xl font-black text-slate-950 sm:text-2xl">
            <ChefHat className="h-6 w-6" aria-hidden="true" />
            Pedidos para preparar
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <LargeMetric label="Pendientes" value={counts.pendientes} />
            <LargeMetric label="En preparación" value={counts.enPreparacion} />
            <LargeMetric label="Listos" value={counts.listos} />
            <LargeMetric
              label="Atrasados"
              subtitle="Más de 20 min"
              value={urgentCount}
            />
          </div>
        </div>

        {role === "cocina" && (
          <div
            className={`grid gap-3 rounded-[26px] p-3 ${panelClass} md:grid-cols-[1fr_auto] md:items-center`}
          >
            <p className="text-lg font-black text-slate-950">
              Controles de preparación
            </p>
            <div className="md:min-w-[260px]">
              <button
                type="button"
                onClick={onAdvanceVisible}
                disabled={
                  advanceCounts.pendientes + advanceCounts.enPreparacion ===
                    0 ||
                  updatingPedidoId !== null ||
                  isAdvancingAll
                }
                aria-label="Avanzar todas al siguiente estado"
                className={`min-h-[52px] rounded-xl border-2 px-4 text-base font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isHighContrast
                    ? "contrast-button-primary"
                    : "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                } ${FOCUS_VISIBLE_CLASS}`}
              >
                Avanzar todas
              </button>
            </div>
          </div>
        )}

        {error && (
          <ErrorAlert isHighContrast={isHighContrast} message={error} />
        )}
        {operationalAudioBlocked && (
          <div
            role="status"
            className={`rounded-2xl p-4 text-lg font-black ${panelClass}`}
          >
            El navegador bloqueó la alerta de sonido. Abre Accesibilidad y usa
            «Probar sonido» para habilitarla.
          </div>
        )}
        {advanceMessage && (
          <div
            role="status"
            className={`rounded-2xl p-4 text-lg font-black ${panelClass}`}
          >
            {advanceMessage}
          </div>
        )}

        {isLoading ? (
          <LoadingPanel
            isHighContrast={isHighContrast}
            label="Cargando tickets de cocina..."
          />
        ) : pedidos.length === 0 ? (
          <div
            className={`rounded-[26px] p-6 text-center ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
          >
            <UtensilsCrossed
              className="mx-auto h-10 w-10 text-slate-400"
              aria-hidden="true"
            />
            <p className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
              No hay pedidos para preparar
            </p>
            <p className="mt-2 text-lg font-bold text-slate-600">
              Cuando haya nuevos pedidos, aparecerán aquí automáticamente.
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
                role={role}
              />
            ))}
          </div>
        )}

        {activeModal && (
          <PedidoModal
            activeModal={activeModal}
            canReadPedido
            isUpdating={updatingPedidoId === activeModal.pedido.id}
            onClose={() => onOpenModal(null)}
            onEstadoChange={onEstadoChange}
            onOpenModal={onOpenModal}
            role={role}
          />
        )}

        {isAdvanceDialogOpen && (
          <AdvanceAllDialog
            counts={advanceCounts}
            isHighContrast={isHighContrast}
            isProcessing={isAdvancingAll}
            onClose={onAdvanceDialogClose}
            onConfirm={onConfirmAdvance}
          />
        )}
      </section>
    </div>
  );
}

function KitchenTitlePill({
  counts,
  isHighContrast,
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

function CocinaFilters({
  counts,
  filter,
  isHighContrast,
  onFilterChange,
}: {
  counts: ReturnType<typeof getPedidoCounts>;
  filter: CocinaFilter;
  isHighContrast: boolean;
  onFilterChange: (filter: CocinaFilter) => void;
}) {
  const filters: Array<{ value: CocinaFilter; label: string; count: number }> =
    [
      {
        value: "todos",
        label: "Todos",
        count: counts.pendientes + counts.enPreparacion + counts.listos,
      },
      {
        value: "por_preparar",
        label: "Por preparar",
        count: counts.pendientes + counts.enPreparacion,
      },
      { value: "pendiente", label: "Pendientes", count: counts.pendientes },
      {
        value: "en_preparacion",
        label: "En preparación",
        count: counts.enPreparacion,
      },
      { value: "listo", label: "Listos", count: counts.listos },
    ];

  return (
    <div
      className={`flex flex-wrap gap-2 rounded-xl border p-2 ${
        isHighContrast
          ? "contrast-panel border-yellow-400"
          : "border-slate-200 bg-white"
      }`}
      aria-label="Filtrar pedidos de cocina"
    >
      {filters.map((option) => {
        const isSelected = filter === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onFilterChange(option.value)}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-4 text-sm font-black transition ${
              isSelected
                ? isHighContrast
                  ? "contrast-button-primary"
                  : "border-yellow-500 bg-[#FECE00] text-slate-950"
                : isHighContrast
                  ? "contrast-button-secondary"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {option.label}
            <span
              className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs ${
                isSelected
                  ? "bg-white/70 text-slate-950"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AdvanceAllDialog({
  counts,
  isHighContrast,
  isProcessing,
  onClose,
  onConfirm,
}: {
  counts: { pendientes: number; enPreparacion: number };
  isHighContrast: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  useAccessibleDialog({
    containerRef: dialogRef,
    initialFocusRef: cancelButtonRef,
    onClose: isProcessing ? undefined : onClose,
  });

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/40 p-4"
      role="presentation"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="advance-all-title"
        aria-describedby="advance-all-description"
        tabIndex={-1}
        className={`w-full max-w-xl rounded-2xl p-6 shadow-2xl ${
          isHighContrast
            ? "contrast-panel border-2 border-yellow-400"
            : "border border-slate-200 bg-white"
        }`}
      >
        <h2
          id="advance-all-title"
          className="text-2xl font-black text-slate-950"
        >
          ¿Avanzar todos los pedidos?
        </h2>
        <p
          id="advance-all-description"
          className="mt-3 font-bold leading-relaxed text-slate-700"
        >
          Esta acción avanzará los pedidos que tengan un cambio de estado
          disponible. Revisa los cambios antes de continuar.
        </p>
        <div className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 font-bold text-slate-800">
          <p>
            {counts.pendientes} pedidos pasarán de Pendiente a En preparación.
          </p>
          <p>
            {counts.enPreparacion} pedidos pasarán de En preparación a Listo.
          </p>
          <p>Los pedidos Listos no se modificarán.</p>
        </div>
        <p className="mt-4 text-sm font-bold text-slate-600">
          Se aplicará a todos los pedidos elegibles del turno,
          independientemente del filtro seleccionado.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className={`min-h-[50px] rounded-xl border-2 px-5 font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isHighContrast
                ? "contrast-button-secondary"
                : "border-slate-400 bg-white text-slate-800 hover:bg-slate-100"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={
              isProcessing || counts.pendientes + counts.enPreparacion === 0
            }
            className={`min-h-[50px] rounded-xl border-2 px-5 font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isHighContrast
                ? "contrast-button-primary"
                : "border-yellow-500 bg-[#FECE00] text-slate-950 hover:bg-[#FFD633]"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isProcessing ? "Actualizando..." : "Confirmar avance"}
          </button>
        </div>
      </section>
    </div>
  );
}

function CocinaSummary({
  counts,
  isHighContrast,
  urgentCount,
}: {
  counts: ReturnType<typeof getPedidoCounts>;
  isHighContrast: boolean;
  urgentCount: number;
}) {
  const summaryItems = [
    { label: "Pendientes", value: counts.pendientes },
    { label: "En preparación", value: counts.enPreparacion },
    { label: "Listos", value: counts.listos },
    { label: "Urgentes", subtitle: "Más de 20 min", value: urgentCount },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {summaryItems.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl px-4 py-3 ${isHighContrast ? "contrast-panel border-yellow-400" : "border border-slate-200 bg-white"}`}
        >
          <p className="text-xs font-black uppercase text-slate-500">
            {item.label}
          </p>
          <p className="mt-1 text-3xl font-black text-slate-950">
            {item.value}
          </p>
          {item.subtitle && (
            <p className="mt-1 text-xs font-bold text-slate-600">
              {item.subtitle}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function KitchenTicket({
  isHighContrast,
  isUpdating,
  onEstadoChange,
  onOpenModal,
  pedido,
  role,
}: TicketProps) {
  const { delayed, isPending, isPreparing, isReady, numeroPedido } =
    getKitchenTicketState(pedido);
  const comentarios = getKitchenComments(pedido);
  const stateClass = isPending
    ? "border-yellow-400 bg-yellow-50"
    : isPreparing
      ? "border-sky-500 bg-sky-50"
      : "border-emerald-500 bg-emerald-50";

  return (
    <article
      className={`flex h-full flex-col rounded-xl border-2 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        isHighContrast ? "contrast-panel border-yellow-400" : stateClass
      }`}
    >
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xl font-black leading-none text-slate-950 sm:text-3xl">
              Pedido #{numeroPedido}
            </p>
            <p
              className={`mt-2 flex items-center gap-1.5 text-base font-bold ${delayed ? "text-yellow-800" : "text-slate-700"}`}
            >
              <Clock3 className="h-5 w-5 shrink-0" aria-hidden="true" />
              {formatElapsedTime(pedido.createdAt)}
            </p>
          </div>
          <StatusBadge estado={pedido.estado} />
        </div>

        <p className="mt-4 text-lg font-black leading-relaxed text-slate-950">
          {getPedidoSummary(pedido)}
        </p>
        <p className="mt-2 text-sm font-bold text-slate-600">
          {getProductCount(pedido)} productos · {formatTime(pedido.createdAt)}
        </p>
        {pedido.observacion && (
          <p className="mt-3 rounded-lg border border-yellow-200 bg-[#FFF8DC] px-3 py-2 text-sm font-bold text-slate-800">
            {pedido.observacion}
          </p>
        )}
        {comentarios.length > 0 && (
          <div className="mt-3 rounded-lg border-2 border-yellow-300 bg-[#FFF8DC] px-3 py-2 text-sm text-slate-950">
            <p className="text-xs font-black uppercase tracking-wide text-yellow-950">
              Comentarios para cocina
            </p>
            {comentarios.map((comentario) => (
              <p
                key={`${comentario.productoId}-${comentario.texto}`}
                className="mt-1 font-black leading-snug"
              >
                {comentario.producto}: {comentario.texto}
              </p>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => onOpenModal({ action: "detail", pedido })}
            aria-label={`Ver detalles del pedido ${numeroPedido}`}
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border-2 px-4 text-base font-black transition ${
              isHighContrast
                ? "contrast-button-secondary"
                : "border-slate-800 bg-white text-slate-950 hover:bg-slate-100"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            <Eye className="h-5 w-5" aria-hidden="true" />
            Ver detalles
          </button>
        </div>
      </div>

      {role === "cocina" && !isReady && (
        <div
          className="mt-4 border-t border-slate-300 pt-4"
          aria-label="Flujo del pedido"
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEstadoChange(pedido, isPending ? "en_preparacion" : "listo");
            }}
            disabled={isUpdating}
            className={`min-h-[48px] w-full rounded-lg border-2 px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isPending
                ? "border-yellow-600 bg-yellow-500 text-slate-950 hover:bg-yellow-600"
                : "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isUpdating
              ? "Guardando..."
              : isPending
                ? "Iniciar preparación"
                : "Marcar como listo"}
          </button>
        </div>
      )}
    </article>
  );
}

function AccessibleKitchenTicket({
  isHighContrast,
  isUpdating,
  onEstadoChange,
  onOpenModal,
  pedido,
  role,
}: TicketProps) {
  const { delayed, isPending, isPreparing, numeroPedido } =
    getKitchenTicketState(pedido);
  const interactionProps = getKitchenTicketInteractionProps(
    pedido,
    onOpenModal,
  );
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
          <p className="text-3xl font-black text-slate-950">
            Pedido #{numeroPedido}
          </p>
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
        <p className="text-2xl font-black leading-snug text-slate-950">
          {getPedidoSummary(pedido)}
        </p>
        <p className="mt-4 text-xl font-bold text-slate-700">
          {getProductCount(pedido)} productos · Hora{" "}
          {formatTime(pedido.createdAt)}
        </p>
        <p className="mt-3 text-lg font-black text-slate-500">
          Toca la tarjeta para ver todos los productos.
        </p>
        {pedido.observacion && (
          <p className="mt-4 rounded-2xl border-2 border-yellow-300 bg-[#FFF8DC] p-4 text-xl font-black text-slate-950">
            {pedido.observacion}
          </p>
        )}
        {comentarios.length > 0 && (
          <div className="mt-4 rounded-2xl border-2 border-yellow-400 bg-[#FFF8DC] p-4 text-slate-950">
            <p className="text-lg font-black uppercase tracking-wide text-yellow-950">
              Comentarios para cocina
            </p>
            {comentarios.map((comentario) => (
              <p
                key={`${comentario.productoId}-${comentario.texto}`}
                className="mt-2 text-xl font-black leading-snug"
              >
                {comentario.producto}: {comentario.texto}
              </p>
            ))}
          </div>
        )}
      </div>

      {role === "cocina" && (
        <div className="mt-5 grid gap-3">
          <div
            className="grid gap-3 sm:grid-cols-2"
            aria-label="Flujo del pedido"
          >
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
        </div>
      )}
    </article>
  );
}

function EmptyKitchenSlots({ isHighContrast }: { isHighContrast: boolean }) {
  return (
    <div
      className={`col-span-full flex items-center justify-center gap-3 rounded-xl border border-dashed px-5 py-8 ${
        isHighContrast
          ? "contrast-panel border-yellow-400"
          : "border-slate-300 bg-white text-slate-600"
      }`}
      role="status"
    >
      <UtensilsCrossed className="h-9 w-9 shrink-0" aria-hidden="true" />
      <p className="text-lg font-black">No hay pedidos para preparar.</p>
    </div>
  );
}

function getKitchenStatePriority(estado: EstadoPedido) {
  if (estado === "pendiente") return 0;
  if (estado === "en_preparacion") return 1;
  if (estado === "listo") return 2;
  return 3;
}

function IconButton({
  disabled = false,
  icon: Icon,
  isBusy = false,
  isHighContrast,
  label,
  onClick,
  text,
}: {
  disabled?: boolean;
  icon: LucideIcon;
  isBusy?: boolean;
  isHighContrast: boolean;
  label: string;
  onClick: () => void;
  text?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={isBusy || undefined}
      aria-label={isBusy ? "Actualizando preparación" : label}
      title={label}
      className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border px-4 font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
        isHighContrast
          ? "contrast-button-secondary"
          : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      <Icon
        className={`h-5 w-5 ${isBusy ? "motion-safe:animate-spin" : ""}`}
        aria-hidden="true"
      />
      {text && <span>{text}</span>}
    </button>
  );
}

function LargeMetric({
  label,
  subtitle,
  value,
}: {
  label: string;
  subtitle?: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3">
      <p className="text-base font-black text-slate-600 sm:text-lg">{label}</p>
      <p className="mt-1 text-3xl font-black leading-none text-slate-950 sm:text-4xl">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-sm font-bold text-slate-600 sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function LoadingPanel({
  isHighContrast,
  label,
}: {
  isHighContrast: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex min-h-[260px] items-center justify-center rounded-[26px] ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
    >
      <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
      <span className="ml-3 text-xl font-black">{label}</span>
    </div>
  );
}
