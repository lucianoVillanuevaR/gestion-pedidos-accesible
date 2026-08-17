import { Eye, Printer } from "lucide-react";
import { FOCUS_VISIBLE_CLASS } from "../../../constants/ui";
import type { CierreTurno } from "../../../types";
import { getResponsableDisplay } from "../../../utils/turnoResponsable";
import {
  StatusBadge,
  formatCurrency as formatKitchenCurrency,
  formatDateTime as formatKitchenDateTime,
  formatMetodoPago as formatMetodoPagoLabel,
  formatTime,
  getPedidoDisplayNumber
} from "../../pedidos/PedidosShared";
import CierreTurnoPrintable from "../../pedidos/components/CierreTurnoPrintable";
import {
  countTurnoPedidosByEstado,
  countTurnoPedidosPendientes,
  getTurnoProductosVendidos,
  type HistorialPedidoDetalle,
  type HistorialTurno
} from "../cocinaHistoryUtils";

export function HistorialTurnoCard({
  isExpanded,
  isHighContrast,
  isPrintTarget,
  onOpenModal,
  onPrint,
  onReadAction,
  onToggle,
  printTurno,
  selectedView,
  turno
}: {
  isExpanded: boolean;
  isHighContrast: boolean;
  isPrintTarget: boolean;
  onOpenModal: (pedido: HistorialPedidoDetalle) => void;
  onPrint: (turnoId: string) => void;
  onReadAction: (message: string, dedupeKey: string) => void;
  onToggle: (view: "pedidos" | "resumen") => void;
  printTurno: HistorialTurno;
  selectedView: "pedidos" | "resumen";
  turno: HistorialTurno;
}) {
  const productosVendidos = getTurnoProductosVendidos(turno);
  const pedidosEntregados = turno.pedidosEntregados ?? countTurnoPedidosByEstado(turno, "entregado");
  const pedidosPendientes = turno.pedidosPendientes ?? countTurnoPedidosPendientes(turno);
  const pedidosCancelados = turno.pedidosCancelados ?? countTurnoPedidosByEstado(turno, "cancelado");
  const responsable = getResponsableDisplay(turno.usuario, turno.usuarioId);
  const printResponsable = getResponsableDisplay(printTurno.usuario, printTurno.usuarioId);
  const printProductosVendidos = getTurnoProductosVendidos(printTurno);
  const printSummary = {
    pedidosCancelados: printTurno.pedidosCancelados ?? countTurnoPedidosByEstado(printTurno, "cancelado"),
    pedidosEntregados: printTurno.pedidosEntregados ?? countTurnoPedidosByEstado(printTurno, "entregado"),
    pedidosPendientes: printTurno.pedidosPendientes ?? countTurnoPedidosPendientes(printTurno),
    totalEfectivo: printTurno.totalEfectivo ?? 0,
    totalPedidos: printTurno.totalPedidos ?? printTurno.pedidos.length,
    totalPendiente: printTurno.totalPendiente ?? 0,
    totalTarjeta: printTurno.totalTarjeta ?? 0,
    totalTransferencia: printTurno.totalTransferencia ?? 0,
    totalVendido: printTurno.totalVendido ?? 0
  };

  return (
    <article
      className={`historial-print-turno overflow-hidden rounded-2xl ${isPrintTarget ? "historial-print-target" : ""} ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]"}`}
    >
      <div className="flex w-full flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-slate-500">Turno cerrado</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{formatKitchenDateTime(turno.fechaCierre)}</h2>
          <p className="mt-2 flex flex-wrap gap-3 text-sm font-bold text-slate-600">
            <span>
              {responsable.primaryLabel}: {responsable.primaryValue}
            </span>
            {responsable.roleValue && <span>Rol: {responsable.roleValue}</span>}
            <span>Inicio: {turno.fechaInicio ? formatKitchenDateTime(turno.fechaInicio) : "Sin datos"}</span>
            <span>Cierre: {formatKitchenDateTime(turno.fechaCierre)}</span>
          </p>
          <p className="mt-2 flex flex-wrap gap-2 text-sm font-black text-slate-700">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {turno.pedidos.length} pedidos registrados
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
              {pedidosEntregados} entregados
            </span>
            <span className="rounded-full border border-yellow-200 bg-[#FFF8DC] px-3 py-1">
              {pedidosPendientes} pendientes
            </span>
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1">
              {pedidosCancelados} cancelados
            </span>
          </p>
        </div>
        <div className="grid gap-3 sm:min-w-[320px]">
          <div className="text-left sm:text-right">
            <p className="text-xs font-black uppercase text-slate-500">Total vendido confirmado</p>
            <p className="text-2xl font-black text-slate-950">{formatKitchenCurrency(String(turno.totalVendido))}</p>
          </div>
          <div className="no-print grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                onReadAction("Ver resumen del turno.", `historial-turno-resumen:${turno.id}`);
                onToggle("resumen");
              }}
              aria-expanded={isExpanded && selectedView === "resumen"}
              className={`min-h-[48px] rounded-xl border px-3 text-sm font-black transition ${isHighContrast ? "contrast-button-secondary" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"} ${FOCUS_VISIBLE_CLASS}`}
            >
              Ver resumen
            </button>
            <button
              type="button"
              onClick={() => {
                onReadAction("Ver pedidos del turno.", `historial-turno-pedidos:${turno.id}`);
                onToggle("pedidos");
              }}
              aria-expanded={isExpanded && selectedView === "pedidos"}
              className={`min-h-[48px] rounded-xl border px-3 text-sm font-black transition ${isHighContrast ? "contrast-button-secondary" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"} ${FOCUS_VISIBLE_CLASS}`}
            >
              Ver pedidos
            </button>
            <button
              type="button"
              onClick={() => {
                onReadAction("Imprimir turno.", `historial-turno-imprimir:${turno.id}`);
                onPrint(turno.id);
              }}
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition ${isHighContrast ? "contrast-button-secondary" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"} ${FOCUS_VISIBLE_CLASS}`}
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-100 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
        <HistorialMetric label="Pedidos entregados" value={String(pedidosEntregados)} />
        <HistorialMetric label="Pedidos pendientes" value={String(pedidosPendientes)} />
        <HistorialMetric label="Pedidos cancelados" value={String(pedidosCancelados)} />
      </div>

      <CierreTurnoPrintable
        fechaCierre={printTurno.fechaCierre}
        fechaInicio={printTurno.fechaInicio}
        pedidos={printTurno.pedidos}
        productosVendidos={printProductosVendidos}
        responsable={printResponsable}
        summary={printSummary}
      />

      {isExpanded && (
        <div className="grid gap-3 border-t border-slate-200 bg-slate-50 p-3">
          {selectedView === "resumen" ? (
            <HistorialTurnoResumen
              isHighContrast={isHighContrast}
              productosVendidos={productosVendidos}
              turno={turno}
            />
          ) : (
            <HistorialPedidosCompactos
              isHighContrast={isHighContrast}
              onOpenModal={onOpenModal}
              onReadAction={onReadAction}
              pedidos={turno.pedidos}
            />
          )}
        </div>
      )}
    </article>
  );
}

function HistorialMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function HistorialTurnoResumen({
  isHighContrast,
  productosVendidos,
  turno
}: {
  isHighContrast: boolean;
  productosVendidos: NonNullable<CierreTurno["productosVendidos"]>;
  turno: HistorialTurno;
}) {
  const paymentRows = [
    { label: "Efectivo", value: turno.totalEfectivo ?? 0 },
    { label: "Tarjeta", value: turno.totalTarjeta ?? 0 },
    { label: "Transferencia", value: turno.totalTransferencia ?? 0 }
  ];
  const totalProductosVendidos = productosVendidos.reduce((total, producto) => total + producto.cantidad, 0);

  return (
    <div className="grid gap-3 xl:grid-cols-3">
      <section
        className={`rounded-2xl p-4 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
        aria-labelledby={`general-${turno.id}`}
      >
        <h3 id={`general-${turno.id}`} className="text-lg font-black text-slate-950">
          Resumen general
        </h3>
        <div className="mt-3 grid gap-2">
          <HistorialResumenRow
            label="Total vendido confirmado"
            value={formatKitchenCurrency(String(turno.totalVendido ?? 0))}
          />
          <HistorialResumenRow label="Pedidos registrados" value={String(turno.pedidos.length)} />
          <HistorialResumenRow label="Productos vendidos" value={String(totalProductosVendidos)} />
        </div>
      </section>

      <section
        className={`rounded-2xl p-4 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
        aria-labelledby={`metodos-${turno.id}`}
      >
        <h3 id={`metodos-${turno.id}`} className="text-lg font-black text-slate-950">
          Métodos de pago
        </h3>
        <div className="mt-3 grid gap-2">
          {paymentRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <span className="font-bold text-slate-700">{row.label}</span>
              <span className="font-black text-slate-950">{formatKitchenCurrency(String(row.value))}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        className={`rounded-2xl p-4 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
        aria-labelledby={`productos-${turno.id}`}
      >
        <h3 id={`productos-${turno.id}`} className="text-lg font-black text-slate-950">
          Productos vendidos
        </h3>
        <p className="mt-1 text-sm font-bold text-slate-600">Solo productos de pedidos entregados.</p>
        {productosVendidos.length === 0 ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-600">
            No hay productos vendidos confirmados.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
            {productosVendidos.map((producto) => (
              <div
                key={producto.productoId}
                className="grid gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0 sm:grid-cols-[1fr_90px_120px] sm:items-center"
              >
                <p className="font-black text-slate-950">{producto.productoNombre}</p>
                <p className="font-bold text-slate-700">{producto.cantidad}x</p>
                <p className="font-black text-slate-950 sm:text-right">
                  {formatKitchenCurrency(String(producto.total))}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HistorialResumenRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="font-bold text-slate-700">{label}</span>
      <span className="font-black text-slate-950">{value}</span>
    </div>
  );
}

function HistorialPedidosCompactos({
  isHighContrast,
  onOpenModal,
  onReadAction,
  pedidos
}: {
  isHighContrast: boolean;
  onOpenModal: (pedido: HistorialPedidoDetalle) => void;
  onReadAction: (message: string, dedupeKey: string) => void;
  pedidos: HistorialPedidoDetalle[];
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border border-slate-200 bg-white"}`}
      aria-label="Pedidos del turno"
    >
      <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase text-slate-500 md:grid md:grid-cols-[120px_150px_100px_1fr_150px_120px] md:items-center">
        <span>Pedido</span>
        <span>Estado</span>
        <span>Hora</span>
        <span>Cliente</span>
        <span>Pago</span>
        <span className="text-right">Detalle</span>
      </div>
      <div className="divide-y divide-slate-100">
        {pedidos.map((pedido) => (
          <article
            key={`${pedido.turnoId}-${pedido.id}`}
            className="grid gap-3 px-4 py-3 md:grid-cols-[120px_150px_100px_1fr_150px_120px] md:items-center"
          >
            <p className="font-black text-slate-950">#{getPedidoDisplayNumber(pedido)}</p>
            <StatusBadge estado={pedido.estado} />
            <p className="font-bold text-slate-600">{formatTime(pedido.createdAt)}</p>
            <p className="font-bold text-slate-700">{pedido.clienteNombre || pedido.observacion || "Sin referencia"}</p>
            <p className="font-bold text-slate-700">
              {formatMetodoPagoLabel(pedido.metodoPago)} · {formatKitchenCurrency(String(pedido.total))}
            </p>
            <button
              type="button"
              onClick={() => {
                onReadAction(
                  `Ver detalle del pedido ${getPedidoDisplayNumber(pedido)}.`,
                  `historial-pedido-detalle:${pedido.turnoId}:${pedido.id}`
                );
                onOpenModal(pedido);
              }}
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 font-black transition ${
                isHighContrast
                  ? "contrast-button-secondary"
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              <Eye className="h-5 w-5" aria-hidden="true" />
              Ver detalle
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
