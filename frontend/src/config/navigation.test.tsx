import { describe, expect, it } from "vitest";
import { getEasyRoute, getStandardRoute, isEasyRoute } from "./navigation";

describe("navigation route helpers", () => {
  it("maps standard routes to easy routes", () => {
    expect(getEasyRoute("/pdv")).toBe("/pdv/facil");
    expect(getEasyRoute("/pedidos")).toBe("/pedidos/facil");
    expect(getEasyRoute("/cierre-turno")).toBe("/cierre-turno/facil");
    expect(getEasyRoute("/preparacion")).toBe("/preparacion/facil");
    expect(getEasyRoute("/productos")).toBe("/productos/facil");
    expect(getEasyRoute("/inventario")).toBe("/inventario/facil");
    expect(getEasyRoute("/cocina")).toBe("/cocina/facil");
  });

  it("uses the easy home route when redirecting from the main POS route", () => {
    expect(getEasyRoute("/pdv", { useEasyHome: true })).toBe("/modo-facil");
    expect(getEasyRoute("/pedidos", { useEasyHome: true })).toBe("/pedidos/facil");
  });

  it("maps easy routes back to standard routes", () => {
    expect(getStandardRoute("/modo-facil")).toBe("/pdv");
    expect(getStandardRoute("/pdv/facil")).toBe("/pdv");
    expect(getStandardRoute("/pedidos/facil")).toBe("/pedidos");
    expect(getStandardRoute("/cierre-turno/facil")).toBe("/cierre-turno");
    expect(getStandardRoute("/preparacion/facil")).toBe("/preparacion");
    expect(getStandardRoute("/productos/facil")).toBe("/productos");
    expect(getStandardRoute("/inventario/facil")).toBe("/inventario");
    expect(getStandardRoute("/cocina/facil")).toBe("/cocina");
  });

  it("detects easy routes", () => {
    expect(isEasyRoute("/modo-facil")).toBe(true);
    expect(isEasyRoute("/pdv/facil")).toBe(true);
    expect(isEasyRoute("/pdv")).toBe(false);
  });
});
