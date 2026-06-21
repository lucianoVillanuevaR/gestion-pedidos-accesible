import { AUTH_TOKEN_STORAGE_KEY } from "../constants/auth";
import type { ApiError } from "../types";

const API_URL = import.meta.env.VITE_API_URL?.trim() || "/api";
const DEV_SERVER_PORTS = new Set(["5173", "4173"]);

function shouldUseRelativeApi() {
  if (typeof window === "undefined") {
    return false;
  }

  return DEV_SERVER_PORTS.has(window.location.port);
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (shouldUseRelativeApi()) {
    return normalizedPath;
  }

  const normalizedBase = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const baseUrl = normalizedBase.endsWith("/api") ? normalizedBase.slice(0, -4) : normalizedBase;

  return `${baseUrl}${normalizedPath}`;
}

export function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = typeof window === "undefined" ? null : window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}

type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
  fallbackMessage: string;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
  const { authenticated = true, fallbackMessage, ...init } = options;
  const request = authenticated ? authenticatedFetch : fetch;
  const response = await request(buildApiUrl(path), init);

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("riquisimo:authorization-error", { detail: response.status }));
    }

    await throwApiError(response, fallbackMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function throwApiError(response: Response, fallbackMessage: string): Promise<never> {
  const rawBody = await response.text();

  if (!rawBody) {
    throw new Error(fallbackMessage);
  }

  let errorBody: ApiError;

  try {
    errorBody = JSON.parse(rawBody) as ApiError;
  } catch {
    throw new Error(rawBody);
  }

  throw new Error(errorBody.message || errorBody.error || fallbackMessage);
}
