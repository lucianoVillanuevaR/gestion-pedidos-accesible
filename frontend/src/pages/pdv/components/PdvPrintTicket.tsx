import type { RefObject } from "react";
import type { MetodoPago } from "../../../types";
import type { PdvViewContextValue } from "../PdvViewContext";
import TicketComanda from "./TicketComanda";

type PdvPrintTicketProps = {
  clienteNombre: string;
  metodoPago: MetodoPago | "";
  nextPedidoNumber: number | string;
  observacion: string;
  pedidoDetalles: PdvViewContextValue["pedidoDetalles"];
  customerTicketRef: RefObject<HTMLDivElement>;
  kitchenTicketRef: RefObject<HTMLDivElement>;
  total: number;
};

function PdvPrintTicket({
  clienteNombre,
  metodoPago,
  nextPedidoNumber,
  observacion,
  pedidoDetalles,
  customerTicketRef,
  kitchenTicketRef,
  total
}: PdvPrintTicketProps) {
  return (
    <>
      <div
        ref={kitchenTicketRef}
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 w-[80mm] bg-white print:static print:left-auto print:w-[80mm]"
      >
        <TicketComanda
          clienteNombre={clienteNombre}
          pedidoDetalles={pedidoDetalles}
          total={total}
          metodoPago={metodoPago}
          observacion={observacion}
          numeroPedido={nextPedidoNumber}
          type="kitchen"
        />
      </div>
      <div
        ref={customerTicketRef}
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 w-[80mm] bg-white print:static print:left-auto print:w-[80mm]"
      >
        <TicketComanda
          clienteNombre={clienteNombre}
          pedidoDetalles={pedidoDetalles}
          total={total}
          metodoPago={metodoPago}
          observacion={observacion}
          numeroPedido={nextPedidoNumber}
          type="customer"
        />
      </div>
    </>
  );
}

export default PdvPrintTicket;
