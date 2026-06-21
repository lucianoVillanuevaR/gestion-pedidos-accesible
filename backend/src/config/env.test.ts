import { describe, expect, it } from "vitest";
import { resolveJwtSecret } from "./env";

describe("configuración de JWT_SECRET", () => {
  it("mantiene una clave local para desarrollo y test", () => {
    expect(resolveJwtSecret("development", undefined)).toBe("clave-demo-solo-desarrollo");
    expect(resolveJwtSecret("test", undefined)).toBe("clave-demo-solo-desarrollo");
  });

  it("exige una clave explícita y no demo en producción", () => {
    expect(() => resolveJwtSecret("production", undefined)).toThrow("JWT_SECRET es obligatorio");
    expect(() => resolveJwtSecret("production", "clave-demo-solo-desarrollo")).toThrow("JWT_SECRET es obligatorio");
    expect(resolveJwtSecret("production", "una-clave-configurada-externamente")).toBe(
      "una-clave-configurada-externamente"
    );
  });
});
