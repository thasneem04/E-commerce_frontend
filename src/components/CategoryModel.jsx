import { useState } from "react";
import { X, Save, Tag } from "lucide-react";
import api from "../api/apis";
import "./CategoryModel.css";

export default function CategoryModel({ onClose, onSaved }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await api.post("categories/", { name });
      onSaved();      // refresh category list
      onClose();
    } catch {
      alert("Category creation failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vm-modal-backdrop">
      <div className="vm-modal">
        <header className="vm-modal-header">
          <h3>Add Category</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="input-icon">
            <Tag size={18} />
            <input
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <button className="primary-btn" disabled={saving}>
            <Save size={16} />
            {saving ? "Saving…" : "Save Category"}
          </button>
        </form>
      </div>
    </div>
  );
}
