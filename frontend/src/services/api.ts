import type { ApiError } from "../types";
import { getAuthToken } from "./authStorage";

const API_URL = import.meta.env.VITE_API_URL?.trim() || "/api";

function buildApiUrl(path: string) {
  let normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBase = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

  if (normalizedBase.endsWith("/api") && (normalizedPath === "/api" || normalizedPath.startsWith("/api/"))) {
    normalizedPath = normalizedPath.slice(4) || "/";
  }

  return `${normalizedBase}${normalizedPath}`;
}

function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getAuthToken();
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

async function throwApiError(response: Response, fallbackMessage: string): Promise<never> {
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
