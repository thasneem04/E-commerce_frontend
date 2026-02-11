import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL (or fallback VITE_API_URL) is missing");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

let csrfToken = null;

export async function bootstrapCsrf() {
  const response = await api.get("csrf/");
  csrfToken = response?.data?.csrfToken || null;
  return csrfToken;
}

function isCsrfFailure(error) {
  const response = error?.response;
  if (!response || response.status !== 403) return false;

  const detail = response?.data?.detail;
  if (typeof detail === "string" && detail.toLowerCase().includes("csrf")) {
    return true;
  }

  if (typeof response?.data === "string" && response.data.toLowerCase().includes("csrf")) {
    return true;
  }

  return false;
}

api.interceptors.request.use(
  async (config) => {
    const method = (config.method || "get").toLowerCase();
    const isUnsafe = ["post", "put", "patch", "delete"].includes(method);

    if (isUnsafe) {
      if (!csrfToken) {
        await bootstrapCsrf();
      }
      if (csrfToken) {
        config.headers = config.headers || {};
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (!originalRequest || originalRequest._retryCsrf) {
      return Promise.reject(error);
    }

    if (!isCsrfFailure(error)) {
      return Promise.reject(error);
    }

    try {
      originalRequest._retryCsrf = true;
      await bootstrapCsrf();
      if (csrfToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["X-CSRFToken"] = csrfToken;
      }
      return api(originalRequest);
    } catch (retryError) {
      return Promise.reject(retryError);
    }
  }
);

export default api;
