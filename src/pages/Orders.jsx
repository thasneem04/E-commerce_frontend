import { useEffect, useState } from "react";
import CustomerNavbar from "../components/CustomerNavbar";
import api from "../api/apis";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { resolveMediaUrl } from "../utils/media";
import "./Orders.css";

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

export default function Orders() {
  const navigate = useNavigate();
  const { customer, loadingShop } = useShop();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const loadOrders = () => {
    setLoading(true);
    setError("");
    return api
      .get("orders/")
      .then((res) => setOrders(res.data || []))
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (loadingShop) {
      setLoading(true);
      return;
    }
    if (customer?.authenticated === false) {
      navigate("/customer/login");
      return;
    }
    loadOrders();
  }, [customer, loadingShop, navigate]);

  return (
    <div className="orders-page">
      <CustomerNavbar />
      <div className="orders-wrapper">
        <h2>My Orders</h2>

        {loading && <div className="orders-empty">Loading orders…</div>}
        {!loading && error && <div className="orders-empty">{error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div className="orders-empty">
            You have not placed any orders yet
          </div>
        )}

        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-head">
                <div>
                  <div className="order-id">Order #{order.id}</div>
                  <div className="order-date">
                    {new Date(order.created_at).toLocaleString()}
                  </div>
                </div>
                <span className={`order-status ${order.status}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-delivery">
                Delivery by{" "}
                {order.estimated_delivery_date
                  ? new Date(order.estimated_delivery_date).toLocaleDateString()
                  : "—"}{" "}
                {typeof order.remaining_days === "number" &&
                  `(${order.remaining_days} days)`}
              </div>
              <div className="order-total">
                Total: {formatPrice(order.total_amount)}
              </div>
              <div className="order-items">
                {(order.items || []).map((item) => {
                  const imageUrl = resolveMediaUrl(
                    item.product?.image || item.image || ""
                  );
                  const lineTotal = getLineTotal(item);
                  const name = item.product?.name || item.product_name;
                  const category = item.product?.category_name;
                  return (
                    <div className="order-item" key={item.id}>
                      <div className="order-item-image-wrap">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={name}
                            className="order-item-image"
                            onClick={() => setPreviewImage(imageUrl)}
                            loading="lazy"
                          />
                        ) : (
                          <div className="order-item-placeholder">No image</div>
                        )}
                      </div>
                      <div className="order-item-details">
                        <div className="order-item-name">{name}</div>
                        {category && (
                          <div className="order-item-category">{category}</div>
                        )}
                        <div className="order-item-meta">
                          Unit: {formatPrice(item.price)} · Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="order-item-total">
                        {formatPrice(lineTotal)}
                      </div>
                    </div>
                  );
                })}
                {(order.items || []).length === 0 && (
                  <div className="order-item">No items</div>
                )}
              </div>
              <button
                className="order-track"
                type="button"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                Track Order
              </button>
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <button
                  className="order-cancel"
                  type="button"
                  disabled={updatingId === order.id}
                  onClick={async () => {
                    try {
                      setUpdatingId(order.id);
                      await api.patch(`orders/${order.id}/cancel/`);
                      await loadOrders();
                    } catch {
                      setError("Failed to cancel order");
                    } finally {
                      setUpdatingId(null);
                    }
                  }}
                >
                  {updatingId === order.id ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
            </div>
          ))}
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
