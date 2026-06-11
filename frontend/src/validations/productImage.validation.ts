export const PRODUCT_IMAGE_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";
const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_PRODUCT_IMAGE_TYPES = new Set(PRODUCT_IMAGE_ACCEPT.split(","));

export function validateProductImageFile(file: File) {
  if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type)) {
    return "Formato no permitido. Use JPG, PNG o WEBP.";
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    return "La imagen supera el tamaño máximo permitido.";
  }

  return null;
}
