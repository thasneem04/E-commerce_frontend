const BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || "";

export function resolveMediaUrl(path) {
  if (!path || typeof path !== "string") return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (!BASE_URL) return path;
  if (path.startsWith("/")) return `${BASE_URL}${path}`;
  return `${BASE_URL}/${path}`;
}
