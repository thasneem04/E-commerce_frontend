import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";
import api from "../api/apis";
import { useShop } from "../context/ShopContext";
import "./Checkout.css";

const mediaBase = import.meta.env.VITE_MEDIA_BASE_URL || "";

function resolveImage(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${mediaBase}${path}`;
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { customer, loadingShop } = useShop();
  const productId = params.get("productId");
  const sizeVariantIdParam = params.get("sizeVariantId");

  const [product, setProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
    payment_method: "COD",
  });

  useEffect(() => {
    if (loadingShop) return;
    if (!customer?.authenticated) {
      navigate("/customer/login");
      return;
    }
    if (!customer?.profile_complete) {
      const target = productId
        ? `/checkout?productId=${productId}${sizeVariantIdParam ? `&sizeVariantId=${sizeVariantIdParam}` : ""}`
        : "/checkout";
      navigate("/customer/profile", { state: { redirectTo: target } });
      return;
    }
    const profileReq = api.get("customer/profile/").catch(() => null);
    if (productId) {
      Promise.all([api.get(`products/${productId}/`), profileReq])
        .then(([productRes, profileRes]) => {
          const fetched = productRes.data || {};
          if (sizeVariantIdParam) {
            const found = (fetched.size_variants || []).find(
              (v) => String(v.id) === String(sizeVariantIdParam)
            );
            fetched._selectedSizeVariant = found || null;
          } else {
            const firstActive = (fetched.size_variants || []).find(
              (v) => v.is_active !== false
            );
            fetched._selectedSizeVariant = firstActive || null;
          }
          setProduct(fetched);
          if (profileRes?.data) {
            setForm((prev) => ({
              ...prev,
              full_name: profileRes.data.name || prev.full_name,
              phone: profileRes.data.phone || prev.phone,
              address1: profileRes.data.address || prev.address1,
              city: profileRes.data.city || prev.city,
              state: profileRes.data.state || prev.state,
              pincode: profileRes.data.pincode || prev.pincode,
            }));
          }
        })
        .catch(() => setError("Failed to load checkout"))
        .finally(() => setLoading(false));
      return;
    }

    Promise.all([api.get("cart/"), profileReq])
      .then(([cartRes, profileRes]) => {
        setCartItems(cartRes.data || []);
        if (profileRes?.data) {
          setForm((prev) => ({
            ...prev,
            full_name: profileRes.data.name || prev.full_name,
            phone: profileRes.data.phone || prev.phone,
            address1: profileRes.data.address || prev.address1,
            city: profileRes.data.city || prev.city,
            state: profileRes.data.state || prev.state,
            pincode: profileRes.data.pincode || prev.pincode,
          }));
        }
      })
      .catch(() => setError("Failed to load checkout"))
      .finally(() => setLoading(false));
  }, [customer, navigate, productId, sizeVariantIdParam, loadingShop]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validate = () => {
    if (!form.full_name || !form.phone || !form.address1 || !form.city || !form.state || !form.pincode) {
      setError("Please fill all required fields");
      return false;
    }
    if (!/^\d{10}$/.test(String(form.phone))) {
      setError("Phone must be 10 digits");
      return false;
    }
    if (!/^\d{6}$/.test(String(form.pincode))) {
      setError("Pincode must be 6 digits");
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    setError("");
    if (!validate()) return;
    if (!productId && summaryItems.length === 0) {
      setError("Your cart is empty");
      return;
    }
    setSaving(true);
    try {
      if (productId && product) {
        await api.post("orders/buy-now/", {
          product_id: product.id,
          size_variant_id: product?._selectedSizeVariant?.id || null,
          quantity: 1,
          ...form,
        });
      } else {
        await api.post("orders/from-cart/", {
          ...form,
        });
        setCartItems([]);
      }
      setSuccess(true);
      setTimeout(() => navigate("/orders"), 800);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to place order");
    } finally {
      setSaving(false);
    }
  };

  const summaryItems = useMemo(() => {
    if (productId && product) {
      const price = product?.selling_price ?? product?.original_price;
      return [
        {
          id: product.id,
          name: product.name,
          image: product.image,
          size_label: product?._selectedSizeVariant?.size_label || "",
          quantity: 1,
          price,
        },
      ];
    }
    return (cartItems || []).map((item) => {
      const price = item.has_offer ? item.discounted_price : item.price;
      return {
        id: `${item.product?.id}-${item.size_variant_id || "base"}`,
        name: item.product?.name,
        image: item.product?.image,
        size_label: item.size_label || "",
        quantity: item.quantity,
        price,
      };
    });
  }, [cartItems, product, productId]);

  const subtotal = summaryItems.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);
  const delivery = 0;
  const total = subtotal + delivery;

  if (loading) {
    return (
      <div className="checkout-page">
        <CustomerNavbar />
        <div className="checkout-status">Loading checkout…</div>
      </div>
    );
  }

  if (error && !product && !productId) {
    return (
      <div className="checkout-page">
        <CustomerNavbar />
        <div className="checkout-status">{error}</div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <CustomerNavbar />
      <div className="checkout-wrapper">
        <div className="checkout-form">
          <h2>Checkout</h2>
          <div className="checkout-fields">
            <input
              name="full_name"
              placeholder="Full Name"
              value={form.full_name}
              onChange={handleChange}
              required
            />
            <input
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <input
              name="address1"
              placeholder="Address Line 1"
              value={form.address1}
              onChange={handleChange}
              required
            />
            <input
              name="address2"
              placeholder="Address Line 2 (optional)"
              value={form.address2}
              onChange={handleChange}
            />
            <input
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              required
            />
            <input
              name="state"
              placeholder="State"
              value={form.state}
              onChange={handleChange}
              required
            />
            <input
              name="pincode"
              placeholder="Pincode"
              value={form.pincode}
              onChange={handleChange}
              required
            />
            <select
              name="payment_method"
              value={form.payment_method}
              onChange={handleChange}
            >
              <option value="COD">Cash on Delivery</option>
            </select>
          </div>
          {error && <div className="checkout-error">{error}</div>}
          {success && <div className="checkout-success">Order placed!</div>}
          <button
            className="checkout-confirm"
            type="button"
            disabled={saving || (!productId && summaryItems.length === 0)}
            onClick={handleConfirm}
          >
            {saving ? "Placing..." : "Confirm Order"}
          </button>
        </div>

        <aside className="checkout-summary">
          <h3>Order Summary</h3>
          {summaryItems.length === 0 ? (
            <div className="summary-empty">Your cart is empty</div>
          ) : (
            <>
              {summaryItems.map((item) => {
                const imageUrl = resolveImage(item.image);
                return (
                  <div className="summary-card" key={item.id}>
                    <div className="summary-media">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.name} />
                      ) : (
                        <div className="summary-placeholder">No image</div>
                      )}
                    </div>
                    <div className="summary-info">
                      <div className="summary-name">{item.name}</div>
                      <div className="summary-price">
                        {formatPrice(item.price)}
                      </div>
                      {item.size_label && (
                        <div className="summary-qty">Size: {item.size_label}</div>
                      )}
                      <div className="summary-qty">Qty: {item.quantity}</div>
                    </div>
                  </div>
                );
              })}
              <div className="summary-total">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-total">
                <span>Delivery</span>
                <span>{delivery === 0 ? "Free" : formatPrice(delivery)}</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
