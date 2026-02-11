import api from "./apis";

export const getSellerOffers = () =>
  api.get("seller/offers/");

export const getPublicOffers = () =>
  api.get("offers/", {
    params: { _ts: Date.now() }, // avoid stale CDN/browser cache on home carousel
  });

export const addOffer = (data) =>
  api.post("seller/offers/", data);

export const updateOffer = (id, data) =>
  api.put(`seller/offers/${id}/`, data);

export const deleteOffer = (id) =>
  api.delete(`seller/offers/${id}/`);
