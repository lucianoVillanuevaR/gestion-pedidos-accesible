export const PRODUCT_IMAGE_FIELD = "imagen";
export const PRODUCT_IMAGE_FORMAT_ERROR = "Formato no permitido. Use JPG, PNG o WEBP.";
export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const PRODUCT_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const ALLOWED_PRODUCT_IMAGE_TYPES = new Set<string>(PRODUCT_IMAGE_MIME_TYPES);

export function isAllowedProductImageType(mimeType: string) {
  return ALLOWED_PRODUCT_IMAGE_TYPES.has(mimeType);
}
