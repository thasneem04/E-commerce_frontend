import CustomerNavbar from "../components/CustomerNavbar";
import { useShop } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import WishlistButton from "../components/WishlistButton";
import "./Cart.css";

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

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateCart, removeFromCart, customer, loadingShop } = useShop();

  if (loadingShop) {
    return (
      <div className="cart-page">
        <CustomerNavbar />
        <div className="cart-wrapper">
          <div className="cart-empty">Loading…</div>
        </div>
      </div>
    );
  }

  if (!customer?.authenticated) {
    return (
      <div className="cart-page">
        <CustomerNavbar />
        <div className="cart-wrapper">
          <div className="cart-empty">
            Please login to view your cart.
            <button
              className="cart-cta"
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
      <div className="cart-page">
        <CustomerNavbar />
        <div className="cart-wrapper">
          <div className="cart-empty">
            Please complete your profile to use the cart.
            <button
              className="cart-cta"
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

  const subtotal = cart.reduce((sum, item) => {
    const price = item.has_offer ? item.discounted_price : item.price;
    return sum + Number(price || 0) * Number(item.quantity || 0);
  }, 0);

  return (
    <div className="cart-page">
      <CustomerNavbar />
      <div className="cart-wrapper">
        <div className="cart-header">
          <h2>Your Cart</h2>
          <span>{cart.length} items</span>
        </div>

        {cart.length === 0 && (
          <div className="cart-empty">Your cart is empty</div>
        )}

        <div className="cart-grid">
          <div className="cart-items">
            {cart.map((item) => {
              const product = item.product || {};
              const imageUrl = resolveImage(product.image);
              const price = item.has_offer
                ? item.discounted_price
                : item.price;
              const lineTotal = Number(price || 0) * Number(item.quantity || 0);
              return (
                <div className="cart-card" key={item.id || product.id}>
                  <div className="cart-media">
                    <WishlistButton productId={product.id} className="card-heart" />
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} />
                    ) : (
                      <div className="cart-placeholder">No image</div>
                    )}
                  </div>
                  <div className="cart-info">
                    <div className="cart-name">{product.name}</div>
                    <div className="cart-price">{formatPrice(price)}</div>
                    <div className="cart-qty">
                      <button
                        type="button"
                        onClick={() =>
                          updateCart(product.id, Math.max(1, item.quantity - 1)).catch(
                            (err) => {
                              if (err?.code === "AUTH_REQUIRED") {
                                navigate("/customer/login");
                                return;
                              }
                              if (err?.code === "PROFILE_REQUIRED") {
                                navigate("/customer/profile");
                              }
                            }
                          )
                        }
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCart(product.id, item.quantity + 1).catch((err) => {
                            if (err?.code === "AUTH_REQUIRED") {
                              navigate("/customer/login");
                              return;
                            }
                            if (err?.code === "PROFILE_REQUIRED") {
                              navigate("/customer/profile");
                            }
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-line">
                      Line total: {formatPrice(lineTotal)}
                    </div>
                    <button
                      className="cart-remove"
                      type="button"
                      onClick={() =>
                        removeFromCart(product.id).catch((err) => {
                          if (err?.code === "AUTH_REQUIRED") {
                            navigate("/customer/login");
                            return;
                          }
                          if (err?.code === "PROFILE_REQUIRED") {
                            navigate("/customer/profile");
                          }
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="cart-summary">
            <h3>Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>Free</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <button
              className="checkout-btn"
              type="button"
              onClick={() => {
                if (!customer?.authenticated) {
                  navigate("/customer/login", {
                    state: { redirectTo: "/checkout" },
                  });
                  return;
                }
                if (!customer?.profile_complete) {
                  navigate("/customer/profile", {
                    state: { redirectTo: "/checkout" },
                  });
                  return;
                }
                navigate("/checkout");
              }}
            >
              Proceed to Checkout
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
