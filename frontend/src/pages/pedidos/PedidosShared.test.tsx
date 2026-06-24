// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PedidoDetalleResponse } from "../../types";
import { DetalleSeleccion } from "./PedidosShared";

function makeDetalle(personalizacion: PedidoDetalleResponse["personalizacion"]): PedidoDetalleResponse {
  return {
    cantidad: 1,
    id: 1,
    pedidoId: 1,
    precioUnitario: "3900",
    productoId: 1,
    subtotal: "3900",
    personalizacion
  };
}

describe("DetalleSeleccion", () => {
  afterEach(cleanup);

  it("muestra un comentario aunque no existan variante ni aderezos", () => {
    render(
      <DetalleSeleccion
        detalle={makeDetalle({ aderezos: [], comentario: "Sin cebolla y bien tostado" })}
        isAccessible={false}
      />
    );

    expect(screen.getByText("Comentario para cocina")).toBeTruthy();
    expect(screen.getByText("Sin cebolla y bien tostado")).toBeTruthy();
  });

  it("no renderiza un comentario compuesto solo por espacios", () => {
    const { container } = render(
      <DetalleSeleccion detalle={makeDetalle({ aderezos: [], comentario: "   " })} isAccessible={false} />
    );

    expect(container.innerHTML).toBe("");
  });
});
