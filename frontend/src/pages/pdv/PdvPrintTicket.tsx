import type { RefObject } from "react";
import TicketComanda from "../../components/TicketComanda";
import type { MetodoPago } from "../../types";
import type { PdvViewContextValue } from "./PdvViewContext";

type PdvPrintTicketProps = {
  metodoPago: MetodoPago | "";
  nextPedidoNumber: number;
  observacion: string;
  pedidoDetalles: PdvViewContextValue["pedidoDetalles"];
  ticketRef: RefObject<HTMLDivElement>;
  total: number;
};

function PdvPrintTicket({
  metodoPago,
  nextPedidoNumber,
  observacion,
  pedidoDetalles,
  ticketRef,
  total
}: PdvPrintTicketProps) {
  return (
    <div
      ref={ticketRef}
      aria-hidden="true"
      className="pointer-events-none fixed -left-[9999px] top-0 w-[80mm] bg-white print:static print:left-auto"
    >
      <TicketComanda
        pedidoDetalles={pedidoDetalles}
        total={total}
        metodoPago={metodoPago}
        observacion={observacion}
        numeroPedido={nextPedidoNumber}
      />
    </div>
  );
}

export default PdvPrintTicket;
