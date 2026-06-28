export const PRODUCT_IMAGE_FORMAT_ERROR = "Formato no permitido. Use JPG, PNG o WEBP.";
export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
export const PRODUCT_IMAGE_ACCEPT = PRODUCT_IMAGE_MIME_TYPES.join(",");

const ALLOWED_PRODUCT_IMAGE_TYPES = new Set<string>(PRODUCT_IMAGE_MIME_TYPES);

export function validateProductImageFile(file: File) {
  if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type)) {
    return PRODUCT_IMAGE_FORMAT_ERROR;
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    return "La imagen supera el tamaño máximo permitido.";
  }

  return null;
}
