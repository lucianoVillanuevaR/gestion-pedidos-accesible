import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl, resolveJwtSecret, resolveMinioCredential } from "./env";

describe("configuración de JWT_SECRET", () => {
  it("mantiene una clave local para desarrollo y test", () => {
    expect(resolveJwtSecret("development", undefined)).toBe("clave-demo-solo-desarrollo");
    expect(resolveJwtSecret("test", undefined)).toBe("clave-demo-solo-desarrollo");
  });

  it("exige una clave explícita y no demo en producción", () => {
    expect(() => resolveJwtSecret("production", undefined)).toThrow("JWT_SECRET es obligatorio");
    expect(() => resolveJwtSecret("production", "x")).toThrow("32 caracteres");
    expect(() => resolveJwtSecret("production", "changeme")).toThrow("32 caracteres");
    expect(() => resolveJwtSecret("production", "clave-demo-solo-desarrollo")).toThrow("JWT_SECRET es obligatorio");
    expect(() => resolveJwtSecret("production", "cambiar_esta_clave_en_produccion_por_una_larga_y_segura")).toThrow(
      "JWT_SECRET es obligatorio"
    );
    const secureSecret = "una-clave-configurada-externamente-de-32-caracteres";
    expect(resolveJwtSecret("production", secureSecret)).toBe(secureSecret);
  });
});

describe("credenciales externas", () => {
  it("rechaza credenciales conocidas de MinIO únicamente en producción", () => {
    expect(() => resolveMinioCredential("production", "MINIO_ACCESS_KEY", "admin", "admin")).toThrow(
      "credenciales demo"
    );
    expect(() => resolveMinioCredential("production", "MINIO_ACCESS_KEY", "minioadmin", "admin")).toThrow(
      "credenciales demo"
    );
    expect(() => resolveMinioCredential("production", "MINIO_SECRET_KEY", "admin123456", "admin123456")).toThrow(
      "credenciales demo"
    );
    expect(resolveMinioCredential("development", "MINIO_ACCESS_KEY", undefined, "admin")).toBe("admin");
    expect(resolveMinioCredential("development", "MINIO_SECRET_KEY", undefined, "admin123456")).toBe("admin123456");
  });

  it("valida DATABASE_URL y rechaza las URLs demo en producción", () => {
    expect(() => resolveDatabaseUrl("production", undefined)).toThrow("obligatorio");
    expect(() => resolveDatabaseUrl("production", "no-es-url")).toThrow("PostgreSQL válida");
    expect(() => resolveDatabaseUrl("production", "postgresql://admin:admin123@postgres:5432/sistema_pedidos")).toThrow(
      "credenciales demo"
    );
    expect(resolveDatabaseUrl("production", "postgresql://app:clave-segura@db:5432/pedidos")).toBe(
      "postgresql://app:clave-segura@db:5432/pedidos"
    );
    expect(resolveDatabaseUrl("development", undefined)).toBe(
      "postgresql://postgres:postgres@localhost:5432/riquisimo"
    );
  });
});
