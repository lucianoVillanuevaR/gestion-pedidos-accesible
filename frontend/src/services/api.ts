const API_URL = import.meta.env.VITE_API_URL || "/api";

export function buildApiUrl(path: string) {
  const baseUrl = API_URL.endsWith("/api") ? API_URL.slice(0, -4) : API_URL;
  return `${baseUrl}${path}`;
}
