const CLP_FORMATTER = new Intl.NumberFormat("es-CL", {
  currency: "CLP",
  maximumFractionDigits: 0,
  style: "currency"
});

export function formatCurrency(value: number | string) {
  const amount = Number(value);
  return Number.isNaN(amount) ? String(value) : CLP_FORMATTER.format(amount);
}

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
