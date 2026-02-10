import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";
import api from "../api/apis";
import WishlistButton from "../components/WishlistButton";
import { useShop } from "../context/ShopContext";
import "./ProductDetails.css";
import { ShoppingCart } from "lucide-react";

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

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useShop();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const images = useMemo(() => {
    if (!product) return [];
    const base = product.image ? [product.image] : [];
    return base;
  }, [product]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [productId]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    setProduct(null);
    setRelated([]);

    api
      .get(`products/${productId}/`)
      .then((res) => {
        if (!mounted) return;
        setProduct(res.data);
        const firstImage = res.data?.image || "";
        setSelectedImage(firstImage);
      })
      .catch((err) => {
        if (!mounted) return;
        if (err?.response?.status === 404) {
          setError("Product not found");
        } else {
          setError("Failed to load product");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!product?.category_name) return;
    const categoryValue = encodeURIComponent(product.category_name);
    api
      .get(`products/related/${categoryValue}/${product.id}/`)
      .then((res) => setRelated(res.data || []))
      .catch(() => setRelated([]));
  }, [product]);

  if (loading) {
    return (
      <div className="product-details-page">
        <CustomerNavbar />
        <div className="details-loading">Loading product…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-details-page">
        <CustomerNavbar />
        <div className="details-error">{error}</div>
      </div>
    );
  }

  if (!product) return null;

  const selling = product.selling_price ?? product.original_price;
  const discount = product.has_offer
    ? product.discount_percentage ?? calcDiscount(product.original_price, product.offer_price)
    : null;
  const mainImage = resolveImage(selectedImage);

  return (
    <div className="product-details-page">
      <CustomerNavbar />

      <div className="product-details">
        <div className="details-main">
          <div className="details-back">
            <Link to="/products" className="back-link">
              ← Back to Products
            </Link>
          </div>
          <div className="details-gallery">
            <div className="gallery-main">
              <WishlistButton productId={product.id} className="details-heart" />
              {mainImage ? (
                <img src={mainImage} alt={product.name} />
              ) : (
                <div className="gallery-placeholder">No image</div>
              )}
            </div>
            <div className="gallery-thumbs">
              {images.length === 0 && (
                <div className="thumb-placeholder">No images</div>
              )}
              {images.map((img) => {
                const url = resolveImage(img);
                const isActive = selectedImage === img;
                return (
                  <button
                    key={img}
                    className={`thumb ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedImage(img)}
                  >
                    {url ? <img src={url} alt={product.name} /> : "—"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="details-info">
          <h1>{product.name}</h1>
          <div className="details-price">
            <span className="selling">{formatPrice(selling)}</span>
            {product.has_offer && (
              <span className="original">
                {formatPrice(product.original_price)}
              </span>
            )}
            {product.has_offer && discount && (
              <span className="discount">{discount}% off</span>
            )}
          </div>

          <div className="details-meta">
            <span>
              Category: <strong>{product.category_name || "General"}</strong>
            </span>
            <span>
              Stock:{" "}
              <strong className={product.stock > 0 ? "in" : "out"}>
                {product.stock > 0 ? "In stock" : "Out of stock"}
              </strong>
            </span>
          </div>

          <p className="details-desc">
            {product.description || "No description provided."}
          </p>

          <div className="details-actions">
            <button
              className="btn-secondary"
              onClick={async () => {
                try {
                  await addToCart(product.id, 1);
                  navigate("/cart");
                } catch (err) {
                  if (err?.code === "AUTH_REQUIRED") {
                    navigate("/customer/login");
                    return;
                  }
                  if (err?.code === "PROFILE_REQUIRED") {
                    navigate("/customer/profile");
                  }
                }
              }}
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                navigate(`/checkout?productId=${product.id}`);
              }}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      <section className="related-section">
        <div className="related-header">
          <h3>Related Products</h3>
        </div>

        {related.length === 0 && (
          <div className="related-empty">No related products</div>
        )}

        <div className="related-list">
          {related.map((item) => {
            const imageUrl = resolveImage(item.image);
            const discountPct = item.has_offer
              ? item.discount_percentage ??
                calcDiscount(item.original_price, item.offer_price)
              : null;
            return (
              <Link
                to={`/product/${item.id}`}
                className="related-card"
                key={item.id}
              >
                <div className="related-media">
                  <WishlistButton productId={item.id} className="card-heart" />
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.name} />
                  ) : (
                    <div className="related-placeholder">No image</div>
                  )}
                  {item.has_offer && discountPct && (
                    <span className="discount-badge">
                      {discountPct}% off
                    </span>
                  )}
                </div>
                <div className="related-info">
                  <div className="related-name">{item.name}</div>
                  <div className="related-price">
                    {formatPrice(
                      item.selling_price ?? item.original_price
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
