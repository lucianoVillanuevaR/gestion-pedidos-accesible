import type { RefObject } from "react";
import TicketComanda from "../../components/TicketComanda";
import type { MetodoPago } from "../../types";
import type { PdvViewContextValue } from "./PdvViewContext";

type PdvPrintTicketProps = {
  metodoPago: MetodoPago | "";
  observacion: string;
  pedidoDetalles: PdvViewContextValue["pedidoDetalles"];
  ticketRef: RefObject<HTMLDivElement>;
  total: number;
};

function PdvPrintTicket({ metodoPago, observacion, pedidoDetalles, ticketRef, total }: PdvPrintTicketProps) {
  return (
    <div className="hidden print:block" ref={ticketRef}>
      <TicketComanda
        pedidoDetalles={pedidoDetalles}
        total={total}
        metodoPago={metodoPago}
        observacion={observacion}
        numeroPedido={undefined}
      />
    </div>
  );
}

export default PdvPrintTicket;
