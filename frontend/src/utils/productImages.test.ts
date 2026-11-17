import { describe, expect, it } from "vitest";
import { resolveProductImage } from "./productImages";

describe("fotografías originales del catálogo", () => {
  it.each([
    "Completo Italiano",
    "Completo Alemán",
    "CHACARERO SANDWICH",
    "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección"
  ])("encuentra la imagen confirmada de %s", (nombre) => {
    expect(resolveProductImage({ nombre })).toMatch(/\.webp/);
  });
  it.each([
    "SANDWICH LUCO PATRÓN",
    "2x1 Sandwich Italiano Carne a Elección",
    "4 Completos Alemanes",
    "2x1 Completo Italiano o Alemán"
  ])("no sustituye la fotografía ausente de %s", (nombre) => {
    expect(resolveProductImage({ nombre })).toBeUndefined();
  });
  it("conserva la fotografía asignada por el administrador", () => {
    expect(resolveProductImage({ nombre: "Completo Italiano", imagenUrl: "propia.webp" })).toBe(
      "/media/productos/propia.webp"
    );
  });
});
