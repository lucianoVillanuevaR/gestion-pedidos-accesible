import logoRiquisimo from "../../../assets/logoRiq.png";
import type { CierreProductoResumen, MetodoPago } from "../../../types";
import type { ResponsableDisplay } from "../../../utils/turnoResponsable";
import {
  ESTADO_META,
  formatCurrency,
  formatMetodoPago,
  getCierrePedidosResumen,
  getPedidoDisplayNumber,
  getTurnoSummary
} from "../PedidosShared";

type CierreTurnoPrintableProps = {
  fechaCierre: string;
  fechaInicio?: string;
  pedidos: ReturnType<typeof getCierrePedidosResumen>;
  productosVendidos: CierreProductoResumen[];
  responsable: ResponsableDisplay;
  summary: ReturnType<typeof getTurnoSummary>;
};

function CierreTurnoPrintable({
  fechaCierre,
  fechaInicio,
  pedidos,
  productosVendidos,
  responsable,
  summary
}: CierreTurnoPrintableProps) {
  const pedidosEntregados = pedidos.filter((pedido) => pedido.estado === "entregado");
  const pedidosPorMetodo = pedidosEntregados.reduce<Record<MetodoPago, number>>(
    (counts, pedido) => {
      counts[pedido.metodoPago] += 1;
      return counts;
    },
    { efectivo: 0, tarjeta: 0, transferencia: 0 }
  );
  const paymentRows = [
    { count: pedidosPorMetodo.efectivo, label: "Efectivo", value: summary.totalEfectivo },
    { count: pedidosPorMetodo.tarjeta, label: "Tarjeta", value: summary.totalTarjeta },
    { count: pedidosPorMetodo.transferencia, label: "Transferencia", value: summary.totalTransferencia }
  ];
  const pedidosOrdenados = [...pedidos].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return leftTime - rightTime;
  });

  return (
    <section
      className={`historial-print-only cierre-turno-print ${pedidosOrdenados.length <= 8 ? "cierre-turno-print--short" : ""}`}
    >
      <header className="turno-print-header">
        <img src={logoRiquisimo} alt="Riquísimo" />
        <div className="turno-print-brand">
          <strong>RIQUÍSIMO</strong>
          <span>Sistema de Gestión de Pedidos</span>
        </div>
        <div className="turno-print-title">
          <h1>CIERRE DE TURNO</h1>
          <p>Resumen de ventas y pedidos</p>
        </div>
      </header>

      <section className="turno-print-context" aria-label="Datos del turno">
        <PrintContext label="Fecha" value={formatReportDate(fechaCierre)} />
        <PrintContext label="Apertura" value={fechaInicio ? formatReportTime(fechaInicio) : "—"} />
        <PrintContext label="Cierre" value={formatReportTime(fechaCierre)} />
        <PrintContext label="Duración" value={formatTurnoDuration(fechaInicio, fechaCierre)} />
        <PrintContext label={responsable.primaryLabel} value={responsable.primaryValue} />
      </section>

      <section className="turno-print-metrics" aria-label="Resumen del turno">
        <article className="turno-print-metric-primary">
          <span>Total vendido</span>
          <strong>{formatCurrency(String(summary.totalVendido))}</strong>
        </article>
        <article>
          <span>Entregados</span>
          <strong>{summary.pedidosEntregados}</strong>
        </article>
        <article>
          <span>Pendientes</span>
          <strong>{summary.pedidosPendientes}</strong>
        </article>
        <article>
          <span>Cancelados</span>
          <strong>{summary.pedidosCancelados}</strong>
        </article>
      </section>

      <div className="turno-print-columns">
        <section className="turno-print-card">
          <h2>Métodos de pago</h2>
          <table className="turno-print-payment-table">
            <thead>
              <tr>
                <th>Método</th>
                <th>Pedidos</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.count}</td>
                  <td>{formatCurrency(String(row.value))}</td>
                </tr>
              ))}
              <tr className="turno-print-total-row">
                <td>Total</td>
                <td>{pedidosEntregados.length}</td>
                <td>{formatCurrency(String(summary.totalVendido))}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="turno-print-card">
          <h2>Productos vendidos</h2>
          {productosVendidos.length === 0 ? (
            <p className="turno-print-empty">No se registraron productos vendidos durante este turno.</p>
          ) : (
            <table className="turno-print-products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {productosVendidos.map((producto) => (
                  <tr key={producto.productoId}>
                    <td>{producto.productoNombre}</td>
                    <td>{producto.cantidad}</td>
                    <td>{formatCurrency(String(producto.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="turno-print-orders">
        <div className="turno-print-section-heading">
          <div>
            <h2>Detalle de pedidos</h2>
            <p>Solo los pedidos entregados se incluyen en el total vendido.</p>
          </div>
          <span>
            {pedidosOrdenados.length} {pedidosOrdenados.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>
        {pedidosOrdenados.length === 0 ? (
          <p className="turno-print-empty">No se registraron pedidos durante este turno.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {pedidosOrdenados.map((pedido) => (
                <tr key={pedido.id}>
                  <td>#{getPedidoDisplayNumber(pedido)}</td>
                  <td>{pedido.createdAt ? formatReportTime(pedido.createdAt) : "Sin hora"}</td>
                  <td>{pedido.clienteNombre?.trim() || "Sin nombre"}</td>
                  <td>
                    {pedido.detalles.length
                      ? pedido.detalles.map((detalle, index) => (
                          <span
                            className="turno-print-order-product"
                            key={`${pedido.id}-${detalle.productoId}-${index}`}
                          >
                            {detalle.cantidad}× {detalle.productoNombre}
                          </span>
                        ))
                      : "Sin productos"}
                  </td>
                  <td>{ESTADO_META[pedido.estado].label}</td>
                  <td>{formatMetodoPago(pedido.metodoPago)}</td>
                  <td>{formatCurrency(String(pedido.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="turno-print-footer">
        <span>Sistema de Gestión de Pedidos · Riquísimo</span>
        <span>
          Generado: {formatReportDate(fechaCierre)} {formatReportTime(fechaCierre)}
        </span>
      </footer>
    </section>
  );
}

function PrintContext({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <strong>{label}</strong>
      <span>{value}</span>
    </p>
  );
}

function formatReportDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatReportTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit"
  }).format(date);
}

export function formatTurnoDuration(fechaInicio: string | undefined, fechaCierre: string) {
  if (!fechaInicio) return "—";

  const startTime = new Date(fechaInicio).getTime();
  const endTime = new Date(fechaCierre).getTime();
  const durationMs = endTime - startTime;
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || durationMs < 0) return "—";

  const totalMinutes = Math.round(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export default CierreTurnoPrintable;
