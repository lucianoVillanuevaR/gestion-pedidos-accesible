const productImageModules = import.meta.glob("../products/*", {
  eager: true,
  import: "default"
}) as Record<string, string>;

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

export function resolveProductImage(nombre: string) {
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
