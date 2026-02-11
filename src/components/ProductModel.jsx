import { useEffect, useState } from "react";
import {
  X,
  Save,
  Tag,
  IndianRupee,
  Boxes,
  ImagePlus,
  CheckCircle,
} from "lucide-react";
import api from "../api/apis";
import "./ProductModel.css";
import CategoryModel from "./CategoryModel";

export default function ProductModel({ onClose, onSaved, product }) {
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    original_price: "",
    offer_price: "",
    stock: "",
    is_active: true,
  });

  useEffect(() => {
    api.get("categories/").then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        category: product.category,
        original_price: product.original_price,
        offer_price: product.offer_price || "",
        stock: product.stock,
        is_active: product.is_active,
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (
      form.offer_price &&
      Number(form.offer_price) >= Number(form.original_price)
    ) {
      alert("Offer price must be less than original price");
      setSaving(false);
      return;
    }
    const startTime = Date.now(); // ⏱ start time

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("original_price", form.original_price);
      formData.append("offer_price", form.offer_price || "");
      formData.append("stock", form.stock);
      formData.append("is_active", form.is_active);
      if (image) formData.append("image", image);

      if (product) {
        await api.put(`products/${product.id}/`, formData);
      } else {
        await api.post("products/", formData);
      }

      onSaved();

      //  ensure loader shows at least 600ms
      const elapsed = Date.now() - startTime;
      const delay = Math.max(1000, elapsed);

      setTimeout(() => {
        onClose();
      }, delay);
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data || {}) ||
        "Save failed";
      alert(message);
      setSaving(false);
    }
  };

  return (
    <div className="vm-modal-backdrop">
      <div className="vm-modal">
        <header className="vm-modal-header">
          <h3>{product ? "Edit Product" : "Add Product"}</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          {/* Product name */}
          <div className="field">
            <Tag size={16} />
            <input
              name="name"
              placeholder="Product name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category */}
          <div className="category-row">
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="add-category-btn"
              onClick={() => setShowCategoryModal(true)}
            >
              + Add
            </button>
          </div>

          {/* Price */}
          <div className="field">
            <IndianRupee size={16} />
            <input
              name="original_price"
              type="number"
              placeholder="Price"
              value={form.original_price}
              onChange={handleChange}
              required
            />
          </div>

          {/* Offer Price */}
          <div className="field">
            <IndianRupee size={16} />
            <input
              name="offer_price"
              type="number"
              placeholder="Offer price (optional)"
              value={form.offer_price}
              onChange={handleChange}
            />
          </div>

          {/* Stock */}
          <div className="field">
            <Boxes size={16} />
            <input
              name="stock"
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={handleChange}
              required
            />
          </div>

          {/* Image */}
          <label className="upload">
            <ImagePlus size={16} />
            <span>{image ? image.name : "Upload image"}</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>

          {/* Active */}
          <label className="checkbox">
            <CheckCircle size={16} />
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
      {showCategoryModal && (
        <CategoryModel
          onClose={() => setShowCategoryModal(false)}
          onSaved={() => {
            api.get("categories/").then((res) => setCategories(res.data));
          }}
        />
      )}
    </div>
  );
}
