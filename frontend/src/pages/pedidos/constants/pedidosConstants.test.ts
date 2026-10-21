import { describe, expect, it } from "vitest";
import { ESTADO_META } from "./pedidosConstants";

describe("contraste de etiquetas de estado", () => {
  it("aplica el estilo de alto contraste a Pendiente y al resto de estados", () => {
    expect(ESTADO_META.pendiente.className).toContain("contrast-badge");
    expect(Object.values(ESTADO_META).every((meta) => meta.className.includes("contrast-badge"))).toBe(true);
  });
});
