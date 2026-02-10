import { useEffect, useState } from "react";
import { X, Save, BadgePercent, Package, ArrowUpDown } from "lucide-react";
import api from "../api/apis";
import { addOffer, updateOffer } from "../api/offerApi";
import "./OfferModel.css";

export default function OfferModel({ onClose, onSaved, offer }) {
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    product: "",
    display_order: 0,
    offer_price: "",
    is_active: true,
  });

  useEffect(() => {
    api.get("products/").then((res) => setProducts(res.data));
  }, []);

  useEffect(() => {
    if (offer) {
      setForm({
        title: offer.title || "",
        subtitle: offer.subtitle || "",
        product: offer.product_id || "",
        display_order: offer.display_order || 0,
        offer_price: offer.offer_price || "",
        is_active: offer.is_active ?? true,
      });
    } else {
      setForm({
        title: "",
        subtitle: "",
        product: "",
        display_order: 0,
        offer_price: "",
        is_active: true,
      });
    }
  }, [offer]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        product: form.product,
        display_order: Number(form.display_order) || 0,
        offer_price: form.offer_price || "",
        is_active: form.is_active,
      };

      if (offer?.id) {
        await updateOffer(offer.id, payload);
      } else {
        await addOffer(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      alert("Offer save failed");
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct =
    products.find((p) => String(p.id) === String(form.product)) || null;

  return (
    <div className="vm-modal-backdrop">
      <div className="vm-modal">
        <header className="vm-modal-header">
          <h3>{offer ? "Edit Offer" : "Add Offer"}</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <BadgePercent size={16} />
            <input
              name="title"
              placeholder="Offer title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <Package size={16} />
            <select
              name="product"
              value={form.product}
              onChange={handleChange}
              required
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct?.image && (
            <div className="offer-preview">
              <img
                src={`${import.meta.env.VITE_MEDIA_BASE_URL}${selectedProduct.image}`}
                alt={selectedProduct.name}
              />
              <div className="offer-preview-text">
                <strong>{selectedProduct.name}</strong>
                <span>Image preview</span>
              </div>
            </div>
          )}

          <div className="field">
            <BadgePercent size={16} />
            <input
              name="subtitle"
              placeholder="Subtitle (optional)"
              value={form.subtitle}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <ArrowUpDown size={16} />
            <input
              name="display_order"
              type="number"
              min="0"
              placeholder="Display order"
              value={form.display_order}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <BadgePercent size={16} />
            <input
              name="offer_price"
              type="number"
              placeholder="Offer price"
              value={form.offer_price}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          <label className="checkbox">
            <BadgePercent size={16} />
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Active
          </label>

          <button
            className={`save-btn ${saving ? "loading" : ""}`}
            disabled={saving}
          >
            {saving ? <span className="loader" /> : <Save size={16} />}
            {!saving && <span>Save</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
