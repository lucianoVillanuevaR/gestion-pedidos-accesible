export const PRODUCT_IMAGE_FIELD = "imagen";
export const PRODUCT_IMAGE_FORMAT_ERROR = "Formato no permitido. Use JPG, PNG o WEBP.";
export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const PRODUCT_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const ALLOWED_PRODUCT_IMAGE_TYPES = new Set<string>(PRODUCT_IMAGE_MIME_TYPES);

export function isAllowedProductImageType(mimeType: string) {
  return ALLOWED_PRODUCT_IMAGE_TYPES.has(mimeType);
}

export function hasValidProductImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }
  return false;
}
