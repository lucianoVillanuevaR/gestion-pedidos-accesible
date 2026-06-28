import { FOCUS_VISIBLE_CLASS } from "../../../constants/ui";
import {
  StatusBadge,
  formatCurrency as formatKitchenCurrency,
  formatDateTime as formatKitchenDateTime,
  formatMetodoPago as formatMetodoPagoLabel,
  getPedidoDisplayNumber
} from "../../pedidos/PedidosShared";
import type { HistorialPedidoDetalle } from "../cocinaHistoryUtils";

export function HistorialPedidoModal({ onClose, pedido }: { onClose: () => void; pedido: HistorialPedidoDetalle }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="historial-pedido-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[26px] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="historial-pedido-title" className="text-2xl font-black text-slate-950">
              Pedido #{getPedidoDisplayNumber(pedido)}
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Turno cerrado: {formatKitchenDateTime(pedido.fechaCierre)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
          >
            Volver
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge estado={pedido.estado} />
            <span className="font-bold text-slate-600">
              {pedido.createdAt ? formatKitchenDateTime(pedido.createdAt) : "Sin fecha"}
            </span>
            <span className="font-bold text-slate-600">{formatMetodoPagoLabel(pedido.metodoPago)}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Cajero</p>
              <p className="mt-1 text-lg font-black text-slate-950">{pedido.cajero ?? "No identificado"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Método de pago</p>
              <p className="mt-1 text-lg font-black text-slate-950">{formatMetodoPagoLabel(pedido.metodoPago)}</p>
            </div>
          </div>
          {pedido.clienteNombre && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Cliente</p>
              <p className="mt-1 text-lg font-black text-slate-950">{pedido.clienteNombre}</p>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200">
            {pedido.detalles.map((detalle) => (
              <div
                key={`${pedido.turnoId}-${pedido.id}-${detalle.productoId}-${detalle.productoNombre}`}
                className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0"
              >
                <div>
                  <p className="font-black text-slate-950">
                    {detalle.cantidad}x {detalle.productoNombre}
                  </p>
                  <p className="text-sm font-bold text-slate-500">
                    {formatKitchenCurrency(String(detalle.precioUnitario))} c/u
                  </p>
                </div>
                <p className="font-black text-slate-950">{formatKitchenCurrency(String(detalle.subtotal))}</p>
              </div>
            ))}
          </div>
          {pedido.observacion && (
            <p className="rounded-2xl border border-yellow-100 bg-[#FFF8DC] p-4 font-bold text-slate-700">
              {pedido.observacion}
            </p>
          )}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase text-slate-500">Historial de estado</p>
            <p className="mt-1 font-bold text-slate-600">No hay historial de cambios disponible para este pedido.</p>
          </div>
          <p className="text-right text-2xl font-black text-slate-950">
            Total {formatKitchenCurrency(String(pedido.total))}
          </p>
        </div>
      </section>
    </div>
  );
}
