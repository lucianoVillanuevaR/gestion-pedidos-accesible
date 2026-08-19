// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TicketComanda from "./TicketComanda";

describe("TicketComanda", () => {
  it("muestra logo, número, cliente, pago y detalle en el ticket de cliente", () => {
    render(
      <TicketComanda
        clienteNombre="Ana"
        createdAt="2026-08-18T18:25:00.000Z"
        metodoPago="tarjeta"
        numeroPedido={6}
        observacion="Entregar rápido"
        pedidoDetalles={[
          {
            itemKey: "5:1",
            productoId: 5,
            cantidad: 2,
            subtotal: 11000,
            producto: { id: 5, nombre: "Arma tu sandwich", precio: 5500 },
            personalizacion: {
              aderezos: ["Mayonesa"],
              comentario: "Sin cebolla"
            }
          }
        ]}
        total={11000}
        type="customer"
      />
    );

    expect(screen.getByRole("img", { name: "Riquísimo" })).toBeTruthy();
    expect(screen.getAllByText("PEDIDO #6")).toHaveLength(1);
    expect(screen.getByText("Ana")).toBeTruthy();
    expect(screen.getByText("18-08-2026")).toBeTruthy();
    expect(screen.getByText("Tarjeta")).toBeTruthy();
    expect(screen.getByText("2×")).toBeTruthy();
    expect(screen.getByText("NOTA: Sin cebolla")).toBeTruthy();
    expect(screen.getByText("Entregar rápido")).toBeTruthy();
  });

  it("oculta precios y pago en el ticket de cocina", () => {
    const { container } = render(
      <TicketComanda
        clienteNombre="Ana"
        metodoPago="tarjeta"
        numeroPedido={6}
        pedidoDetalles={[
          {
            itemKey: "5:1",
            productoId: 5,
            cantidad: 1,
            subtotal: 5500,
            producto: { id: 5, nombre: "Arma tu sandwich", precio: 5500 }
          }
        ]}
        total={5500}
        type="kitchen"
      />
    );

    expect(container.textContent).toContain("TICKET DE COCINA");
    expect(container.querySelector(".ticket-logo")).toBeNull();
    expect(container.querySelector(".ticket-brand")).toBeNull();
    expect(container.textContent).not.toContain("Tarjeta");
    expect(container.textContent).not.toContain("TOTAL");
    expect(container.textContent).not.toContain("$5.500");
  });

  it("conserva nombres largos, variantes, aderezos y cliente sin nombre", () => {
    render(
      <TicketComanda
        clienteNombre=""
        metodoPago="efectivo"
        numeroPedido={12}
        observacion="Separar los pedidos"
        pedidoDetalles={[
          {
            itemKey: "9:3",
            productoId: 9,
            cantidad: 3,
            subtotal: 16500,
            producto: {
              id: 9,
              nombre: "Sandwich especial de la casa con nombre deliberadamente largo",
              precio: 5500
            },
            variante: { id: 3, nombre: "Carne mechada", productoId: 9 },
            personalizacion: {
              aderezos: ["Mayonesa", "Mostaza"],
              comentario: "Sin tomate"
            }
          }
        ]}
        total={16500}
      />
    );

    expect(screen.getByText("Sin nombre")).toBeTruthy();
    expect(screen.getByText("Sandwich especial de la casa con nombre deliberadamente largo")).toBeTruthy();
    expect(screen.getByText(/Carne mechada/)).toBeTruthy();
    expect(screen.getByText(/Mayonesa, Mostaza/)).toBeTruthy();
    expect(screen.getByText("NOTA: Sin tomate")).toBeTruthy();
    expect(screen.getByText("Separar los pedidos")).toBeTruthy();
  });
});
