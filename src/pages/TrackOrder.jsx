import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";
import api from "../api/apis";
import { resolveMediaUrl } from "../utils/media";
import "./TrackOrder.css";

const steps = ["placed", "shipped", "out_for_delivery", "delivered"];

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
}

function getLineTotal(item) {
  if (item?.line_total !== undefined && item?.line_total !== null && item?.line_total !== "") {
    return item.line_total;
  }
  const qty = Number(item?.quantity);
  const price = Number(item?.price);
  if (!Number.isFinite(qty) || !Number.isFinite(price)) return null;
  return qty * price;
}

export default function TrackOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const loadOrder = async ({ silent } = {}) => {
    if (!silent) {
      setRefreshing(true);
    }
    try {
      const res = await api.get(`orders/${id}/`);
      setOrder(res.data);
      setError("");
    } catch {
      setError("Failed to load order");
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    api
      .get(`orders/${id}/`)
      .then((res) => setOrder(res.data))
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadOrder({ silent: true });
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="track-page">
        <CustomerNavbar />
        <div className="track-status">Loading order…</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="track-page">
        <CustomerNavbar />
        <div className="track-status">{error || "Order not found"}</div>
      </div>
    );
  }

  const currentIndex = steps.indexOf(order.status);

  return (
    <div className="track-page">
      <CustomerNavbar />
      <div className="track-wrapper">
        <div className="track-head">
          <h2>Track Order #{order.id}</h2>
          <div className="track-actions">
            <button
              type="button"
              className="track-refresh"
              onClick={() => loadOrder()}
              disabled={refreshing}
            >
              {refreshing ? "Updating..." : "Refresh"}
            </button>
            <button
              type="button"
              className="track-back"
              onClick={() => navigate("/orders")}
            >
              Back to Orders
            </button>
          </div>
        </div>

        <div className="track-card">
          <div className="track-summary">
            <div>
              <div className="track-title">Delivery address</div>
              <div className="track-text">
                {order.full_name}, {order.address}, {order.city},{" "}
                {order.state} - {order.pincode}
              </div>
            </div>
            <div>
              <div className="track-title">Estimated delivery</div>
              <div className="track-text">
                {order.estimated_delivery_date
                  ? new Date(order.estimated_delivery_date).toLocaleDateString()
                  : "—"}
                {typeof order.remaining_days === "number" &&
                  ` (${order.remaining_days} days)`}
              </div>
            </div>
          </div>

          <div className="track-timeline">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`track-step ${
                  index <= currentIndex ? "done" : ""
                } ${step === order.status ? "current" : ""}`}
              >
                <div className="dot" />
                <div className="label">{step.replace(/_/g, " ")}</div>
                {index < steps.length - 1 && <div className="line" />}
              </div>
            ))}
          </div>
        </div>

        <div className="track-items">
          <h3>Items</h3>
          {(order.items || []).map((item) => {
            const imageUrl = resolveMediaUrl(
              item.product?.image || item.image || ""
            );
            const lineTotal = getLineTotal(item);
            const name = item.product?.name || item.product_name;
            const category = item.product?.category_name;
            return (
              <div className="track-item" key={item.id}>
                <div className="track-item-image-wrap">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="track-item-image"
                      onClick={() => setPreviewImage(imageUrl)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="track-item-placeholder">No image</div>
                  )}
                </div>
                <div className="track-item-details">
                  <div className="track-item-name">{name}</div>
                  {category && (
                    <div className="track-item-category">{category}</div>
                  )}
                  <div className="track-item-meta">
                    Unit: {formatPrice(item.price)} · Qty: {item.quantity}
                  </div>
                </div>
                <div className="track-item-total">
                  {formatPrice(lineTotal)}
                </div>
              </div>
            );
          })}
          <div className="track-total">
            Total: {formatPrice(order.total_amount)}
          </div>
        </div>
      </div>
      {previewImage && (
        <div
          className="image-preview-backdrop"
          onClick={() => setPreviewImage(null)}
        >
          <div className="image-preview">
            <img src={previewImage} alt="Preview" />
            <button
              className="close-btn"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
