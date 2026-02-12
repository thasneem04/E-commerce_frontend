import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";
import api from "../api/apis";
import WishlistButton from "../components/WishlistButton";
import { useShop } from "../context/ShopContext";
import "./ProductDetails.css";
import { ShoppingCart } from "lucide-react";



function resolveImage(path) {
  if (!path) return null;

  // Cloudinary / absolute URL
  if (path.startsWith("http")) return path;

  // Fallback (only if old media exists)
  return `https://e-commercebackend-production-c3a7.up.railway.app${path}`;
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
  const [selectedVariantId, setSelectedVariantId] = useState(null);

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
        const variants = Array.isArray(res.data?.size_variants)
          ? res.data.size_variants.filter((v) => v.is_active !== false)
          : [];
        setSelectedVariantId(variants.length > 0 ? variants[0].id : null);
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
  const activeVariants = Array.isArray(product.size_variants)
    ? product.size_variants.filter((v) => v.is_active !== false)
    : [];
  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) || null;
  const displaySelling = selectedVariant
    ? selectedVariant.selling_price ?? selectedVariant.original_price
    : selling;
  const displayOriginal = selectedVariant
    ? selectedVariant.original_price
    : product.original_price;
  const displayOffer = selectedVariant ? selectedVariant.offer_price : product.offer_price;
  const discount = product.has_offer
    ? product.discount_percentage ?? calcDiscount(product.original_price, product.offer_price)
    : null;
  const variantDiscount = selectedVariant
    ? selectedVariant.discount_percentage ??
      calcDiscount(selectedVariant.original_price, selectedVariant.offer_price)
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
            <span className="selling">{formatPrice(displaySelling)}</span>
            {(selectedVariant ? !!displayOffer : product.has_offer) && (
              <span className="original">
                {formatPrice(displayOriginal)}
              </span>
            )}
            {(selectedVariant ? variantDiscount : discount) && (
              <span className="discount">
                {(selectedVariant ? variantDiscount : discount)}% off
              </span>
            )}
          </div>

          {activeVariants.length > 0 && (
            <div className="size-picker">
              <div className="size-picker-label">Size</div>
              <div className="size-options">
                {activeVariants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={`size-option ${
                      selectedVariantId === variant.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedVariantId(variant.id)}
                  >
                    {variant.size_label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="details-meta">
            <span>
              Category: <strong>{product.category_name || "General"}</strong>
            </span>
            <span>
              Stock:{" "}
              <strong
                className={
                  (selectedVariant ? selectedVariant.stock : product.stock) > 0
                    ? "in"
                    : "out"
                }
              >
                {(selectedVariant ? selectedVariant.stock : product.stock) > 0
                  ? "In stock"
                  : "Out of stock"}
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
                  await addToCart(product.id, 1, selectedVariant?.id || null);
                  navigate("/cart");
                } catch (err) {
                  if (err?.code === "AUTH_REQUIRED") {
                    navigate("/customer/login");
                    return;
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
                const sizeQuery = selectedVariant?.id
                  ? `&sizeVariantId=${selectedVariant.id}`
                  : "";
                navigate(`/checkout?productId=${product.id}${sizeQuery}`);
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
                    <div className="related-placeholder">No related products</div>
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
