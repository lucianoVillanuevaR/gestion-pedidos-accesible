import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bucketExists: vi.fn(),
  queryRaw: vi.fn()
}));

vi.mock("../config/prisma", () => ({
  default: { $queryRaw: mocks.queryRaw }
}));

vi.mock("../config/minio", () => ({
  minioClient: { bucketExists: mocks.bucketExists },
  productBucket: "productos"
}));

import { getReady } from "./health.controller";

function responseMock() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { json, status };
}

describe("getReady", () => {
  beforeEach(() => vi.clearAllMocks());

  it("responde listo cuando base de datos y MinIO están disponibles", async () => {
    mocks.queryRaw.mockResolvedValue([{ value: 1 }]);
    mocks.bucketExists.mockResolvedValue(true);
    const response = responseMock();

    await getReady({} as never, response as never);

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ status: "listo", database: true, minio: true });
  });

  it("responde 503 cuando MinIO no está disponible", async () => {
    mocks.queryRaw.mockResolvedValue([{ value: 1 }]);
    mocks.bucketExists.mockRejectedValue(new Error("MinIO fuera de servicio"));
    const response = responseMock();

    await getReady({} as never, response as never);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({ status: "no_disponible", database: true, minio: false });
  });

  it("responde 503 cuando el bucket requerido no existe", async () => {
    mocks.queryRaw.mockResolvedValue([{ value: 1 }]);
    mocks.bucketExists.mockResolvedValue(false);
    const response = responseMock();

    await getReady({} as never, response as never);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({ status: "no_disponible", database: true, minio: false });
  });

  it("responde 503 cuando la base de datos no está disponible", async () => {
    mocks.queryRaw.mockRejectedValue(new Error("DB fuera de servicio"));
    const response = responseMock();

    await getReady({} as never, response as never);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({ status: "no_disponible", database: false, minio: false });
    expect(mocks.bucketExists).not.toHaveBeenCalled();
  });
});
