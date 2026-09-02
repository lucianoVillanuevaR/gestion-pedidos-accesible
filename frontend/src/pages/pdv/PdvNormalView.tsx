import { CalendarDays, LockKeyhole, UnlockKeyhole, User } from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH,
  sanitizeClienteNombreInput,
} from "../../validations/pedido.validation";
import { formatCurrency, getPaymentLabel } from "../../utils/pdv";
import ConfirmDialog from "./components/ConfirmDialog";
import PdvCatalogPanel from "./components/PdvCatalogPanel";
import PdvFeedbackMessage from "./components/PdvFeedbackMessage";
import PdvOrderSummary from "./components/PdvOrderSummary";
import PdvPaymentSection from "./components/PdvPaymentSection";
import PdvReceiptActions from "./components/PdvReceiptActions";
import { usePdvViewContext } from "./PdvViewContext";

function TurnoDialogDetails({
  cashierLabel,
  dateLabel,
  dateValue,
}: {
  cashierLabel: string;
  dateLabel: string;
  dateValue: string;
}) {
  const { user } = useAuthContext();

  return (
    <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
      <div className="flex items-center justify-between gap-3">
        <span>{cashierLabel}</span>
        <span className="font-black text-slate-950">
          {user?.label ?? "Sin usuario"}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>{dateLabel}</span>
        <span className="font-black text-slate-950">{dateValue}</span>
      </div>
    </div>
  );
}

function PdvNormalView() {
  const [showOpenTurnoConfirm, setShowOpenTurnoConfirm] = useState(false);
  const [showCloseTurnoConfirm, setShowCloseTurnoConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const {
    feedback,
    feedbackRef,
    handleSubmit,
    handleToggleTurno,
    isHighContrast,
    isEditingPedido,
    editingPedidoNumber,
    isTurnoOpen,
    isTurnoUpdating,
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
    totalItems,
  } = usePdvViewContext();

  const orderDate = new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  const fullDate = new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const isCloseTurnoBlockedFeedback =
    feedback?.type === "error" &&
    feedback.message.startsWith(
      "No puedes cerrar el turno mientras existan pedidos activos",
    );

  const handleTurnoButtonClick = () => {
    if (isTurnoUpdating) return;
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
    <div className="grid h-[calc(100dvh-56px)] min-h-0 overflow-hidden bg-slate-100 print:block md:grid-cols-[162px_minmax(0,1fr)] xl:grid-cols-[162px_minmax(0,1fr)_400px] 2xl:grid-cols-[162px_minmax(0,1fr)_430px]">
      <PdvCatalogPanel />

      <aside className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white print:static print:block print:min-h-0 print:border-0 print:bg-transparent">
        <div className="bg-[#FECE00] text-slate-950 no-print print:hidden">
          <div className="flex min-h-[42px] items-center justify-between gap-2 px-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-2xl font-light leading-none">
                #{editingPedidoNumber ?? nextPedidoNumber}
              </span>
              <span className="rounded-full border border-white/70 px-2 py-0.5 text-xs font-bold">
                En el local
              </span>
              {isEditingPedido && (
                <span className="text-sm font-black">Modificando pedido</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleTurnoButtonClick}
              disabled={isTurnoUpdating}
              className={`inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full border px-3 text-xs font-black transition ${
                isTurnoOpen
                  ? "border-red-800 bg-red-700 text-white hover:bg-red-800"
                  : "border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-800"
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
              <span>
                {isTurnoUpdating
                  ? "Procesando..."
                  : isTurnoOpen
                    ? "Cerrar turno"
                    : "Abrir turno"}
              </span>
            </button>
          </div>
          <div className="flex items-center justify-end border-t border-yellow-300 bg-yellow-50 px-4 py-1 text-xs font-bold text-slate-700">
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
              onChange={(event) =>
                setClienteNombre(sanitizeClienteNombreInput(event.target.value))
              }
              placeholder="Nombre del cliente (obligatorio)"
              className="h-14 border-0 border-l border-[#FECE00] bg-yellow-50 px-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-yellow-300"
            />
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-700 px-3 py-3 text-sm font-bold text-white no-print print:hidden">
          Productos del pedido
        </div>

        <PdvReceiptActions />

        {showResetConfirm && (
          <div
            className={`mx-3 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 no-print print:hidden ${isHighContrast ? "contrast-panel-soft" : "border-red-200 bg-red-50"}`}
          >
            <p className="font-bold text-sm">
              ¿Está seguro de borrar el pedido?
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={resetPedido}
                className={`rounded-lg border px-4 py-2 font-bold transition ${
                  isHighContrast
                    ? "contrast-button-danger"
                    : "border-red-800 bg-red-700 text-white hover:bg-red-800"
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

        {feedback && !isCloseTurnoBlockedFeedback && (
          <div
            ref={feedbackRef}
            tabIndex={-1}
            className="mx-3 mt-3 min-w-0 outline-none"
          >
            <PdvFeedbackMessage
              feedback={feedback}
              isHighContrast={isHighContrast}
              className="w-full"
            />
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
          primaryDisabled={isTurnoUpdating}
        >
          <TurnoDialogDetails
            cashierLabel="Cajero actual"
            dateLabel="Fecha y hora"
            dateValue={fullDate}
          />
        </ConfirmDialog>
      )}

      {showCloseTurnoConfirm && (
        <ConfirmDialog
          title="Cerrar turno"
          description="Al cerrar el turno no podrás registrar pedidos hasta abrir uno nuevo."
          primaryLabel="Cerrar turno"
          onCancel={() => setShowCloseTurnoConfirm(false)}
          onConfirm={handleConfirmCloseTurno}
          primaryDisabled={isTurnoUpdating}
        >
          <TurnoDialogDetails
            cashierLabel="Cajero que cierra"
            dateLabel="Fecha y hora de cierre"
            dateValue={fullDate}
          />
        </ConfirmDialog>
      )}

      {showSubmitConfirm && (
        <ConfirmDialog
          title={isEditingPedido ? "Guardar cambios" : "Registrar pedido"}
          description={
            isEditingPedido
              ? "¿Deseas guardar los cambios de este pedido?"
              : "¿Deseas registrar este pedido?"
          }
          primaryLabel={
            sending
              ? isEditingPedido
                ? "Guardando..."
                : "Registrando..."
              : isEditingPedido
                ? "Guardar cambios"
                : "Aceptar pedido"
          }
          onCancel={() => setShowSubmitConfirm(false)}
          onConfirm={handleConfirmSubmit}
          primaryDisabled={sending}
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
            <p>
              {totalItems} {totalItems === 1 ? "producto" : "productos"}
            </p>
            <p className="mt-1 text-xl font-black text-slate-950">
              {formatCurrency(total)}
            </p>
            <p className="mt-1">Pago: {getPaymentLabel(metodoPago)}</p>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}

export default PdvNormalView;
