import { describe, expect, it } from "vitest";
import { assertDemoEnvironment, requireDemoPassword } from "./demoSafety";

const safe = {
  NODE_ENV: "development",
  DEMO_MODE: "true",
  DATABASE_URL: "postgresql://demo:example@localhost:15434/riquisimo_demo"
};

describe("aislamiento obligatorio de la demo", () => {
  it("acepta únicamente la base local identificada", () => {
    expect(() => assertDemoEnvironment(safe)).not.toThrow();
  });
  it.each([
    { NODE_ENV: "production" },
    { NODE_ENV: undefined },
    { DEMO_MODE: undefined },
    { DATABASE_URL: "postgresql://demo:example@localhost/sistema_pedidos" },
    { DATABASE_URL: "postgresql://demo:example@institucion.cl/riquisimo_demo" },
    { DATABASE_URL: "postgresql://demo:example@localhost/riquisimo_demo?schema=real" },
    { DATABASE_URL: "https://localhost/riquisimo_demo" },
    { DATABASE_URL: "invalid" }
  ])("rechaza destinos inseguros sin exponer la conexión", (override) => {
    expect(() => assertDemoEnvironment({ ...safe, ...override })).toThrow();
    try {
      assertDemoEnvironment({ ...safe, ...override });
    } catch (error) {
      expect(String(error)).not.toContain("example@");
    }
  });
  it("exige una contraseña configurable sin valor predeterminado", () => {
    for (const password of [undefined, "123456", "cambiar_clave_demo"]) {
      expect(() => requireDemoPassword(password)).toThrow();
    }
    expect(requireDemoPassword("only-for-unit-test-123")).toBe("only-for-unit-test-123");
  });
});
