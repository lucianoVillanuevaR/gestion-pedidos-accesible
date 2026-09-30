import { describe, expect, it } from "vitest";
import { canRoleTransitionPedido } from "./pedidoRules";

describe("autorización frontend de transiciones por rol", () => {
  it.each([
    ["cocina", "pendiente", "en_preparacion", true],
    ["cocina", "en_preparacion", "listo", true],
    ["cocina", "pendiente", "cancelado", false],
    ["cocina", "en_preparacion", "cancelado", false],
    ["cocina", "listo", "entregado", false],
    ["cajero", "pendiente", "cancelado", true],
    ["cajero", "en_preparacion", "cancelado", true],
    ["cajero", "listo", "entregado", true],
    ["cajero", "pendiente", "en_preparacion", false],
    ["cajero", "en_preparacion", "listo", false],
    ["admin", "pendiente", "cancelado", true],
    ["admin", "en_preparacion", "cancelado", true],
    ["admin", "listo", "entregado", false],
    ["admin", "pendiente", "en_preparacion", false],
    ["admin", "en_preparacion", "listo", false]
  ] as const)("%s: %s → %s = %s", (role, current, next, expected) => {
    expect(canRoleTransitionPedido(role, current, next)).toBe(expected);
  });
});
