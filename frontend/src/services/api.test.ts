// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api";

function successfulResponse() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
}

describe("apiRequest", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("agrega el prefijo /api a rutas de negocio", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest<{ ok: boolean }>("/pedidos", { fallbackMessage: "Error" });

    expect(fetchMock).toHaveBeenCalledWith("/api/pedidos", expect.any(Object));
  });

  it("evita duplicar /api en una ruta ya prefijada", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest<{ ok: boolean }>("/api/pedidos", { fallbackMessage: "Error" });

    expect(fetchMock).toHaveBeenCalledWith("/api/pedidos", expect.any(Object));
  });
});
