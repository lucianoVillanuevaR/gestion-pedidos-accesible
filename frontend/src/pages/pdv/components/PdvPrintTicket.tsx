import type { RefObject } from "react";
import type { PdvPrintData } from "../pdv.types";
import TicketComanda from "./TicketComanda";

type PdvPrintTicketProps = {
  customerTicketRef: RefObject<HTMLDivElement>;
  kitchenTicketRef: RefObject<HTMLDivElement>;
  printData: PdvPrintData;
};

function PdvPrintTicket({ customerTicketRef, kitchenTicketRef, printData }: PdvPrintTicketProps) {
  return (
    <>
      <div
        ref={kitchenTicketRef}
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 w-[80mm] bg-white print:static print:left-auto print:w-[80mm]"
      >
        <TicketComanda {...printData} type="kitchen" />
      </div>
      <div
        ref={customerTicketRef}
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 w-[80mm] bg-white print:static print:left-auto print:w-[80mm]"
      >
        <TicketComanda {...printData} type="customer" />
      </div>
    </>
  );
}

export default PdvPrintTicket;
