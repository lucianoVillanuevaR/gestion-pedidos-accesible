export type LoginValidationResult =
  | { data: { identifier: string; password: string }; error?: never }
  | { data?: never; error: string };

export function validateLoginInput(input: { identifier?: unknown; password?: unknown }): LoginValidationResult {
  const identifier = typeof input.identifier === "string" ? input.identifier.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!identifier || !password) {
    return { error: "Debe completar usuario y contraseña" };
  }

  return { data: { identifier, password } };
}
