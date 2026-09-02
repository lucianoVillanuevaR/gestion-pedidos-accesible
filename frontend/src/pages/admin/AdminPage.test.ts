import { describe, expect, it } from "vitest";
import { ROLE_PERMISSIONS } from "./AdminPage";

describe("ROLE_PERMISSIONS", () => {
  it("muestra los permisos existentes y Reportes solo para Admin", () => {
    expect(ROLE_PERMISSIONS).toEqual([
      {
        role: "admin",
        permissions: {
          Pedidos: true,
          Productos: true,
          Inventario: true,
          Ventas: true,
          Usuarios: true,
          Cocina: true,
          Reportes: true
        }
      },
      {
        role: "cajero",
        permissions: {
          Pedidos: true,
          Productos: true,
          Inventario: true,
          Ventas: true,
          Usuarios: false,
          Cocina: true,
          Reportes: false
        }
      },
      {
        role: "cocina",
        permissions: {
          Pedidos: false,
          Productos: false,
          Inventario: false,
          Ventas: false,
          Usuarios: false,
          Cocina: true,
          Reportes: false
        }
      }
    ]);
  });
});
