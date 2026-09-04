import { afterEach, describe, expect, it, vi } from "vitest";
import { generateIdempotencyKey } from "./idempotencyKey";

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateIdempotencyKey", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("usa crypto.randomUUID cuando está disponible", () => {
    const uuid = "123e4567-e89b-42d3-a456-426614174000" as `${string}-${string}-${string}-${string}-${string}`;
    const randomUUID = vi.fn(() => uuid);
    const getRandomValues = vi.fn();
    vi.stubGlobal("crypto", { randomUUID, getRandomValues });

    expect(generateIdempotencyKey()).toBe(uuid);
    expect(randomUUID).toHaveBeenCalledOnce();
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it("usa crypto.getRandomValues como fallback y genera un UUID v4 válido", () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.set([0, 17, 34, 51, 68, 85, 102, 119, 8, 153, 170, 187, 204, 221, 238, 255]);
      return bytes;
    });
    vi.stubGlobal("crypto", { getRandomValues });

    const uuid = generateIdempotencyKey();

    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(uuid).toBe("00112233-4455-4677-8899-aabbccddeeff");
    expect(uuid).toMatch(UUID_V4_PATTERN);
  });

  it("no depende de Math.random en el fallback", () => {
    vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Math.random no debe usarse");
    });
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(255);
        return bytes;
      }
    });

    expect(generateIdempotencyKey()).toMatch(UUID_V4_PATTERN);
    expect(Math.random).not.toHaveBeenCalled();
  });
});
