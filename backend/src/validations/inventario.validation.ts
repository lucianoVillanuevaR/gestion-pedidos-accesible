export type InventarioUpdateInput = {
  stockActual?: unknown;
  stockMinimo?: unknown;
};

function validateNonNegativeInteger(value: unknown, fieldName: string) {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    return `${fieldName} debe ser un número entero mayor o igual a 0`;
  }

  return null;
}

export function validateInventarioUpdate(input: InventarioUpdateInput) {
  const data: { stockActual?: number; stockMinimo?: number } = {};

  if (input.stockActual !== undefined) {
    const error = validateNonNegativeInteger(input.stockActual, "stockActual");

    if (error) {
      return { error };
    }

    data.stockActual = Number(input.stockActual);
  }

  if (input.stockMinimo !== undefined) {
    const error = validateNonNegativeInteger(input.stockMinimo, "stockMinimo");

    if (error) {
      return { error };
    }

    data.stockMinimo = Number(input.stockMinimo);
  }

  if (Object.keys(data).length === 0) {
    return { error: "Debe enviar stockActual o stockMinimo" };
  }

  return { data };
}
