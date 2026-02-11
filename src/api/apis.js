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

api.interceptors.request.use(
  (config) => {
    const method = (config.method || "get").toLowerCase();
    if (["post", "put", "patch", "delete"].includes(method) && csrfToken) {
      config.headers = config.headers || {};
      config.headers["X-CSRFToken"] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
