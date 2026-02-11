import api from "./apis";
import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ""
).trim();

function absoluteOffersUrl() {
  if (!API_BASE_URL) return "";
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  return `${base}offers/`;
}

export const getSellerOffers = () =>
  api.get("seller/offers/");

export async function getPublicOffers() {
  const requestConfig = {
    withCredentials: false,
    headers: {
      Accept: "application/json",
    },
    params: { _ts: Date.now() },
  };

  try {
    return await api.get("offers/", requestConfig);
  } catch (primaryError) {
    const fallbackUrl = absoluteOffersUrl();
    if (!fallbackUrl) throw primaryError;
    return axios.get(fallbackUrl, requestConfig);
  }
}

export const addOffer = (data) =>
  api.post("seller/offers/", data);

export const updateOffer = (id, data) =>
  api.put(`seller/offers/${id}/`, data);

export const deleteOffer = (id) =>
  api.delete(`seller/offers/${id}/`);
