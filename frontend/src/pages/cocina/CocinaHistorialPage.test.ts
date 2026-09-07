import { describe, expect, it } from "vitest";
import { getHistorialViewMode, getInitialHistorialDateFilter } from "./CocinaHistorialPage";

describe("configuración inicial del historial", () => {
  it("inicia el modo normal en Esta semana sin modificar Modo Fácil", () => {
    expect(getInitialHistorialDateFilter(false)).toBe("week");
    expect(getInitialHistorialDateFilter(true)).toBe("all");
  });

  it("deriva la presentación desde la ruta sin mezclar Admin y Cajero", () => {
    expect(getHistorialViewMode("/historial-pedidos")).toBe("normal");
    expect(getHistorialViewMode("/historial-pedidos/facil")).toBe("easy");
    expect(getHistorialViewMode("/admin/reportes")).toBe("admin");
  });
});
