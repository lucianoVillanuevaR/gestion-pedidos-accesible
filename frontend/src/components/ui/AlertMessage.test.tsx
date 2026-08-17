// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AlertMessage from "./AlertMessage";

describe("AlertMessage", () => {
  afterEach(cleanup);

  it.each([
    ["success", "Operación completada", "status", "bg-emerald-50"],
    ["warning", "La operación requiere atención", "status", "bg-amber-50"],
    ["error", "La operación falló", "alert", "bg-red-700"]
  ] as const)("presenta el tono %s con estilo y semántica coherentes", (tone, message, role, toneClass) => {
    render(<AlertMessage message={message} tone={tone} />);

    const alert = screen.getByRole(role);
    expect(alert.textContent).toContain(message);
    expect(alert.className).toContain(toneClass);
  });
});
