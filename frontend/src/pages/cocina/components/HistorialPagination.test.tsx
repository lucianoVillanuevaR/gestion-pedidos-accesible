// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HistorialPagination } from "./HistorialPagination";

describe("paginación del historial de turnos", () => {
  afterEach(cleanup);

  it("deshabilita Anterior en la primera página y permite avanzar", () => {
    const onPageChange = vi.fn();
    render(
      <HistorialPagination
        end={8}
        isHighContrast={false}
        onPageChange={onPageChange}
        page={1}
        start={1}
        total={19}
        totalPages={3}
      />
    );

    expect(screen.getByRole("button", { name: "Ir a la página anterior" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByLabelText("Página 1 de 3")).toBeTruthy();
    expect(screen.getByText("Mostrando 1–8 de 19 turnos")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ir a la página siguiente" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("deshabilita Siguiente en la última página", () => {
    render(
      <HistorialPagination
        end={19}
        isHighContrast
        onPageChange={vi.fn()}
        page={3}
        start={17}
        total={19}
        totalPages={3}
      />
    );

    expect(screen.getByRole("button", { name: "Ir a la página siguiente" }).hasAttribute("disabled")).toBe(true);
  });
});
