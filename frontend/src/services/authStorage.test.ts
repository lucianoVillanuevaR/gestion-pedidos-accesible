// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { AUTH_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY } from "../constants/auth";
import type { AuthUser } from "../types";
import { clearAuthSession, getAuthToken, readAuthUser, storeAuthSession, storeAuthUser } from "./authStorage";

const user: AuthUser = {
  email: "cajero@demo.cl",
  label: "Cajero",
  role: "cajero",
  username: "cajero"
};

describe("authStorage", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("guarda y lee el token y usuario de la sesión", () => {
    storeAuthSession("token-prueba", user);

    expect(getAuthToken()).toBe("token-prueba");
    expect(readAuthUser()).toEqual(user);
  });

  it("actualiza el usuario sin modificar el token", () => {
    storeAuthSession("token-prueba", user);
    storeAuthUser({ ...user, label: "Caja principal" });

    expect(getAuthToken()).toBe("token-prueba");
    expect(readAuthUser()).toMatchObject({ label: "Caja principal" });
  });

  it("limpia token y usuario conjuntamente", () => {
    storeAuthSession("token-prueba", user);
    clearAuthSession();

    expect(getAuthToken()).toBeNull();
    expect(readAuthUser()).toBeNull();
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
