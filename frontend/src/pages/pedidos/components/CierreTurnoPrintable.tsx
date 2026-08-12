import logoRiquisimo from "../../../assets/logoRiq.png";
import type { CierreProductoResumen } from "../../../types";
import type { ResponsableDisplay } from "../../../utils/turnoResponsable";
import {
  ESTADO_META,
  formatCurrency,
  formatDateTime,
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
  const paymentRows = [
    { label: "Efectivo", value: summary.totalEfectivo },
    { label: "Tarjeta", value: summary.totalTarjeta },
    { label: "Transferencia", value: summary.totalTransferencia }
  ];

  return (
    <section className="historial-print-only">
      <header className="turno-print-header">
        <img src={logoRiquisimo} alt="Riquísimo" />
        <div>
          <h1>Resumen de cierre de turno</h1>
          <p>Riquísimo · Sistema de pedidos</p>
        </div>
      </header>

      <section className="turno-print-context" aria-label="Datos del turno">
        <p>
          <strong>Periodo</strong>
          <span>
            {fechaInicio ? formatDateTime(fechaInicio) : "Sin inicio"} — {formatDateTime(fechaCierre)}
          </span>
        </p>
        <p>
          <strong>{responsable.primaryLabel}</strong>
          <span>{responsable.primaryValue}</span>
        </p>
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
          <dl className="turno-print-payment-list">
            {paymentRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{formatCurrency(String(row.value))}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="turno-print-card">
          <h2>Productos entregados · consolidado</h2>
          {productosVendidos.length === 0 ? (
            <p className="turno-print-empty">Sin productos entregados.</p>
          ) : (
            <table className="turno-print-products-table">
              <thead>
                <tr>
                  <th>Cant.</th>
                  <th>Producto</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {productosVendidos.map((producto) => (
                  <tr key={producto.productoId}>
                    <td>{producto.cantidad}</td>
                    <td>{producto.productoNombre}</td>
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
          <span>{pedidos.length} registrados</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Productos incluidos</th>
              <th>Estado</th>
              <th>Pago</th>
              <th>Valor pedido</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td>#{getPedidoDisplayNumber(pedido)}</td>
                <td>{pedido.clienteNombre?.trim() || "Sin nombre"}</td>
                <td>
                  {pedido.detalles.length
                    ? pedido.detalles.map((detalle) => `${detalle.cantidad}× ${detalle.productoNombre}`).join(" · ")
                    : "Sin productos"}
                </td>
                <td>{ESTADO_META[pedido.estado].label}</td>
                <td>{formatMetodoPago(pedido.metodoPago)}</td>
                <td>{formatCurrency(String(pedido.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}

export default CierreTurnoPrintable;
