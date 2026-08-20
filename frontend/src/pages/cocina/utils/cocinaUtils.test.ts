import { describe, expect, it } from "vitest";
import { getNextCocinaEstado } from "./cocinaUtils";

describe("flujo de estados de preparación", () => {
  it("mantiene el avance pendiente, en preparación, listo y entregado", () => {
    expect(getNextCocinaEstado("pendiente")).toBe("en_preparacion");
    expect(getNextCocinaEstado("en_preparacion")).toBe("listo");
    expect(getNextCocinaEstado("listo")).toBe("entregado");
    expect(getNextCocinaEstado("entregado")).toBeNull();
    expect(getNextCocinaEstado("cancelado")).toBeNull();
  });
});
