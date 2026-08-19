import logoRiquisimo from "../../../assets/logoRiq.png";
import type { MetodoPago } from "../../../types";
import { formatCurrency, getPaymentLabel } from "../../../utils/pdv";
import type { PdvPedidoDetalle } from "../pdv.types";

type TicketComandaProps = {
  clienteNombre?: string;
  createdAt?: string | Date;
  pedidoDetalles: PdvPedidoDetalle[];
  total: number;
  metodoPago: MetodoPago | "";
  observacion?: string;
  numeroPedido?: string | number;
  type?: "customer" | "kitchen";
};

function TicketComanda({
  clienteNombre,
  createdAt,
  pedidoDetalles,
  total,
  metodoPago,
  observacion,
  numeroPedido,
  type = "kitchen"
}: TicketComandaProps) {
  const isKitchen = type === "kitchen";
  const now = createdAt ? new Date(createdAt) : new Date();
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
        {!isKitchen && <img className="ticket-logo" src={logoRiquisimo} alt="Riquísimo" />}
        {!isKitchen && <p className="ticket-brand">RIQUÍSIMO</p>}
        <p className="ticket-document-type">{isKitchen ? "TICKET DE COCINA" : "TICKET DE CLIENTE"}</p>
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
        {!isKitchen && (
          <div className="ticket-row">
            <span className="ticket-label">Pago</span>
            <span className="ticket-value">{metodoPago ? getPaymentLabel(metodoPago) : "Sin seleccionar"}</span>
          </div>
        )}
      </section>

      <div className="ticket-divider-dashed" />
      <h2 className="ticket-section-title">DETALLE DEL PEDIDO</h2>

      <section className="ticket-items" aria-label="Productos">
        {pedidoDetalles.length === 0 ? (
          <p className="ticket-empty">SIN PRODUCTOS</p>
        ) : (
          pedidoDetalles.map((item) => (
            <div key={item.itemKey} className="ticket-item">
              <div className={`ticket-item-line ${isKitchen ? "ticket-item-line--kitchen" : ""}`}>
                <strong className="ticket-qty">{item.cantidad}×</strong>
                <strong className="ticket-product">{item.producto.nombre}</strong>
                {!isKitchen && <strong className="ticket-price">{formatCurrency(item.subtotal)}</strong>}
              </div>

              {!isKitchen && item.cantidad > 1 && (
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

      {!isKitchen && (
        <>
          <div className="ticket-divider-strong" />
          <div className="ticket-total-row">
            <span>TOTAL</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </>
      )}

      {observacion?.trim() && (
        <section className="ticket-observations">
          <h2 className="ticket-obs-title">OBSERVACIÓN GENERAL</h2>
          <p className="ticket-obs-text">{observacion.trim()}</p>
        </section>
      )}

      <footer className="ticket-footer">
        <div className="ticket-divider-dashed" />
        <strong>{isKitchen ? "FIN COMANDA" : "¡GRACIAS POR SU COMPRA!"}</strong>
      </footer>
    </article>
  );
}

export default TicketComanda;
