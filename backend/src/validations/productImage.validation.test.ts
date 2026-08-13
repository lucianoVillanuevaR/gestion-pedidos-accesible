import { describe, expect, it } from "vitest";
import { hasValidProductImageSignature } from "./productImage.validation";

describe("firma de imágenes de producto", () => {
  it("acepta las firmas declaradas de JPG, PNG y WEBP", () => {
    expect(hasValidProductImageSignature(Buffer.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg")).toBe(true);
    expect(hasValidProductImageSignature(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png")).toBe(true);
    expect(hasValidProductImageSignature(Buffer.from("RIFF0000WEBP"), "image/webp")).toBe(true);
  });

  it("rechaza contenido de texto aunque declare image/png", () => {
    expect(hasValidProductImageSignature(Buffer.from("contenido falso"), "image/png")).toBe(false);
  });
});
