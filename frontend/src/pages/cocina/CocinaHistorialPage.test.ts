import { describe, expect, it } from "vitest";
import { getInitialHistorialDateFilter } from "./CocinaHistorialPage";

describe("configuración inicial del historial", () => {
  it("inicia el modo normal en Esta semana sin modificar Modo Fácil", () => {
    expect(getInitialHistorialDateFilter(false)).toBe("week");
    expect(getInitialHistorialDateFilter(true)).toBe("all");
  });
});
