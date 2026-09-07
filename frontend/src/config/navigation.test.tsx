import { describe, expect, it } from "vitest";
import {
  getEasyRoute,
  getStandardRoute,
  isEasyModeControlRoute,
  isEasyRoute,
  isHistorialPedidosRoute,
  isPdvEasyModeRoute
} from "./navigation";

describe("navigation route helpers", () => {
  it("maps standard routes to easy routes", () => {
    expect(getEasyRoute("/pdv")).toBe("/pdv/facil");
    expect(getEasyRoute("/pedidos")).toBe("/pedidos/facil");
    expect(getEasyRoute("/cierre-turno")).toBe("/cierre-turno/facil");
    expect(getEasyRoute("/preparacion")).toBe("/preparacion/facil");
    expect(getEasyRoute("/productos")).toBe("/productos/facil");
    expect(getEasyRoute("/inventario")).toBe("/inventario/facil");
    expect(getEasyRoute("/historial-pedidos")).toBe("/historial-pedidos/facil");
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
    expect(getStandardRoute("/historial-pedidos/facil")).toBe("/historial-pedidos");
    expect(getStandardRoute("/cocina/facil")).toBe("/cocina");
  });

  it("detects easy routes", () => {
    [
      "/modo-facil",
      "/pdv/facil",
      "/pedidos/facil",
      "/cierre-turno/facil",
      "/preparacion/facil",
      "/productos/facil",
      "/inventario/facil",
      "/historial-pedidos/facil",
      "/cocina/facil"
    ].forEach((pathname) => expect(isEasyRoute(pathname)).toBe(true));
    expect(isEasyRoute("/pdv")).toBe(false);
    expect(isEasyRoute("/admin")).toBe(false);
  });

  it("reconoce ambas rutas compartidas del historial", () => {
    expect(isHistorialPedidosRoute("/historial-pedidos")).toBe(true);
    expect(isHistorialPedidosRoute("/historial-pedidos/facil")).toBe(true);
    expect(isHistorialPedidosRoute("/admin/reportes")).toBe(false);
  });

  it("muestra el control de modo fácil en el PDV y en rutas fáciles, nunca en Admin", () => {
    expect(isEasyModeControlRoute("/pdv")).toBe(true);
    expect(isEasyModeControlRoute("/historial-pedidos/facil")).toBe(true);
    expect(isEasyModeControlRoute("/admin/reportes")).toBe(false);
  });

  it("limita la disponibilidad de modo fácil al flujo PDV", () => {
    expect(isPdvEasyModeRoute("/pdv")).toBe(true);
    expect(isPdvEasyModeRoute("/pdv/facil")).toBe(true);
    expect(isPdvEasyModeRoute("/modo-facil")).toBe(true);
    expect(isPdvEasyModeRoute("/admin")).toBe(false);
    expect(isPdvEasyModeRoute("/admin/productos")).toBe(false);
    expect(isPdvEasyModeRoute("/cocina")).toBe(false);
  });
});
