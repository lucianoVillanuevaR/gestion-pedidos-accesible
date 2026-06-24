import { describe, expect, it } from "vitest";
import { formatCurrency, normalizeSearchText } from "./formatters";

describe("formatters", () => {
  it("formatea números y textos numéricos como pesos chilenos", () => {
    expect(formatCurrency(3900)).toBe(formatCurrency("3900"));
    expect(formatCurrency(3900)).toContain("3.900");
  });

  it("conserva valores monetarios no numéricos", () => {
    expect(formatCurrency("Sin precio")).toBe("Sin precio");
  });

  it("normaliza texto para búsquedas", () => {
    expect(normalizeSearchText("  SÁNDWICH Alemán  ")).toBe("sandwich aleman");
  });
});
