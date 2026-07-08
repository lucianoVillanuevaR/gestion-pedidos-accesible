const ROLES = ["cajero", "cocina", "admin"] as const;

type UsuarioInput = {
  activo?: unknown;
  email?: unknown;
  label?: unknown;
  password?: unknown;
  role?: unknown;
  username?: unknown;
};

type UsuarioData = {
  activo?: boolean;
  email?: string;
  label?: string;
  password?: string;
  role?: (typeof ROLES)[number];
  username?: string;
};

function validateText(value: unknown, field: string, { required = false, max = 80 } = {}) {
  if (value === undefined) return required ? `${field} es obligatorio` : null;
  if (typeof value !== "string") return `${field} debe ser texto`;
  const clean = value.trim();
  if (required && !clean) return `${field} es obligatorio`;
  if (clean.length > max) return `${field} no puede superar ${max} caracteres`;
  return null;
}

export function validateUsuarioCreate(input: UsuarioInput): { data?: Required<UsuarioData>; error?: string } {
  const usernameError = validateText(input.username, "El usuario", { required: true, max: 40 });
  if (usernameError) return { error: usernameError };
  const emailError = validateText(input.email, "El email", { required: true, max: 120 });
  if (emailError) return { error: emailError };
  const labelError = validateText(input.label, "El nombre", { required: true, max: 80 });
  if (labelError) return { error: labelError };
  const passwordError = validateText(input.password, "La contraseña", { required: true, max: 120 });
  if (passwordError) return { error: passwordError };
  if (typeof input.password === "string" && input.password.trim().length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }
  if (typeof input.role !== "string" || !ROLES.includes(input.role as (typeof ROLES)[number])) {
    return { error: "El rol debe ser cajero, cocina o admin" };
  }
  if (input.activo !== undefined && typeof input.activo !== "boolean") {
    return { error: "activo debe ser verdadero o falso" };
  }

  return {
    data: {
      activo: typeof input.activo === "boolean" ? input.activo : true,
      email: (input.email as string).trim().toLowerCase(),
      label: (input.label as string).trim(),
      password: (input.password as string).trim(),
      role: input.role as (typeof ROLES)[number],
      username: (input.username as string).trim().toLowerCase()
    }
  };
}

export function validateUsuarioUpdate(input: UsuarioInput): { data?: UsuarioData; error?: string } {
  const data: UsuarioData = {};

  for (const [key, field, max] of [
    ["username", "El usuario", 40],
    ["email", "El email", 120],
    ["label", "El nombre", 80]
  ] as const) {
    if (input[key] === undefined) continue;
    const error = validateText(input[key], field, { required: true, max });
    if (error) return { error };
    data[key] = (input[key] as string).trim();
  }

  if (data.email) data.email = data.email.toLowerCase();
  if (data.username) data.username = data.username.toLowerCase();

  if (input.password !== undefined) {
    const passwordError = validateText(input.password, "La contraseña", { required: true, max: 120 });
    if (passwordError) return { error: passwordError };
    if ((input.password as string).trim().length < 6)
      return { error: "La contraseña debe tener al menos 6 caracteres" };
    data.password = (input.password as string).trim();
  }

  if (input.role !== undefined) {
    if (typeof input.role !== "string" || !ROLES.includes(input.role as (typeof ROLES)[number])) {
      return { error: "El rol debe ser cajero, cocina o admin" };
    }
    data.role = input.role as (typeof ROLES)[number];
  }

  if (input.activo !== undefined) {
    if (typeof input.activo !== "boolean") return { error: "activo debe ser verdadero o falso" };
    data.activo = input.activo;
  }

  return { data };
}
