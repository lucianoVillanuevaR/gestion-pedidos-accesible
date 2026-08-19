import type { RefObject } from "react";
import type { MetodoPago } from "../../../types";
import type { PdvViewContextValue } from "../PdvViewContext";
import TicketComanda from "./TicketComanda";

type PdvPrintTicketProps = {
  clienteNombre: string;
  createdAt?: string;
  metodoPago: MetodoPago | "";
  nextPedidoNumber: number | string;
  observacion: string;
  pedidoDetalles: PdvViewContextValue["pedidoDetalles"];
  customerTicketRef: RefObject<HTMLDivElement>;
  kitchenClienteNombre: string;
  kitchenCreatedAt?: string;
  kitchenNumeroPedido: number | string;
  kitchenObservacion: string;
  kitchenPedidoDetalles: PdvViewContextValue["pedidoDetalles"];
  kitchenTicketRef: RefObject<HTMLDivElement>;
  total: number;
};

function PdvPrintTicket({
  clienteNombre,
  createdAt,
  metodoPago,
  nextPedidoNumber,
  observacion,
  pedidoDetalles,
  customerTicketRef,
  kitchenClienteNombre,
  kitchenCreatedAt,
  kitchenNumeroPedido,
  kitchenObservacion,
  kitchenPedidoDetalles,
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
          clienteNombre={kitchenClienteNombre}
          createdAt={kitchenCreatedAt}
          pedidoDetalles={kitchenPedidoDetalles}
          total={total}
          metodoPago={metodoPago}
          observacion={kitchenObservacion}
          numeroPedido={kitchenNumeroPedido}
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
          createdAt={createdAt}
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
