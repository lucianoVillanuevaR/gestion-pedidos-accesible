import { CalendarDays, LockKeyhole, UnlockKeyhole, User } from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH, sanitizeClienteNombreInput } from "../../validations/pedido.validation";
import { formatCurrency, getPaymentLabel } from "../../utils/pdv";
import ConfirmDialog from "./ConfirmDialog";
import PdvCatalogPanel from "./PdvCatalogPanel";
import PdvFeedbackMessage from "./PdvFeedbackMessage";
import PdvOrderSummary from "./PdvOrderSummary";
import PdvPaymentSection from "./PdvPaymentSection";
import PdvReceiptActions from "./PdvReceiptActions";
import { usePdvViewContext } from "./PdvViewContext";

function PdvNormalView() {
  const { user } = useAuthContext();
  const [showOpenTurnoConfirm, setShowOpenTurnoConfirm] = useState(false);
  const [showCloseTurnoConfirm, setShowCloseTurnoConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const {
    feedback,
    feedbackRef,
    handleSubmit,
    handleToggleTurno,
    isHighContrast,
    isTurnoOpen,
    clienteNombre,
    metodoPago,
    nextPedidoNumber,
    puedeRegistrar,
    quickActionButtonClass,
    resetPedido,
    sending,
    setClienteNombre,
    setShowResetConfirm,
    showResetConfirm,
    total,
    totalItems
  } = usePdvViewContext();

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
  const isCloseTurnoBlockedFeedback =
    feedback?.type === "error" &&
    feedback.message.startsWith("No puedes cerrar el turno mientras existan pedidos activos");

  const handleTurnoButtonClick = () => {
    if (isTurnoOpen) {
      setShowCloseTurnoConfirm(true);
      return;
    }

    setShowOpenTurnoConfirm(true);
  };

  const handleConfirmOpenTurno = () => {
    setShowOpenTurnoConfirm(false);
    handleToggleTurno();
  };

  const handleConfirmCloseTurno = () => {
    setShowCloseTurnoConfirm(false);
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
      <PdvCatalogPanel />

      <aside className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white print:static print:block print:min-h-0 print:border-0 print:bg-transparent">
        <div className="bg-[#FECE00] text-slate-950 no-print print:hidden">
          <div className="flex min-h-[42px] items-center justify-between gap-2 px-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-2xl font-light leading-none">#{nextPedidoNumber}</span>
              <span className="rounded-full border border-white/70 px-2 py-0.5 text-xs font-bold">En el local</span>
              <span className="text-sm font-bold">{getPaymentLabel(metodoPago)}</span>
            </div>
            <button
              type="button"
              onClick={handleTurnoButtonClick}
              className={`inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full border px-3 text-xs font-black transition ${
                isTurnoOpen
                  ? "border-red-800 bg-red-700 text-white hover:bg-red-800"
                  : "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
              } ${isHighContrast ? (isTurnoOpen ? "contrast-button-danger" : "contrast-button-primary") : ""}`}
              aria-pressed={isTurnoOpen}
              aria-label={isTurnoOpen ? "Cerrar turno" : "Abrir turno"}
              title={isTurnoOpen ? "Cerrar turno" : "Abrir turno"}
            >
              {isTurnoOpen ? (
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              ) : (
                <UnlockKeyhole className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isTurnoOpen ? "Cerrar turno" : "Abrir turno"}</span>
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-yellow-300 bg-yellow-50 px-4 py-1 text-xs font-bold text-slate-700">
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
              aria-label="Nombre del cliente"
              aria-required="true"
              required
              value={clienteNombre}
              maxLength={PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH}
              onChange={(event) => setClienteNombre(sanitizeClienteNombreInput(event.target.value))}
              placeholder="Nombre del cliente (obligatorio)"
              className="h-14 border-0 border-l border-[#FECE00] bg-yellow-50 px-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-yellow-300"
            />
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-400 px-3 py-3 text-sm font-bold text-white no-print print:hidden">
          Productos del pedido
        </div>

        <PdvReceiptActions />

        {showResetConfirm && (
          <div
            className={`mx-3 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 no-print print:hidden ${isHighContrast ? "contrast-panel-soft" : "border-red-200 bg-red-50"}`}
          >
            <p className="font-bold text-sm">¿Está seguro de borrar el pedido?</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={resetPedido}
                className={`rounded-lg border px-4 py-2 font-bold transition ${
                  isHighContrast ? "contrast-button-danger" : "border-red-800 bg-red-700 text-white hover:bg-red-800"
                }`}
              >
                Sí, borrar
              </button>
              <button type="button" onClick={() => setShowResetConfirm(false)} className={quickActionButtonClass}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {feedback && !isCloseTurnoBlockedFeedback && (
          <div ref={feedbackRef} tabIndex={-1} className="mx-3 mt-3 min-w-0 outline-none">
            <PdvFeedbackMessage feedback={feedback} isHighContrast={isHighContrast} className="w-full" />
          </div>
        )}

        <PdvOrderSummary />

        <PdvPaymentSection onAccept={handleAcceptClick} />
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

      {showCloseTurnoConfirm && (
        <ConfirmDialog
          title="Confirmar cierre de turno"
          description="¿Seguro que deseas cerrar el turno? No podrás registrar pedidos hasta abrir uno nuevo."
          primaryLabel="Sí, cerrar turno"
          onCancel={() => setShowCloseTurnoConfirm(false)}
          onConfirm={handleConfirmCloseTurno}
        />
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
            <p>
              {totalItems} {totalItems === 1 ? "producto" : "productos"}
            </p>
            <p className="mt-1 text-xl font-black text-slate-950">{formatCurrency(total)}</p>
            <p className="mt-1">Pago: {getPaymentLabel(metodoPago)}</p>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}

export default PdvNormalView;
