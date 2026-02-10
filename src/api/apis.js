import axios from "axios";

/**
 * Read CSRF token from cookie (Django default: csrftoken)
 */
function getCSRFToken() {
  const name = "csrftoken";
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + "=")) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

/**
 * Validate API base URL early (dev safety)
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL && import.meta.env.DEV) {
  console.error(
    "❌ VITE_API_BASE_URL is missing. Check your .env file."
  );
}

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // REQUIRED for Django session auth
  headers: {
    Accept: "application/json",
  },
});

/**
 * Attach CSRF token ONLY for unsafe methods
 */
api.interceptors.request.use(
  (config) => {
    const method = config.method?.toLowerCase();

    if (["post", "put", "patch", "delete"].includes(method)) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
