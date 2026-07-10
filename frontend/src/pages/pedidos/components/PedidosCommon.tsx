import { ClipboardPlus } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAccessibilityContext } from "../../../contexts/AccessibilityContext";
import { FOCUS_VISIBLE_CLASS } from "../../../constants/ui";
import type { EstadoPedido, PedidoDetalleResponse, PedidoResponse } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import {
  ESTADO_META,
  getAllowedEstadoOptions,
  type ActiveModal,
  type PedidoModalState
} from "../constants/pedidosConstants";
import { formatMetodoPago, formatTime, getItemName, getPedidoDisplayNumber } from "../utils/pedidosUtils";

export function StatusBadge({ estado, isLarge = false }: { estado: EstadoPedido; isLarge?: boolean }) {
  const meta = ESTADO_META[estado];

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border font-black ${meta.className} ${
        isLarge ? "border-2 px-5 py-3 text-xl" : "px-3 py-1.5 text-xs uppercase"
      }`}
    >
      {meta.label}
    </span>
  );
}

function ModalShell({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  const { isAccessible, isHighContrast } = useAccessibilityContext();
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl sm:p-6 ${
          isHighContrast
            ? "contrast-panel border-2 border-yellow-400"
            : isAccessible
              ? "border-2 border-slate-900"
              : "border border-slate-200"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            ref={titleRef}
            id={titleId}
            tabIndex={-1}
            className={`font-black text-slate-950 outline-none ${isAccessible ? "text-3xl" : ""}`}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center justify-center rounded-xl border px-4 font-black transition hover:bg-slate-100 ${
              isAccessible
                ? "min-h-[56px] border-2 border-slate-900 text-lg text-slate-950"
                : "min-h-[44px] border-slate-300 text-slate-700"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            Volver
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

export function PedidoModal({
  activeModal,
  isUpdating,
  onClose,
  onEstadoChange,
  onOpenModal
}: {
  activeModal: PedidoModalState;
  isUpdating: boolean;
  onClose: () => void;
  onEstadoChange: (pedido: PedidoResponse, estado: EstadoPedido) => void;
  onOpenModal: (modal: ActiveModal) => void;
}) {
  const { isAccessible } = useAccessibilityContext();
  const { action, pedido } = activeModal;

  if (action === "detail") {
    return (
      <ModalShell onClose={onClose} title={`Pedido #${getPedidoDisplayNumber(pedido)}`}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge estado={pedido.estado} />
            <span className="font-bold text-slate-600">{formatTime(pedido.createdAt)}</span>
            <span className="font-bold text-slate-600">{formatMetodoPago(pedido.metodoPago)}</span>
          </div>
          {pedido.clienteNombre && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Cliente</p>
              <p className="mt-1 text-lg font-black text-slate-950">{pedido.clienteNombre}</p>
            </div>
          )}
          <div className="space-y-3">
            {(pedido.detalles ?? []).map((detalle) => (
              <div key={detalle.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-black leading-snug text-slate-950">
                      {detalle.cantidad}x {getItemName(detalle)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {formatCurrency(detalle.precioUnitario)} c/u
                    </p>
                  </div>
                  <p className="shrink-0 font-black text-slate-950">{formatCurrency(detalle.subtotal)}</p>
                </div>
                <DetalleSeleccion detalle={detalle} isAccessible={isAccessible} />
              </div>
            ))}
          </div>
          {pedido.observacion && (
            <div className="rounded-2xl border-2 border-yellow-300 bg-[#FFF8DC] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-yellow-900">Observación del pedido</p>
              <p className="mt-1 font-bold leading-relaxed text-slate-900">{pedido.observacion}</p>
            </div>
          )}
          <p className="text-right text-2xl font-black text-slate-950">Total {formatCurrency(pedido.total)}</p>
        </div>
      </ModalShell>
    );
  }

  if (action === "history") {
    return (
      <ModalShell onClose={onClose} title={`Historial del pedido #${getPedidoDisplayNumber(pedido)}`}>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-black text-slate-950">Historial no disponible</p>
          <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600">
            Este proyecto todavía no tiene un endpoint o registro real de cambios de estado. Cuando exista, aquí se
            podrá mostrar estado anterior, estado nuevo, hora del cambio y usuario responsable.
          </p>
        </div>
      </ModalShell>
    );
  }

  if (action === "state") {
    const allowedOptions = getAllowedEstadoOptions(pedido.estado);
    const unavailableMessage =
      pedido.estado === "entregado"
        ? "Pedido finalizado"
        : pedido.estado === "cancelado"
          ? "Pedido cancelado"
          : "Este pedido no tiene cambios de estado disponibles.";

    return (
      <ModalShell onClose={onClose} title={`Cambiar estado del pedido #${getPedidoDisplayNumber(pedido)}`}>
        <div className="grid gap-3">
          <p className="text-lg font-bold text-slate-700">Elige la siguiente acción disponible.</p>
          {allowedOptions.length === 0 && (
            <p className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-5 text-lg font-black text-slate-700">
              {unavailableMessage}
            </p>
          )}
          {allowedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (option.value === "entregado") {
                  onOpenModal({ action: "finish", pedido });
                  return;
                }

                if (option.value === "cancelado") {
                  onOpenModal({ action: "cancel", pedido });
                  return;
                }

                onEstadoChange(pedido, option.value);
              }}
              disabled={isUpdating}
              className={`min-h-[64px] rounded-2xl border-2 border-slate-900 bg-white px-5 text-left text-lg font-black text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
            >
              {isUpdating ? "Actualizando..." : option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[64px] rounded-2xl border-2 border-slate-900 bg-slate-100 px-5 text-lg font-black text-slate-900 transition hover:bg-slate-200 ${FOCUS_VISIBLE_CLASS}`}
          >
            Volver
          </button>
        </div>
      </ModalShell>
    );
  }

  const isFinish = action === "finish";

  return (
    <ModalShell
      onClose={onClose}
      title={
        isFinish
          ? `Marcar pedido #${getPedidoDisplayNumber(pedido)} como entregado`
          : `Cancelar pedido #${getPedidoDisplayNumber(pedido)}`
      }
    >
      <div className="space-y-5">
        <p className="text-xl font-black text-slate-950">
          {isFinish ? "¿Deseas marcar este pedido como entregado?" : "¿Deseas cancelar este pedido?"}
        </p>
        <p className="font-bold text-slate-600">
          {isFinish
            ? "Confirma solo si el pedido ya fue entregado al cliente."
            : "Esta acción cambiará el estado del pedido a cancelado."}
        </p>
        <p className="font-bold text-slate-600">
          Pedido #{getPedidoDisplayNumber(pedido)} · {formatCurrency(pedido.total)}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[62px] rounded-2xl border border-slate-300 bg-white px-5 text-lg font-black text-slate-900 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
          >
            {isFinish ? "Cancelar" : "No cancelar"}
          </button>
          <button
            type="button"
            onClick={() => onEstadoChange(pedido, isFinish ? "entregado" : "cancelado")}
            disabled={isUpdating}
            className={`min-h-[62px] rounded-2xl border px-5 text-lg font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isFinish
                ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                : "border-red-800 bg-red-700 text-white hover:bg-red-800"
            } ${FOCUS_VISIBLE_CLASS}`}
          >
            {isUpdating ? "Guardando..." : isFinish ? "Marcar entregado" : "Cancelar pedido"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function DetalleSeleccion({ detalle, isAccessible }: { detalle: PedidoDetalleResponse; isAccessible: boolean }) {
  const aderezos = detalle.personalizacion?.aderezos ?? [];
  const comentario = detalle.personalizacion?.comentario?.trim();
  const combinacion = detalle.personalizacion?.combinacion?.nombre;
  const variante = detalle.variante?.nombre;

  if (!variante && !combinacion && aderezos.length === 0 && !comentario) return null;

  const varianteNormalizada = variante?.toLocaleLowerCase("es") ?? "";
  const esTipoCarne = ["churrasco", "pollo", "lomito", "mechada", "ave", "lomo"].some((carne) =>
    varianteNormalizada.includes(carne)
  );

  return (
    <div className={`mt-2 space-y-2 ${isAccessible ? "text-lg" : "text-sm"}`}>
      {variante && (
        <p className="w-fit rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 font-black text-slate-900">
          {esTipoCarne ? "Carne" : "Opción"}: {variante}
        </p>
      )}
      {combinacion && <p className="font-bold text-slate-700">Combinación: {combinacion}</p>}
      {aderezos.length > 0 && (
        <p className="font-bold leading-relaxed text-slate-700">
          <span className="font-black">Aderezos:</span> {aderezos.join(", ")}
        </p>
      )}
      {comentario && (
        <div className="rounded-xl border-2 border-yellow-300 bg-[#FFF8DC] px-3 py-2.5 text-slate-950">
          <p className="text-xs font-black uppercase tracking-wide text-yellow-950">Comentario para cocina</p>
          <p className="mt-1 font-black leading-relaxed">{comentario}</p>
        </div>
      )}
    </div>
  );
}

export function EmptyPedidosMessage({ isAccessible = false }: { isAccessible?: boolean }) {
  return (
    <div
      className={`rounded-[26px] bg-white p-8 sm:p-10 ${
        isAccessible ? "border-2 border-slate-900" : "border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
      }`}
    >
      <div className="mx-auto max-w-2xl text-center">
        <div
          className={`mx-auto flex items-center justify-center rounded-2xl border text-slate-950 ${
            isAccessible ? "h-20 w-20 border-2 border-slate-900 bg-white" : "h-14 w-14 border-yellow-200 bg-[#FFF8DC]"
          }`}
        >
          <ClipboardPlus className={isAccessible ? "h-10 w-10" : "h-7 w-7"} aria-hidden="true" />
        </div>
        <p className={`mt-5 font-black text-slate-950 ${isAccessible ? "text-4xl" : "text-2xl"}`}>
          {isAccessible ? "No hay pedidos en este estado" : "No hay pedidos activos"}
        </p>
        <p className={`mt-3 text-slate-600 ${isAccessible ? "text-xl" : "text-base"}`}>
          {isAccessible
            ? "Cuando registres un pedido desde Punto de Venta, aparecerá aquí para su seguimiento."
            : "Cuando se registre un nuevo pedido desde caja, aparecerá aquí para su seguimiento."}
        </p>
        <Link
          to="/pdv"
          className={`mt-6 inline-flex items-center justify-center rounded-2xl border border-slate-900 bg-slate-900 px-5 font-black text-white no-underline transition hover:bg-black ${
            isAccessible ? "min-h-[72px] border-2 px-7 text-xl" : "min-h-[50px] text-sm"
          } ${FOCUS_VISIBLE_CLASS}`}
        >
          {isAccessible ? "Ir a Nuevo Pedido" : "Crear nuevo pedido"}
        </Link>
      </div>
    </div>
  );
}
