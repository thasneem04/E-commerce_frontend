import api from "./apis";
import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ""
).trim();

function publicApiUrl(path) {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  return `${base}${path}`;
}

export const getSellerOffers = () =>
  api.get("seller/offers/");

export const getPublicOffers = () =>
  axios.get(publicApiUrl("offers/"), {
    withCredentials: false,
    headers: {
      Accept: "application/json",
    },
    params: { _ts: Date.now() }, // avoid stale CDN/browser cache on home carousel
  });

export const addOffer = (data) =>
  api.post("seller/offers/", data);

export const updateOffer = (id, data) =>
  api.put(`seller/offers/${id}/`, data);

export const deleteOffer = (id) =>
  api.delete(`seller/offers/${id}/`);
