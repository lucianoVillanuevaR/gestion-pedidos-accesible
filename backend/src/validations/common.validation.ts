export function validatePositiveIntegerId(value: unknown, fieldName = "ID") {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return `${fieldName} inválido`;
  }

  return null;
}

export function parsePositiveIntegerId(value: unknown) {
  return Number(value);
}
