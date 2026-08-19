import { useCallback, useRef } from "react";
import { useReactToPrint, type UseReactToPrintOptions } from "react-to-print";

const THERMAL_TICKET_PAGE_STYLE = `
  @page { size: 80mm 100mm; margin: 0; }
  html, body {
    width: 80mm !important;
    min-width: 80mm !important;
    margin: 0;
    padding: 0;
    background: white;
    overflow: hidden;
  }
  .ticket-print {
    width: 80mm !important;
    min-height: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }
`;

const printThermalTicket: NonNullable<UseReactToPrintOptions["print"]> = async (printIframe) => {
  const printWindow = printIframe.contentWindow;
  if (!printWindow) throw new Error("No se pudo preparar la ventana de impresión");

  await new Promise<void>((resolve) => window.setTimeout(resolve, 100));
  const ticket = printIframe.contentDocument?.querySelector<HTMLElement>(".ticket-print");
  if (ticket) {
    const contentHeightMm = Math.ceil(ticket.getBoundingClientRect().height * (25.4 / 96)) + 2;
    const dynamicPageStyle = printIframe.contentDocument?.createElement("style");
    if (dynamicPageStyle) {
      dynamicPageStyle.textContent = `@page { size: 80mm ${contentHeightMm}mm; margin: 0; }`;
      printIframe.contentDocument?.head.appendChild(dynamicPageStyle);
    }
  }

  printWindow.focus();
  printWindow.print();
};

export function usePdvPrinting({ onPrintError }: { onPrintError: () => void }) {
  const customerTicketRef = useRef<HTMLDivElement | null>(null);
  const kitchenTicketRef = useRef<HTMLDivElement | null>(null);
  const handlePrintError = useCallback(() => onPrintError(), [onPrintError]);
  const timestamp = () => new Date().getTime();

  const handlePrintCustomer = useReactToPrint({
    contentRef: customerTicketRef,
    documentTitle: `Ticket-cliente-Riquisimo-${timestamp()}`,
    print: printThermalTicket,
    pageStyle: THERMAL_TICKET_PAGE_STYLE,
    onPrintError: handlePrintError
  });
  const handlePrintKitchen = useReactToPrint({
    contentRef: kitchenTicketRef,
    documentTitle: `Ticket-cocina-Riquisimo-${timestamp()}`,
    print: printThermalTicket,
    pageStyle: THERMAL_TICKET_PAGE_STYLE,
    onPrintError: handlePrintError
  });

  return { customerTicketRef, kitchenTicketRef, handlePrintCustomer, handlePrintKitchen };
}
