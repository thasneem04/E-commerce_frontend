import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";
import api from "../api/apis";
import { useShop } from "../context/ShopContext";
import "./CustomerProfile.css";

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { customer, refreshCustomer, logoutCustomer, loadingShop } = useShop();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loadingShop) return;
    if (!customer?.authenticated) {
      navigate("/customer/login");
      return;
    }
    api
      .get("customer/profile/")
      .then((res) => setForm(res.data))
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [customer, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put("customer/profile/", form);
      await refreshCustomer();
      navigate("/products");
    } catch (err) {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-profile-page">
        <CustomerNavbar />
        <div className="profile-loading">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="customer-profile-page">
      <CustomerNavbar />
      <div className="profile-wrapper">
        <div className="profile-card">
          <h2>Complete Your Profile</h2>
          <p>
            Please fill all fields before placing an order.
          </p>
          <form onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="Full name"
              value={form.name || ""}
              onChange={handleChange}
              required
            />
            <input
              name="phone"
              placeholder="Phone"
              value={form.phone || ""}
              onChange={handleChange}
              required
            />
            <input
              name="address"
              placeholder="Address"
              value={form.address || ""}
              onChange={handleChange}
              required
            />
            <input
              name="city"
              placeholder="City"
              value={form.city || ""}
              onChange={handleChange}
              required
            />
            <input
              name="state"
              placeholder="State"
              value={form.state || ""}
              onChange={handleChange}
              required
            />
            <input
              name="pincode"
              placeholder="Pincode"
              value={form.pincode || ""}
              onChange={handleChange}
              required
            />
            {error && <div className="profile-error">{error}</div>}
            <div className="profile-actions">
              <button className="profile-save" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </button>
              <button
                className="profile-logout"
                type="button"
                onClick={async () => {
                  await logoutCustomer();
                  navigate("/");
                }}
              >
                Logout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
