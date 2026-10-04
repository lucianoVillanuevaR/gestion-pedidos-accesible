import { describe, expect, it } from "vitest";
import { getNextCocinaEstado } from "./cocinaUtils";

describe("flujo de estados de preparación", () => {
  it("limita el avance a las transiciones propias de cocina", () => {
    expect(getNextCocinaEstado("pendiente")).toBe("en_preparacion");
    expect(getNextCocinaEstado("en_preparacion")).toBe("listo");
    expect(getNextCocinaEstado("listo")).toBeNull();
    expect(getNextCocinaEstado("entregado")).toBeNull();
    expect(getNextCocinaEstado("cancelado")).toBeNull();
  });
});
