import multer from "multer";
import {
  isAllowedProductImageType,
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  PRODUCT_IMAGE_FIELD,
  PRODUCT_IMAGE_FORMAT_ERROR
} from "../validations/productImage.validation";

export const uploadProductImageMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PRODUCT_IMAGE_SIZE_BYTES
  },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedProductImageType(file.mimetype)) {
      callback(new Error(PRODUCT_IMAGE_FORMAT_ERROR));
      return;
    }

    callback(null, true);
  }
}).single(PRODUCT_IMAGE_FIELD);

export function getUploadErrorMessage(error: unknown) {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return "La imagen supera el tamaño máximo permitido.";
  }

  if (error instanceof Error && error.message === PRODUCT_IMAGE_FORMAT_ERROR) {
    return error.message;
  }

  return "No se pudo subir la imagen.";
}
