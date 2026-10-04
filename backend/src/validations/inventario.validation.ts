export type InventarioUpdateInput = {
  expectedUpdatedAt?: unknown;
  stockActual?: unknown;
  stockMinimo?: unknown;
};

const POSTGRES_INTEGER_MAX = 2_147_483_647;

function validateNonNegativeInteger(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    return `${fieldName} debe ser un número entero entre 0 y ${POSTGRES_INTEGER_MAX}`;
  }

  if (value > POSTGRES_INTEGER_MAX) {
    return `${fieldName} no puede superar ${POSTGRES_INTEGER_MAX}`;
  }

  return null;
}

export function validateInventarioUpdate(input: InventarioUpdateInput) {
  const data: { expectedUpdatedAt: Date; stockActual?: number; stockMinimo?: number } = {
    expectedUpdatedAt: new Date(0)
  };

  if (typeof input.expectedUpdatedAt !== "string" || !input.expectedUpdatedAt.trim()) {
    return { error: "expectedUpdatedAt es obligatorio" };
  }

  const expectedUpdatedAt = new Date(input.expectedUpdatedAt);

  if (Number.isNaN(expectedUpdatedAt.getTime())) {
    return { error: "expectedUpdatedAt debe ser una fecha válida" };
  }

  data.expectedUpdatedAt = expectedUpdatedAt;

  if (input.stockActual !== undefined) {
    const error = validateNonNegativeInteger(input.stockActual, "stockActual");

    if (error) {
      return { error };
    }

    data.stockActual = input.stockActual as number;
  }

  if (input.stockMinimo !== undefined) {
    const error = validateNonNegativeInteger(input.stockMinimo, "stockMinimo");

    if (error) {
      return { error };
    }

    data.stockMinimo = input.stockMinimo as number;
  }

  if (data.stockActual === undefined && data.stockMinimo === undefined) {
    return { error: "Debe enviar stockActual o stockMinimo" };
  }

  return { data };
}
