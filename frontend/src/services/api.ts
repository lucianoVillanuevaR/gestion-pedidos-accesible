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
