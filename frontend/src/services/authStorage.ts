import { AUTH_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY } from "../constants/auth";
import type { AuthUser } from "../types";

function getSessionStorage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function isValidUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as AuthUser;
  return Boolean(
    candidate.email &&
    candidate.label &&
    candidate.username &&
    (candidate.role === "cajero" || candidate.role === "cocina" || candidate.role === "admin")
  );
}

export function getAuthToken() {
  return getSessionStorage()?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
}

export function readAuthUser() {
  const storage = getSessionStorage();
  if (!storage?.getItem(AUTH_TOKEN_STORAGE_KEY)) {
    return null;
  }

  try {
    const rawValue = storage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);
    return isValidUser(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function storeAuthUser(user: AuthUser | null) {
  const storage = getSessionStorage();
  if (!storage) return;

  if (user) {
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    storage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function storeAuthSession(token: string, user: AuthUser) {
  const storage = getSessionStorage();
  if (!storage) return;

  storage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  storeAuthUser(user);
}

export function clearAuthSession() {
  const storage = getSessionStorage();
  storage?.removeItem(AUTH_TOKEN_STORAGE_KEY);
  storage?.removeItem(AUTH_STORAGE_KEY);
}
