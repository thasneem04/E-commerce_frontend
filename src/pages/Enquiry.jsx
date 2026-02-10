import { useEffect, useState } from "react";
import CustomerNavbar from "../components/CustomerNavbar";
import api from "../api/apis";
import { useShop } from "../context/ShopContext";
import "./Enquiry.css";

export default function Enquiry() {
  const { customer, loadingShop } = useShop();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "General",
    orderId: "",
    message: "",
  });
  const [enquiries, setEnquiries] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadEnquiries = async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await api.get("customer/enquiries/");
      setEnquiries(res.data || []);
    } catch {
      setListError("Failed to load your enquiries");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (!customer?.authenticated) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || customer.name || "",
      email: prev.email || customer.email || "",
    }));
  }, [customer]);

  useEffect(() => {
    if (loadingShop) return;
    if (!customer?.authenticated) {
      setEnquiries([]);
      return;
    }
    loadEnquiries();
  }, [customer, loadingShop]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("enquiry/", {
        name: form.name,
        email: form.email,
        subject: form.subject,
        order_id: form.orderId,
        message: form.message,
      });
      setSubmitted(true);
      setForm({
        name: customer?.name || "",
        email: customer?.email || "",
        subject: "General",
        orderId: "",
        message: "",
      });
      if (customer?.authenticated) {
        await loadEnquiries();
      }
      setTimeout(() => setSubmitted(false), 2500);
    } catch {
      setError("Failed to send enquiry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="enquiry-page">
      <CustomerNavbar />
      <div className="enquiry-wrapper">
        <div className="enquiry-card">
          <div className="enquiry-header">
            <h2>Contact / Enquiry</h2>
            <p>Have a question? We’re happy to help.</p>
          </div>

          <form className="enquiry-form" onSubmit={handleSubmit}>
            <div className="enquiry-grid">
              <input
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="enquiry-grid">
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
              >
                <option value="General">General</option>
                <option value="Order">Order related</option>
                <option value="Payment">Payment</option>
                <option value="Delivery">Delivery</option>
                <option value="Other">Other</option>
              </select>
              <input
                name="orderId"
                placeholder="Order ID (optional)"
                value={form.orderId}
                onChange={handleChange}
              />
            </div>

            <textarea
              name="message"
              placeholder="Tell us a little more..."
              value={form.message}
              onChange={handleChange}
              rows={5}
              required
            />

            {submitted && (
              <div className="enquiry-success">
                Thanks! Your message has been sent.
              </div>
            )}
            {error && <div className="enquiry-error">{error}</div>}

            <button className="enquiry-submit" type="submit" disabled={saving}>
              {saving ? "Sending..." : "Send Enquiry"}
            </button>
          </form>

          {customer?.authenticated && (
            <div className="enquiry-history">
              <div className="enquiry-history-head">
                <h3>Your Enquiries</h3>
                {listLoading && <span>Loading…</span>}
              </div>
              {listError && (
                <div className="enquiry-error">{listError}</div>
              )}
              {!listLoading && !listError && enquiries.length === 0 && (
                <div className="enquiry-empty">No enquiries yet</div>
              )}
              {!listLoading && enquiries.length > 0 && (
                <div className="enquiry-list">
                  {enquiries.map((enq) => (
                    <div className="enquiry-item" key={enq.id}>
                      <div className="enquiry-item-head">
                        <span className="enquiry-subject">
                          {enq.subject}
                        </span>
                        <span className="enquiry-date">
                          {new Date(enq.created_at).toLocaleString()}
                        </span>
                      </div>
                      {enq.order_id && (
                        <div className="enquiry-order">
                          Order ID: {enq.order_id}
                        </div>
                      )}
                      <div className="enquiry-message">{enq.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="enquiry-info">
          <h3>VasanthaMaaligai</h3>
          <div className="info-item">
            <span className="info-label">Phone</span>
            <span>+91 98765 43210</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email</span>
            <span>support@vasanthamaaligai.com</span>
          </div>
          <div className="info-item">
            <span className="info-label">Location</span>
            <span>Tiruppur, Tamil Nadu</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
