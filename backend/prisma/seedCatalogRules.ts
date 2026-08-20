export type SeedCategoryKey = "ahorros_exclusivos" | "promociones" | "completos" | "sandwich";

const confirmedPrimaryCategories = new Map<string, SeedCategoryKey>([["SANDWICH LUCO PATRÓN", "sandwich"]]);

export function resolveSeedCategoryKeys(productName: string, categoryKeys: SeedCategoryKey[]) {
  const confirmedPrimaryCategory = confirmedPrimaryCategories.get(productName);
  const primaryCategory = confirmedPrimaryCategory ?? categoryKeys[0];
  return primaryCategory ? [primaryCategory] : [];
}
