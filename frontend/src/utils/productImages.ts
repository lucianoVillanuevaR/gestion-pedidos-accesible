import type { Producto } from "../types";

const productImageModules = import.meta.glob("../products/*", {
  eager: true,
  import: "default"
}) as Record<string, string>;

const MINIO_PUBLIC_URL = (import.meta.env.VITE_MINIO_PUBLIC_URL?.trim() || "http://localhost:9000").replace(/\/$/, "");
const MINIO_PRODUCT_BUCKET = import.meta.env.VITE_MINIO_BUCKET_PRODUCTOS?.trim() || "productos";
export const PRODUCT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23FFF8DC'/%3E%3Cpath d='M213 124h214a28 28 0 0 1 28 28v112a28 28 0 0 1-28 28H213a28 28 0 0 1-28-28V152a28 28 0 0 1 28-28Z' fill='%23ffffff' stroke='%23CBD5E1' stroke-width='8'/%3E%3Cpath d='m225 260 64-70 48 48 34-36 44 58H225Z' fill='%23FECE00'/%3E%3Ccircle cx='391' cy='170' r='24' fill='%23CBD5E1'/%3E%3Ctext x='320' y='327' text-anchor='middle' font-family='Arial, sans-serif' font-size='28' font-weight='700' fill='%23475569'%3ESin imagen%3C/text%3E%3C/svg%3E";

type ProductImageEntry = {
  key: string;
  url: string;
};

const productImages: ProductImageEntry[] = Object.entries(productImageModules)
  .map(([path, url]) => ({
    key: normalizeProductKey(path.split("/").pop() ?? ""),
    url
  }))
  .sort((left, right) => right.key.length - left.key.length);

const productImageAliases: Record<string, string> = {
  "2x1 sandwich inglesa carne y 2 ingredientes a eleccion":
    "2x1 sandwich iguales carne y 2 ingredientes a eleccion"
};

function normalizeProductKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bcompletos\b/g, "completo")
    .replace(/\balemanes\b/g, "aleman")
    .replace(/\s+/g, " ")
    .trim();
}

function countSharedTokens(left: string, right: string) {
  const leftTokens = new Set(left.split(" ").filter((token) => token.length > 2));
  const rightTokens = new Set(right.split(" ").filter((token) => token.length > 2));

  let score = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

export function resolveCatalogProductImage(nombre: string) {
  const normalizedName = normalizeProductKey(nombre);
  const aliasedName = productImageAliases[normalizedName] ?? normalizedName;

  const exactMatch = productImages.find((image) => image.key === aliasedName);
  if (exactMatch) {
    return exactMatch.url;
  }

  const containsMatch = productImages.find(
    (image) => aliasedName.includes(image.key) || image.key.includes(aliasedName)
  );
  if (containsMatch) {
    return containsMatch.url;
  }

  let bestMatch: ProductImageEntry | null = null;
  let bestScore = 0;

  for (const image of productImages) {
    const score = countSharedTokens(aliasedName, image.key);

    if (score > bestScore) {
      bestMatch = image;
      bestScore = score;
    }
  }

  return bestScore >= 2 ? bestMatch?.url : undefined;
}

export function resolveProductImage(producto: Pick<Producto, "imagen" | "imagenPublicUrl" | "imagenUrl" | "nombre">) {
  if (producto.imagenPublicUrl?.trim()) {
    return producto.imagenPublicUrl.trim();
  }

  const storedImageUrl = producto.imagenUrl?.trim();

  if (storedImageUrl) {
    if (storedImageUrl.startsWith("http") || storedImageUrl.startsWith("/") || storedImageUrl.startsWith("data:")) {
      return storedImageUrl;
    }

    return `${MINIO_PUBLIC_URL}/${MINIO_PRODUCT_BUCKET}/${storedImageUrl.replace(/^\/+/, "")}`;
  }

  if (producto.imagen?.trim()) {
    return producto.imagen.trim();
  }

  return resolveCatalogProductImage(producto.nombre);
}
