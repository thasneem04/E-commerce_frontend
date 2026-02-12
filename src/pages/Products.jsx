import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";
import api from "../api/apis";
import WishlistButton from "../components/WishlistButton";
import "./Products.css";
import { ShoppingCart } from "lucide-react";
import { useShop } from "../context/ShopContext";

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

function calcDiscount(original, offer) {
  const orig = Number(original);
  const off = Number(offer);
  if (!orig || !off || off >= orig) return null;
  return Math.round(((orig - off) / orig) * 100);
}

export default function Products() {
  const navigate = useNavigate();
  const { addToCart } = useShop();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryList = useMemo(() => {
    const base = [{ id: "all", name: "All", slug: "all" }];
    return base.concat(categories);
  }, [categories]);

  const fetchCategories = async () => {
    const res = await api.get("categories/");
    setCategories(res.data || []);
  };

  const fetchProducts = async (categoryValue) => {
    const params =
      categoryValue && categoryValue !== "all"
        ? { category: categoryValue }
        : {};
    const res = await api.get("products/", { params });
    setProducts(res.data || []);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([fetchCategories(), fetchProducts("all")])
      .catch(() => {
        if (mounted) setError("Failed to load products");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const onCategoryClick = async (category) => {
    if (activeCategory === category) return;
    setActiveCategory(category);
    setLoading(true);
    setError("");
    try {
      await fetchProducts(category);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    if (value === "all") {
      onCategoryClick("all");
      return;
    }
    if (value.startsWith("category:")) {
      const categoryValue = value.replace("category:", "");
      onCategoryClick(categoryValue);
    }
  };

  const visibleProducts = useMemo(() => {
    let list = [...products];
    const isCategoryFilter = filter.startsWith("category:");

    if (filter === "offers") {
      list = list.filter((p) => p.has_offer);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
    }

    if (!isCategoryFilter && filter === "price-low") {
      list.sort((a, b) => Number(a.selling_price) - Number(b.selling_price));
    }
    if (!isCategoryFilter && filter === "price-high") {
      list.sort((a, b) => Number(b.selling_price) - Number(a.selling_price));
    }

    return list;
  }, [products, filter, searchTerm]);

  return (
    <div className="products-page">
      <CustomerNavbar />

      <div className="products-layout">
        <aside className="products-sidebar">
          <h3>Categories</h3>
          <div className="category-list">
            {categoryList.map((c) => {
              const isActive =
                activeCategory === (c.slug || c.name || c.id);
              return (
                <button
                  key={c.id || c.slug || c.name}
                  className={`category-item ${isActive ? "active" : ""}`}
                  onClick={() => onCategoryClick(c.slug || c.name)}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="products-content">
          <div className="products-tools">
            <input
              className="products-search"
              type="search"
              placeholder="Search products…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="products-filter"
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="all">All products</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="offers">Offers only</option>
              {categories.map((c) => (
                <option
                  key={c.id || c.slug || c.name}
                  value={`category:${c.slug || c.name}`}
                >
                  Category: {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mobile-categories">
            {categoryList.map((c) => {
              const key = c.id || c.slug || c.name;
              const value = c.slug || c.name || c.id;
              const isActive = activeCategory === value;
              return (
                <button
                  key={key}
                  className={`category-chip ${isActive ? "active" : ""}`}
                  onClick={() => onCategoryClick(value)}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          <div className="products-header">
            <h2>All Products</h2>
            <span className="products-count">
              {loading ? "Loading…" : `${visibleProducts.length} items`}
            </span>
          </div>

          {error && <div className="products-error">{error}</div>}

          {!loading && visibleProducts.length === 0 && !error && (
            <div className="products-empty">No products found</div>
          )}

          <div className="products-grid">
            {visibleProducts.map((p) => {
              const selling = p.selling_price ?? p.original_price;
              const discount = p.has_offer
                ? p.discount_percentage ?? calcDiscount(p.original_price, p.offer_price)
                : null;
              const imageUrl = resolveImage(p.image);
              return (
                <Link
                  to={`/product/${p.id}`}
                  className="product-card"
                  key={p.id}
                >
                  <div className="product-media">
                    <WishlistButton productId={p.id} className="card-heart" />
                    {imageUrl ? (
                      <img src={imageUrl} alt={p.name} />
                    ) : (
                      <div className="product-placeholder">No image</div>
                    )}
                    {p.has_offer && discount && (
                      <span className="discount-badge">{discount}% off</span>
                    )}
                  </div>
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    {p.description && (
                      <div className="product-desc">{p.description}</div>
                    )}
                    <div className="product-price">
                      <span className="selling">{formatPrice(selling)}</span>
                      {p.has_offer && (
                        <span className="original">
                          {formatPrice(p.original_price)}
                        </span>
                      )}
                    </div>
                    <span className="category-badge">
                      {p.category_name || "General"}
                    </span>
                    <button
                      type="button"
                      className="add-cart-btn"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await addToCart(p.id, 1);
                          navigate("/cart");
                        } catch (err) {
                          if (err?.code === "AUTH_REQUIRED") {
                            navigate("/customer/login");
                            return;
                          }
                        }
                      }}
                      aria-label="Add to cart"
                    >
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
