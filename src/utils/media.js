const MEDIA_BASE_URL = (import.meta.env.VITE_MEDIA_BASE_URL || "").trim();
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "").trim();

function deriveBaseFromApi(apiBase) {
  if (!apiBase) return "";
  try {
    const url = new URL(apiBase);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

const FALLBACK_BASE_URL = deriveBaseFromApi(API_BASE_URL);
const BASE_URL = MEDIA_BASE_URL || FALLBACK_BASE_URL;

export function resolveMediaUrl(path) {
  if (!path || typeof path !== "string") return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("//")) {
    return `https:${path}`;
  }
  if (!BASE_URL) return path;
  if (path.startsWith("/")) return `${BASE_URL}${path}`;
  return `${BASE_URL}/${path}`;
}
