import { Accessibility, AlertTriangle, Check, ClipboardPlus, LoaderCircle, RefreshCw, Search, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { useAuthContext } from "../../contexts/AuthContext";
import useVoice from "../../hooks/useVoice";
import { guardarCierreTurno } from "../../services/cierresTurno";
import type { EstadoPedido, PedidoResponse } from "../../types";
import {
  buildCierreTurno,
  ESTADO_META,
  FOCUS_VISIBLE_CLASS,
  formatCurrency,
  formatMetodoPago,
  formatTime,
  getPedidoSummary,
  getProductCount,
  getTurnoSummary,
  PedidoModal,
  readTurnoAbierto,
  setTurnoAbierto,
  setTurnoFechaInicio,
  StatusBadge,
  usePedidosController,
  type ActiveModal,
  type EstadoFilter
} from "./PedidosShared";

const FILTROS_FACILES: Array<{ label: string; value: EstadoFilter }> = [
  { label: "Pendientes", value: "pendiente" },
  { label: "En preparación", value: "en_preparacion" },
  { label: "Listos", value: "listo" },
  { label: "Todos", value: "todos" }
];

const ESTADOS_ACTIVOS: EstadoPedido[] = ["pendiente", "en_preparacion", "listo"];
const EASY_PRIMARY_BUTTON_CLASS = "border-slate-900 bg-slate-900 text-white hover:bg-black";
const EASY_SECONDARY_BUTTON_CLASS = "border-slate-300 bg-white text-slate-950 hover:border-slate-900 hover:bg-slate-50";
const EASY_SOFT_PANEL_CLASS = "border-slate-200 bg-slate-50";

function PedidosFacilPage() {
  const { isHighContrast, isPanelOpen, isVoiceEnabled, openAccessibilityPanel } = useAccessibilityContext();
  const { user } = useAuthContext();
  const { speak } = useVoice({ enabled: isVoiceEnabled });
  const [searchTerm, setSearchTerm] = useState("");
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [isSavingCierre, setIsSavingCierre] = useState(false);
  const [isTurnoOpen, setIsTurnoOpen] = useState(() => readTurnoAbierto());
  const [liveMessage, setLiveMessage] = useState("Pedidos activos listos para revisar.");
  const {
    activeModal,
    error,
    estadoFilter,
    filteredPedidos,
    handleEstadoChange,
    isLoading,
    loadPedidos,
    normalSummary,
    pedidos,
    setActiveModal,
    setEstadoFilter,
    updatingPedidoId
  } = usePedidosController({ searchTerm });
  const turnoSummary = useMemo(() => getTurnoSummary(pedidos), [pedidos]);
  const pedidosMostrados = useMemo(() => {
    if (estadoFilter === "todos") {
      return filteredPedidos.filter((pedido) => ESTADOS_ACTIVOS.includes(pedido.estado));
    }

    return filteredPedidos;
  }, [estadoFilter, filteredPedidos]);
  const pedidosActivos = normalSummary.pendientes + normalSummary.enPreparacion + normalSummary.listos;

  const pageBg = isHighContrast ? "bg-black text-white" : "bg-white text-slate-950";
  const panelClass = isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white";
  const hasPedidosActivos = turnoSummary.pedidosPendientes > 0;

  const handleAccessibleEstadoChange = async (pedido: PedidoResponse, estado: EstadoPedido) => {
    await handleEstadoChange(pedido, estado);
    const message = `Pedido ${pedido.id} actualizado a ${ESTADO_META[estado].label}.`;
    setLiveMessage(message);
    speak(message, {
      priority: "high",
      dedupeKey: `pedido-estado:${pedido.id}:${estado}`,
      cooldownMs: 1800,
      interrupt: true
    });
  };

  const handleRefreshPedidos = () => {
    const message = "Actualizando pedidos.";
    setLiveMessage(message);
    speak(message, {
      priority: "normal",
      dedupeKey: "pedidos-facil-refresh",
      cooldownMs: 1200
    });
    loadPedidos();
  };

  const handleFilterChange = (value: EstadoFilter, label: string) => {
    setEstadoFilter(value);
    setLiveMessage(`Filtro activo: ${label}.`);
  };

  const handleReadPedido = (pedido: PedidoResponse) => {
    const cliente = pedido.clienteNombre?.trim() || "Sin nombre";
    const message = [
      `Pedido ${pedido.id}`,
      `estado ${ESTADO_META[pedido.estado].label}`,
      `cliente ${cliente}`,
      `pago ${formatMetodoPago(pedido.metodoPago)}`,
      `total ${formatCurrency(pedido.total)}`,
      `productos ${getPedidoSummary(pedido)}`
    ].join(". ");

    setLiveMessage(message);
    speak(message, {
      priority: "high",
      dedupeKey: `leer-pedido:${pedido.id}:${pedido.estado}`,
      cooldownMs: 2200,
      interrupt: true
    });
  };

  const handleOpenCierre = () => {
    setIsCierreModalOpen(true);
    const message = hasPedidosActivos
      ? "Aún hay pedidos activos. Revisa antes de cerrar el turno."
      : "Puedes cerrar el turno. No hay pedidos activos.";
    setLiveMessage(message);
    speak(message, {
      priority: "high",
      dedupeKey: "pedidos-facil-cerrar-turno",
      cooldownMs: 2500,
      interrupt: true
    });
  };

  const handleCerrarTurno = async () => {
    try {
      setIsSavingCierre(true);
      const cierre = buildCierreTurno(pedidos, user);
      await guardarCierreTurno(cierre);
      const message = `Turno cerrado. Ventas entregadas ${formatCurrency(String(cierre.totalVendido))}.`;
      setIsCierreModalOpen(false);
      setTurnoAbierto(false);
      setIsTurnoOpen(false);
      setLiveMessage(message);
      speak(message, {
        priority: "high",
        dedupeKey: `pedidos-facil-turno-cerrado:${cierre.id}`,
        cooldownMs: 2500,
        interrupt: true
      });
      await loadPedidos();
    } catch (requestError) {
      setLiveMessage(requestError instanceof Error ? requestError.message : "No fue posible cerrar el turno.");
    } finally {
      setIsSavingCierre(false);
    }
  };

  const handleAbrirTurno = () => {
    const fechaInicio = new Date().toISOString();
    setTurnoAbierto(true);
    setTurnoFechaInicio(fechaInicio);
    setIsTurnoOpen(true);
    setLiveMessage("Turno abierto. Ya puedes registrar nuevos pedidos.");
    loadPedidos();
  };

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className={isHighContrast ? "border-b-2 border-yellow-400 bg-black text-white" : "border-b border-slate-700 bg-slate-900 text-white"}>
        <div className="mx-auto flex min-h-[84px] w-full max-w-[1520px] flex-wrap items-center justify-between gap-4 px-3 py-3 sm:px-4 lg:px-5 xl:px-6">
          <div>
            <p className={`text-sm font-black uppercase ${isHighContrast ? "text-yellow-300" : "text-slate-300"}`}>Modo fácil</p>
            <h1 className="mt-1 text-3xl font-black leading-none tracking-tight contrast-important">Pedidos activos</h1>
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
            <Link
              to="/pdv/facil"
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-5 text-lg font-black no-underline transition ${
                isHighContrast ? "contrast-button-primary" : "border-white bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <ClipboardPlus className="h-6 w-6" aria-hidden="true" />
              Crear nuevo pedido
            </Link>
            <button
              type="button"
              onClick={openAccessibilityPanel}
              aria-haspopup="dialog"
              aria-expanded={isPanelOpen}
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-5 text-lg font-black transition ${
                isHighContrast ? "contrast-button-secondary" : "border-white bg-white text-slate-950 hover:bg-slate-100"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <Accessibility className="h-6 w-6" aria-hidden="true" />
              Accesibilidad
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1520px] space-y-5 px-3 py-5 sm:px-4 lg:px-5 xl:px-6">
        <p className="sr-only" aria-live="polite">{liveMessage}</p>

        <section className={`rounded-[28px] p-5 sm:p-6 ${panelClass}`} aria-label="Resumen de pedidos activos">
          <div className="grid gap-4 lg:grid-cols-3">
            <SummaryCard isHighContrast={isHighContrast} label="Pedidos activos" value={String(pedidosActivos)} />
            <SummaryCard isHighContrast={isHighContrast} label="Ventas entregadas" value={formatCurrency(String(normalSummary.totalVendido))} />
            <SummaryCard isHighContrast={isHighContrast} label="Ventas pendientes" value={formatCurrency(String(normalSummary.totalPendiente))} />
          </div>
          <p className={`mt-4 rounded-2xl border px-4 py-3 text-lg font-black ${
            isHighContrast ? "border-yellow-400 text-yellow-200" : "border-slate-200 bg-slate-50 text-slate-900"
          }`}>
            Las ventas entregadas consideran solo pedidos finalizados.
          </p>
        </section>

        <section className={`grid gap-4 rounded-[28px] p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] ${panelClass}`} aria-label="Herramientas de pedidos">
          <label className="relative block">
            <span className="sr-only">Buscar pedido</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-700" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por número de pedido, producto o método de pago"
              className={`min-h-[56px] w-full rounded-2xl border-2 border-slate-300 bg-white py-3 pl-12 pr-4 text-lg font-black text-slate-950 outline-none placeholder:text-slate-600 focus:border-slate-900 ${FOCUS_VISIBLE_CLASS}`}
            />
          </label>

          <button
            type="button"
            onClick={isTurnoOpen ? handleOpenCierre : handleAbrirTurno}
            className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-5 text-lg font-black transition ${
              isHighContrast
                ? "contrast-button-secondary"
                : isTurnoOpen
                  ? "border-red-700 bg-red-700 text-white hover:bg-red-800"
                  : "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
            } ${FOCUS_VISIBLE_CLASS}`}
            aria-label={isTurnoOpen && hasPedidosActivos ? "Cerrar turno. Aún hay pedidos activos." : isTurnoOpen ? "Cerrar turno" : "Abrir turno"}
          >
            <Check className="h-6 w-6" aria-hidden="true" />
            {isTurnoOpen ? "Cerrar turno" : "Abrir turno"}
          </button>

          <button
            type="button"
            onClick={handleRefreshPedidos}
            disabled={isLoading}
            className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-5 text-lg font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isHighContrast ? "contrast-button-secondary" : "border-slate-900 bg-slate-900 text-white hover:bg-black"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            <RefreshCw className={`h-6 w-6 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            Actualizar
          </button>
        </section>

        {hasPedidosActivos && (
          <div className={`flex items-start gap-3 rounded-3xl border-2 p-5 text-lg font-black ${
            isHighContrast ? "border-yellow-400 bg-black text-yellow-200" : "border-slate-300 bg-slate-50 text-slate-950"
          }`} role="status">
            <AlertTriangle className="mt-1 h-6 w-6 shrink-0" aria-hidden="true" />
            <p>Aún hay pedidos activos. Revisa antes de cerrar el turno.</p>
          </div>
        )}

        <section className={`rounded-[28px] p-4 ${panelClass}`} aria-label="Filtros por estado">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {FILTROS_FACILES.map((option) => {
              const isActive = estadoFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFilterChange(option.value, option.label)}
                  aria-pressed={isActive}
                  className={`min-h-[56px] rounded-2xl border-2 px-5 text-lg font-black transition ${
                    isHighContrast
                      ? isActive
                        ? "contrast-button-primary"
                        : "contrast-button-secondary"
                      : isActive
                        ? EASY_PRIMARY_BUTTON_CLASS
                        : EASY_SECONDARY_BUTTON_CLASS
                  } ${FOCUS_VISIBLE_CLASS}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <div className={`flex items-start gap-3 rounded-2xl border p-5 text-lg font-black ${isHighContrast ? "contrast-panel" : "border-red-300 bg-red-50 text-red-950"}`} role="alert">
            <AlertTriangle className="mt-1 h-6 w-6" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className={`flex min-h-[280px] items-center justify-center rounded-[28px] ${panelClass}`}>
            <LoaderCircle className="h-9 w-9 animate-spin" aria-hidden="true" />
            <span className="ml-3 text-2xl font-black">Cargando pedidos...</span>
          </div>
        ) : (
          <AccessiblePedidosList
            isHighContrast={isHighContrast}
            onOpenModal={setActiveModal}
            onReadPedido={handleReadPedido}
            pedidos={pedidosMostrados}
            updatingPedidoId={updatingPedidoId}
          />
        )}

        {activeModal && (
          <PedidoModal
            activeModal={activeModal}
            isUpdating={updatingPedidoId === activeModal.pedido.id}
            onClose={() => setActiveModal(null)}
            onEstadoChange={handleAccessibleEstadoChange}
            onOpenModal={setActiveModal}
          />
        )}

        {isCierreModalOpen && (
          <CierreFacilModal
            hasPedidosActivos={hasPedidosActivos}
            isHighContrast={isHighContrast}
            isSaving={isSavingCierre}
            onClose={() => setIsCierreModalOpen(false)}
            onConfirm={handleCerrarTurno}
            summary={turnoSummary}
          />
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  isHighContrast,
  label,
  value
}: {
  isHighContrast: boolean;
  label: string;
  value: string;
}) {
  return (
    <article className={`rounded-3xl p-5 ${isHighContrast ? "contrast-panel-soft border-2 border-yellow-400" : `border-2 ${EASY_SOFT_PANEL_CLASS}`}`}>
      <p className="text-xl font-black text-slate-700">{label}</p>
      <p className="mt-3 text-4xl font-black leading-none text-slate-950">{value}</p>
    </article>
  );
}

function AccessiblePedidosList({
  isHighContrast,
  onOpenModal,
  onReadPedido,
  pedidos,
  updatingPedidoId
}: {
  isHighContrast: boolean;
  onOpenModal: (modal: ActiveModal) => void;
  onReadPedido: (pedido: PedidoResponse) => void;
  pedidos: PedidoResponse[];
  updatingPedidoId: number | null;
}) {
  if (pedidos.length === 0) {
    return (
      <div className={`rounded-[28px] p-8 text-center ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}>
        <p className="text-3xl font-black text-slate-950">No hay pedidos activos</p>
        <p className="mx-auto mt-4 max-w-3xl text-xl font-bold leading-relaxed text-slate-700">
          Cuando registres un pedido, aparecerá aquí para su seguimiento.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-5" aria-label="Lista de pedidos activos">
      {pedidos.map((pedido) => (
        <AccessiblePedidoCard
          key={pedido.id}
          isHighContrast={isHighContrast}
          isUpdating={updatingPedidoId === pedido.id}
          onOpenModal={onOpenModal}
          onReadPedido={onReadPedido}
          pedido={pedido}
        />
      ))}
    </section>
  );
}

function AccessiblePedidoCard({
  isHighContrast,
  isUpdating,
  onOpenModal,
  onReadPedido,
  pedido
}: {
  isHighContrast: boolean;
  isUpdating: boolean;
  onOpenModal: (modal: ActiveModal) => void;
  onReadPedido: (pedido: PedidoResponse) => void;
  pedido: PedidoResponse;
}) {
  const cliente = pedido.clienteNombre?.trim() || "Sin nombre";

  return (
    <article
      className={`rounded-[28px] p-5 sm:p-6 ${
        isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"
      }`}
      aria-label={`Pedido ${pedido.id}. Estado ${ESTADO_META[pedido.estado].label}. Cliente ${cliente}.`}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-black text-slate-950">Pedido #{pedido.id}</p>
              <p className="mt-2 text-xl font-black text-slate-700">Hora: {formatTime(pedido.createdAt)}</p>
            </div>
            <StatusBadge estado={pedido.estado} isLarge />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PedidoInfoBox label="Cliente" value={cliente} />
            <PedidoInfoBox label="Pago" value={formatMetodoPago(pedido.metodoPago)} />
            <PedidoInfoBox label="Total" value={formatCurrency(pedido.total)} />
          </div>

          <div className={`mt-5 rounded-3xl border-2 p-5 ${isHighContrast ? "border-yellow-400" : EASY_SOFT_PANEL_CLASS}`}>
            <p className="text-sm font-black uppercase text-slate-600">Productos</p>
            <p className="mt-2 text-2xl font-black leading-snug text-slate-950">{getPedidoSummary(pedido)}</p>
            <p className="mt-2 text-lg font-bold text-slate-700">{getProductCount(pedido)} productos en el pedido</p>
          </div>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => onReadPedido(pedido)}
            className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-black transition ${
              isHighContrast ? "contrast-button-secondary" : EASY_SECONDARY_BUTTON_CLASS
            } ${FOCUS_VISIBLE_CLASS}`}
            aria-label={`Leer pedido ${pedido.id}`}
          >
            <Volume2 className="h-6 w-6" aria-hidden="true" />
            Leer pedido
          </button>
          <button
            type="button"
            onClick={() => onOpenModal({ action: "detail", pedido })}
            className={`min-h-[56px] rounded-2xl border-2 px-4 text-lg font-black transition ${
              isHighContrast ? "contrast-button-secondary" : EASY_SECONDARY_BUTTON_CLASS
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            Ver detalle
          </button>
          <button
            type="button"
            onClick={() => onOpenModal({ action: "state", pedido })}
            disabled={isUpdating || pedido.estado === "entregado" || pedido.estado === "cancelado"}
            className={`min-h-[56px] rounded-2xl border-2 px-4 text-lg font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isHighContrast ? "contrast-button-primary" : EASY_PRIMARY_BUTTON_CLASS
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            Cambiar estado
          </button>
        </div>
      </div>
    </article>
  );
}

function PedidoInfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3">
      <p className="text-sm font-black uppercase text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function CierreFacilModal({
  hasPedidosActivos,
  isHighContrast,
  isSaving,
  onClose,
  onConfirm,
  summary
}: {
  hasPedidosActivos: boolean;
  isHighContrast: boolean;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
  summary: ReturnType<typeof getTurnoSummary>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cierre-facil-title"
        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] p-6 shadow-2xl ${
          isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"
        }`}
      >
        <h2 id="cierre-facil-title" className="text-3xl font-black text-slate-950">Cerrar turno</h2>
        <p className="mt-3 text-xl font-bold leading-relaxed text-slate-700">
          Se guardará el resumen del turno para revisar después en historial.
        </p>

        {hasPedidosActivos && (
          <div className={`mt-5 flex items-start gap-3 rounded-3xl border-2 p-5 text-lg font-black ${
            isHighContrast ? "border-yellow-400 text-yellow-200" : "border-slate-300 bg-slate-50 text-slate-950"
          }`} role="alert">
            <AlertTriangle className="mt-1 h-6 w-6 shrink-0" aria-hidden="true" />
            <p>Aún hay pedidos activos. Revisa antes de cerrar el turno.</p>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <PedidoInfoBox label="Activos" value={String(summary.pedidosPendientes)} />
          <PedidoInfoBox label="Entregados" value={String(summary.pedidosEntregados)} />
          <PedidoInfoBox label="Vendido" value={formatCurrency(String(summary.totalVendido))} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[56px] rounded-2xl border-2 px-5 text-lg font-black transition ${
              isHighContrast ? "contrast-button-secondary" : EASY_SECONDARY_BUTTON_CLASS
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className={`min-h-[56px] rounded-2xl border-2 px-5 text-lg font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isHighContrast ? "contrast-button-primary" : "border-red-700 bg-red-700 text-white hover:bg-red-800"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isSaving ? "Guardando..." : "Sí, cerrar turno"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default PedidosFacilPage;
