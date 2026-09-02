// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuthContext } from "./AuthContext";
import { loginRequest } from "../services/auth";

vi.mock("../services/auth", () => ({
  getCurrentUser: vi.fn(),
  loginRequest: vi.fn(),
}));

describe("AuthContext", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("envía la contraseña exactamente como fue ingresada", async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      token: "token",
      user: {
        email: "admin@demo.cl",
        label: "Admin",
        role: "admin",
        username: "admin",
      },
    });
    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    });

    await act(() =>
      result.current.login({ identifier: " ADMIN ", password: " clave " }),
    );

    expect(loginRequest).toHaveBeenCalledWith("admin", " clave ");
  });
});
