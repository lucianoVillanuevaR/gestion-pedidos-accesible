import { describe, expect, it } from "vitest";
import { validateUsuarioCreate, validateUsuarioUpdate } from "./usuarios.validation";

const validUser = {
  username: "admin.seguro",
  email: "ADMIN@EXAMPLE.COM ",
  label: "Administrador",
  password: "clave-segura",
  role: "admin"
};

describe("validación de usuarios", () => {
  it("normaliza email y username", () => {
    const result = validateUsuarioCreate(validUser);
    expect(result.data).toMatchObject({ username: "admin.seguro", email: "admin@example.com" });
  });

  it("rechaza email inválido", () => {
    expect(validateUsuarioCreate({ ...validUser, email: "correo-invalido" }).error).toBe(
      "El email no tiene un formato válido"
    );
  });

  it("rechaza contraseñas de menos de ocho caracteres", () => {
    expect(validateUsuarioCreate({ ...validUser, password: "1234567" }).error).toContain("8 caracteres");
  });

  it("rechaza un PATCH vacío", () => {
    expect(validateUsuarioUpdate({}).error).toBe("Debe enviar al menos un campo para actualizar");
  });
});
