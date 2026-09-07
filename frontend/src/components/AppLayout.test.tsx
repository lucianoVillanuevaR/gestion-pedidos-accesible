import { describe, expect, it } from "vitest";
import { getAppLayoutChrome } from "./AppLayout";

const EASY_ROUTES = [
  "/modo-facil",
  "/pdv/facil",
  "/pedidos/facil",
  "/cierre-turno/facil",
  "/preparacion/facil",
  "/productos/facil",
  "/inventario/facil",
  "/historial-pedidos/facil",
  "/cocina/facil"
];

describe("AppLayout chrome", () => {
  it.each(EASY_ROUTES)("oculta navegación normal y offset en %s", (pathname) => {
    expect(getAppLayoutChrome(pathname)).toEqual({
      hideSidebar: true,
      showNormalTopBar: false,
      sidebarOffsetClass: ""
    });
  });

  it.each(["/pdv", "/inventario", "/admin", "/admin/usuarios"])("conserva navegación normal en %s", (pathname) => {
    expect(getAppLayoutChrome(pathname)).toEqual({
      hideSidebar: false,
      showNormalTopBar: true,
      sidebarOffsetClass: "lg:pl-[240px]"
    });
  });
});
