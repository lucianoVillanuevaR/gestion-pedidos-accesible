import { describe, expect, it } from "vitest";
import { getRouteMessage } from "./AccessibleRouteAnnouncer";

describe("getRouteMessage", () => {
  it("returns explicit messages for easy mode routes", () => {
    expect(getRouteMessage("/modo-facil")).toContain("Modo fácil");
    expect(getRouteMessage("/pdv/facil")).toContain("Nuevo pedido en modo fácil");
    expect(getRouteMessage("/pedidos/facil")).toContain("Pedidos en modo fácil");
    expect(getRouteMessage("/inventario/facil")).toContain("Inventario en modo fácil");
  });

  it("falls back to route metadata for known standard routes", () => {
    expect(getRouteMessage("/configuracion")).toContain("Configuracion");
  });
});
