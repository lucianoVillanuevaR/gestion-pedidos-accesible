import { formatCurrency, getPaymentLabel } from "../utils/pdv";

/**
 * Componente TicketComanda
 * Renderiza una comanda con formato tipo ticket para impresora térmica
 * Se imprime usando react-to-print
 */
const TicketComanda = ({
  pedidoDetalles,
  total,
  metodoPago,
  observacion,
  numeroPedido,
  isAccessible
}) => {
  // Obtener fecha y hora actual
  const now = new Date();
  const fecha = now.toLocaleDateString("es-ES", {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const hora = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  return (
    <div className="ticket-print">
      {/* Encabezado */}
      <div className="ticket-header">
        <h1 className="ticket-title">COMANDA RIQUÍSIMO</h1>
        <div className="ticket-divider"></div>
      </div>

      {/* Información de la comanda */}
      <div className="ticket-info">
        {numeroPedido && (
          <div className="ticket-row">
            <span className="ticket-label">Pedido #:</span>
            <span className="ticket-value">{numeroPedido}</span>
          </div>
        )}
        <div className="ticket-row">
          <span className="ticket-label">Fecha:</span>
          <span className="ticket-value">{fecha}</span>
        </div>
        <div className="ticket-row">
          <span className="ticket-label">Hora:</span>
          <span className="ticket-value">{hora}</span>
        </div>
      </div>

      <div className="ticket-divider-dashed"></div>

      {/* Detalle de productos */}
      <div className="ticket-items">
        <div className="ticket-items-header">
          <span className="ticket-qty">CAN</span>
          <span className="ticket-product">PRODUCTO</span>
          <span className="ticket-price">PRECIO</span>
        </div>
        <div className="ticket-items-divider"></div>

        {pedidoDetalles.length === 0 ? (
          <p className="ticket-empty">Sin productos</p>
        ) : (
          pedidoDetalles.map((item) => (
            <div key={item.productoId} className="ticket-item">
              <div className="ticket-item-line">
                <span className="ticket-qty">{item.cantidad}</span>
                <span className="ticket-product">{item.producto.nombre}</span>
                <span className="ticket-price">{formatCurrency(item.subtotal)}</span>
              </div>
              {item.producto.descripcion && (
                <div className="ticket-description">
                  {item.producto.descripcion}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="ticket-divider-dashed"></div>

      {/* Total */}
      <div className="ticket-total">
        <div className="ticket-total-row">
          <span className="ticket-total-label">TOTAL:</span>
          <span className="ticket-total-amount">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Método de pago */}
      <div className="ticket-divider-dashed"></div>
      <div className="ticket-payment">
        <div className="ticket-row">
          <span className="ticket-label">Método:</span>
          <span className="ticket-value">{getPaymentLabel(metodoPago)}</span>
        </div>
      </div>

      {/* Observaciones */}
      {observacion && (
        <>
          <div className="ticket-divider-dashed"></div>
          <div className="ticket-observations">
            <p className="ticket-obs-title">OBSERVACIONES:</p>
            <p className="ticket-obs-text">{observacion}</p>
          </div>
        </>
      )}

      {/* Pie de página */}
      <div className="ticket-divider"></div>
      <div className="ticket-footer">
        <p>Gracias por su compra</p>
        <p className="ticket-footer-small">Riquísimo 🍽</p>
      </div>
    </div>
  );
};

export default TicketComanda;
