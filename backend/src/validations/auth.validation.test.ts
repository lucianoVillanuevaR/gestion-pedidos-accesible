import { describe, expect, it } from "vitest";
import { validateLoginInput } from "./auth.validation";

describe("validación de login", () => {
  it("normaliza identificador y conserva la contraseña", () => {
    expect(validateLoginInput({ identifier: " Admin@Demo.CL ", password: "123456" })).toEqual({
      data: { identifier: "admin@demo.cl", password: "123456" }
    });
  });

  it("rechaza credenciales incompletas", () => {
    expect(validateLoginInput({ identifier: "admin" })).toEqual({ error: "Debe completar usuario y contraseña" });
  });
});
