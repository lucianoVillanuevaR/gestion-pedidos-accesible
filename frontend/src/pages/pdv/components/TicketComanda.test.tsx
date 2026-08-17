// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TicketComanda from "./TicketComanda";

describe("TicketComanda", () => {
  it("muestra logo, número, cliente, pago y detalle en la comanda", () => {
    render(
      <TicketComanda
        clienteNombre="Ana"
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
      />
    );

    expect(screen.getByRole("img", { name: "Riquísimo" })).toBeTruthy();
    expect(screen.getAllByText("PEDIDO #6")).toHaveLength(1);
    expect(screen.getByText("Ana")).toBeTruthy();
    expect(screen.getByText("Tarjeta")).toBeTruthy();
    expect(screen.getByText("2×")).toBeTruthy();
    expect(screen.getByText("NOTA: Sin cebolla")).toBeTruthy();
    expect(screen.getByText("Entregar rápido")).toBeTruthy();
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
            personalizacion: { aderezos: ["Mayonesa", "Mostaza"], comentario: "Sin tomate" }
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
