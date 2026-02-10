import CustomerNavbar from "../components/CustomerNavbar";
import { useNavigate, Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import WishlistButton from "../components/WishlistButton";
import "./Wishlist.css";
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

export default function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, addToCart, customer, loadingShop } = useShop();

  if (loadingShop) {
    return (
      <div className="wishlist-page">
        <CustomerNavbar />
        <div className="wishlist-wrapper">
          <div className="wishlist-empty">Loading…</div>
        </div>
      </div>
    );
  }

  if (!customer?.authenticated) {
    return (
      <div className="wishlist-page">
        <CustomerNavbar />
        <div className="wishlist-wrapper">
          <div className="wishlist-empty">
            Please login to view your wishlist.
            <button
              className="wishlist-cta"
              type="button"
              onClick={() => navigate("/customer/login")}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!customer?.profile_complete) {
    return (
      <div className="wishlist-page">
        <CustomerNavbar />
        <div className="wishlist-wrapper">
          <div className="wishlist-empty">
            Please complete your profile to use the wishlist.
            <button
              className="wishlist-cta"
              type="button"
              onClick={() => navigate("/customer/profile")}
            >
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <CustomerNavbar />
      <div className="wishlist-wrapper">
        <div className="wishlist-header">
          <h2>Your Wishlist</h2>
          <span>{wishlist.length} items</span>
        </div>

        {wishlist.length === 0 && (
          <div className="wishlist-empty">Your wishlist is empty</div>
        )}

        <div className="wishlist-grid">
          {wishlist.map((item) => {
            const product = item.product || {};
            const imageUrl = resolveImage(product.image);
            const price = product.has_offer
              ? product.selling_price ?? product.offer_price
              : product.original_price;

            return (
              <div className="wishlist-card" key={item.id || product.id}>
                <Link to={`/product/${product.id}`} className="wishlist-link">
                  <div className="wishlist-media">
                    <WishlistButton productId={product.id} className="card-heart" />
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} />
                    ) : (
                      <div className="wishlist-placeholder">No image</div>
                    )}
                  </div>
                  <div className="wishlist-info">
                    <div className="wishlist-name">{product.name}</div>
                    <div className="wishlist-price">{formatPrice(price)}</div>
                  </div>
                </Link>
                <div className="wishlist-actions">
                  <button
                    type="button"
                    className="wishlist-add"
                    onClick={async (e) => {
                      e.stopPropagation();
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
                    aria-label="Add to cart"
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
