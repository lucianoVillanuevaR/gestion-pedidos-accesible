import logoRiquisimo from "../../../assets/logoRiq.png";
import type { MetodoPago, PersonalizacionProducto, Producto, VarianteProducto } from "../../../types";
import { formatCurrency, getPaymentLabel } from "../../../utils/pdv";

type TicketDetalle = {
  itemKey: string;
  productoId: number;
  cantidad: number;
  subtotal: number;
  producto: Producto;
  variante?: VarianteProducto;
  personalizacion?: PersonalizacionProducto;
};

type TicketComandaProps = {
  clienteNombre?: string;
  pedidoDetalles: TicketDetalle[];
  total: number;
  metodoPago: MetodoPago | "";
  observacion?: string;
  numeroPedido?: string | number;
};

function TicketComanda({
  clienteNombre,
  pedidoDetalles,
  total,
  metodoPago,
  observacion,
  numeroPedido
}: TicketComandaProps) {
  const now = new Date();
  const fecha = now.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const hora = now.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <article className="ticket-print">
      <header className="ticket-header">
        <img className="ticket-logo" src={logoRiquisimo} alt="Riquísimo" />
        <p className="ticket-brand">RIQUÍSIMO</p>
        <p className="ticket-document-type">COMANDA DE COCINA</p>
        {numeroPedido && <h1 className="ticket-order-number">PEDIDO #{numeroPedido}</h1>}
      </header>

      <div className="ticket-divider-strong" />

      <section className="ticket-info" aria-label="Información del pedido">
        <div className="ticket-row">
          <span className="ticket-label">Fecha</span>
          <span className="ticket-value">{fecha}</span>
        </div>
        <div className="ticket-row">
          <span className="ticket-label">Hora</span>
          <span className="ticket-value">{hora}</span>
        </div>
        <div className="ticket-row ticket-row-emphasis">
          <span className="ticket-label">Cliente</span>
          <span className="ticket-value">{clienteNombre?.trim() || "Sin nombre"}</span>
        </div>
        <div className="ticket-row">
          <span className="ticket-label">Pago</span>
          <span className="ticket-value">{metodoPago ? getPaymentLabel(metodoPago) : "Sin seleccionar"}</span>
        </div>
      </section>

      <div className="ticket-divider-dashed" />
      <h2 className="ticket-section-title">DETALLE DEL PEDIDO</h2>

      <section className="ticket-items" aria-label="Productos">
        {pedidoDetalles.length === 0 ? (
          <p className="ticket-empty">SIN PRODUCTOS</p>
        ) : (
          pedidoDetalles.map((item) => (
            <div key={item.itemKey} className="ticket-item">
              <div className="ticket-item-line">
                <strong className="ticket-qty">{item.cantidad}×</strong>
                <strong className="ticket-product">{item.producto.nombre}</strong>
                <strong className="ticket-price">{formatCurrency(item.subtotal)}</strong>
              </div>

              {item.cantidad > 1 && (
                <p className="ticket-description">{formatCurrency(item.subtotal / item.cantidad)} c/u</p>
              )}
              {item.variante && (
                <p className="ticket-description">
                  <b>Opción:</b> {item.variante.nombre}
                </p>
              )}
              {item.personalizacion?.combinacion && (
                <p className="ticket-description">
                  <b>Combinación:</b> {item.personalizacion.combinacion.nombre}
                </p>
              )}
              {item.personalizacion?.aderezos.length ? (
                <p className="ticket-description">
                  <b>Aderezos:</b> {item.personalizacion.aderezos.join(", ")}
                </p>
              ) : null}
              {item.personalizacion?.comentario?.trim() && (
                <p className="ticket-item-note">NOTA: {item.personalizacion.comentario.trim()}</p>
              )}
            </div>
          ))
        )}
      </section>

      <div className="ticket-divider-strong" />
      <div className="ticket-total-row">
        <span>TOTAL</span>
        <strong>{formatCurrency(total)}</strong>
      </div>

      {observacion?.trim() && (
        <section className="ticket-observations">
          <h2 className="ticket-obs-title">OBSERVACIÓN GENERAL</h2>
          <p className="ticket-obs-text">{observacion.trim()}</p>
        </section>
      )}

      <footer className="ticket-footer">
        <div className="ticket-divider-dashed" />
        <p>*** FIN DE COMANDA ***</p>
      </footer>
    </article>
  );
}

export default TicketComanda;
