import { describe, expect, it, vi } from "vitest";
import { ensureProductBucketWithRetry } from "./minio";

describe("ensureProductBucketWithRetry", () => {
  it("termina inmediatamente cuando MinIO está disponible", async () => {
    const ensure = vi.fn().mockResolvedValue(undefined);
    const wait = vi.fn();

    await ensureProductBucketWithRetry({ ensure, wait });

    expect(ensure).toHaveBeenCalledOnce();
    expect(wait).not.toHaveBeenCalled();
  });

  it("espera de forma creciente hasta que MinIO queda disponible", async () => {
    const ensure = vi
      .fn()
      .mockRejectedValueOnce(new Error("no disponible"))
      .mockRejectedValueOnce(new Error("todavía no disponible"))
      .mockResolvedValue(undefined);
    const wait = vi.fn().mockResolvedValue(undefined);

    await ensureProductBucketWithRetry({ attempts: 5, ensure, initialDelayMs: 100, wait });

    expect(ensure).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenNthCalledWith(1, 100);
    expect(wait).toHaveBeenNthCalledWith(2, 200);
  });

  it("se detiene al agotar los intentos y propaga el último error", async () => {
    const lastError = new Error("MinIO fuera de servicio");
    const ensure = vi.fn().mockRejectedValue(lastError);
    const wait = vi.fn().mockResolvedValue(undefined);

    await expect(ensureProductBucketWithRetry({ attempts: 3, ensure, initialDelayMs: 25, wait })).rejects.toBe(
      lastError
    );

    expect(ensure).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenNthCalledWith(1, 25);
    expect(wait).toHaveBeenNthCalledWith(2, 50);
  });
});
