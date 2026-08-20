import { describe, expect, it } from "vitest";
import { resolveSeedCategoryKeys } from "./seedCatalogRules";

describe("reglas confirmadas del catálogo inicial", () => {
  it("mantiene SANDWICH LUCO PATRÓN únicamente en Sandwich", () => {
    expect(resolveSeedCategoryKeys("SANDWICH LUCO PATRÓN", ["ahorros_exclusivos", "sandwich"])).toEqual(["sandwich"]);
  });

  it("conserva una sola categoría principal para los demás productos", () => {
    expect(resolveSeedCategoryKeys("CHACARERO SANDWICH", ["ahorros_exclusivos", "sandwich"])).toEqual([
      "ahorros_exclusivos"
    ]);
  });
});
