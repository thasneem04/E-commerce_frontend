import { useEffect, useState } from "react";
import {
  X,
  Save,
  Tag,
  FileText,
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
    description: "",
    is_active: true,
    size_variants: [],
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
        description: product.description || "",
        is_active: product.is_active,
        size_variants: Array.isArray(product.size_variants)
          ? product.size_variants.map((v, index) => ({
              size_label: v.size_label || "",
              original_price: v.original_price ?? "",
              offer_price: v.offer_price ?? "",
              stock: v.stock ?? 0,
              display_order: v.display_order ?? index,
              is_active: v.is_active !== false,
            }))
          : [],
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      size_variants: [
        ...(prev.size_variants || []),
        {
          size_label: "",
          original_price: "",
          offer_price: "",
          stock: 0,
          display_order: prev.size_variants?.length || 0,
          is_active: true,
        },
      ],
    }));
  };

  const removeVariant = (index) => {
    setForm((prev) => ({
      ...prev,
      size_variants: (prev.size_variants || []).filter((_, i) => i !== index),
    }));
  };

  const updateVariant = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      size_variants: (prev.size_variants || []).map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
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
    for (const v of form.size_variants || []) {
      if (!String(v.size_label || "").trim()) {
        alert("Each size variant must have a size label");
        setSaving(false);
        return;
      }
      if (!v.original_price || Number(v.original_price) <= 0) {
        alert(`Size "${v.size_label}" must have a valid original price`);
        setSaving(false);
        return;
      }
      if (
        v.offer_price !== "" &&
        v.offer_price !== null &&
        v.offer_price !== undefined &&
        Number(v.offer_price) >= Number(v.original_price)
      ) {
        alert(`Size "${v.size_label}" offer price must be less than original price`);
        setSaving(false);
        return;
      }
    }
    const startTime = Date.now(); // ⏱ start time

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("original_price", form.original_price);
      formData.append("offer_price", form.offer_price || "");
      formData.append("stock", form.stock);
      formData.append("description", form.description || "");
      formData.append("is_active", form.is_active);
      if (Array.isArray(form.size_variants) && form.size_variants.length > 0) {
        formData.append(
          "size_variants_payload",
          JSON.stringify(
            form.size_variants.map((v, index) => ({
              size_label: String(v.size_label || "").trim(),
              original_price: v.original_price,
              offer_price: v.offer_price === "" ? null : v.offer_price,
              stock: Number(v.stock || 0),
              display_order: Number(v.display_order ?? index),
              is_active: v.is_active !== false,
            }))
          )
        );
      }
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

          <div className="field">
            <FileText size={16} />
            <textarea
              name="description"
              placeholder="Product description"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="variant-block">
            <div className="variant-header">
              <strong>Size-wise Pricing</strong>
              <button
                type="button"
                className="add-category-btn"
                onClick={addVariant}
              >
                + Add Size
              </button>
            </div>
            {(form.size_variants || []).map((variant, index) => (
              <div className="variant-row" key={`variant-${index}`}>
                <input
                  type="text"
                  placeholder="Size (e.g. 7 Inch)"
                  value={variant.size_label}
                  onChange={(e) => updateVariant(index, "size_label", e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Original price"
                  value={variant.original_price}
                  onChange={(e) => updateVariant(index, "original_price", e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Offer price (optional)"
                  value={variant.offer_price}
                  onChange={(e) => updateVariant(index, "offer_price", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={variant.stock}
                  onChange={(e) => updateVariant(index, "stock", e.target.value)}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeVariant(index)}
                  aria-label={`Remove size ${index + 1}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
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
