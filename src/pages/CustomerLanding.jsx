import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";
import {
  CheckCircle,
  Store,
  Wallet,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { getPublicOffers } from "../api/offerApi";
import { resolveMediaUrl } from "../utils/media";
import "./CustomerLanding.css";

export default function CustomerLanding() {
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    getPublicOffers()
      .then((res) => setOffers(res.data))
      .catch((err) => console.error("Failed to load offers", err))
      .finally(() => setLoadingOffers(false));
  }, []);

  useEffect(() => {
    if (offers.length <= 1 || paused) return;
    const max = offers.length;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % max);
    }, 3200);
    return () => clearInterval(timer);
  }, [offers.length, paused]);

  useEffect(() => {
    setActiveIndex(0);
  }, [offers.length]);

  return (
    <div className="customer-page">
      <CustomerNavbar />

      <section className="home-hero">
        <div className="hero-wrapper">
          {/* LEFT CONTENT */}
          <div className="hero-content">
            <h1>
              Welcome to <span>VasanthaMaaligai</span>
            </h1>

            <p>
              Traditional quality products with a modern shopping experience.
            </p>

            <ul className="hero-highlights">
              <li>
                <CheckCircle size={18} />
                <span>Quality traditional products</span>
              </li>
              <li>
                <Store size={18} />
                <span>Trusted local store</span>
              </li>
              <li>
                <Wallet size={18} />
                <span>Affordable daily essentials</span>
              </li>
            </ul>

            <div className="hero-actions">
              <Link to="/products" className="primary-btn">
                <ShoppingBag size={18} />
                Shop Now
              </Link>

            </div>
          </div>

          {/* RIGHT – ADS */}
          <div className="hero-ads">
            <div className="ads-header">
              <h3>Mega Offers</h3>
              <div className="ads-dots">
                {offers.map((_, i) => (
                  <button
                    key={i}
                    className={`dot ${i === activeIndex ? "active" : ""}`}
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Go to offer ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div
              className="ads-viewport"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {loadingOffers && (
                <div className="ad-item single">
                  <div className="ad-heading">Loading offers…</div>
                  <div className="ad-subtitle">Please wait</div>
                </div>
              )}

              {!loadingOffers && offers.length === 0 && (
                <div className="ad-item single">
                  <div className="ad-heading">No offers yet</div>
                  <div className="ad-subtitle">Check back soon for fresh deals</div>
                </div>
              )}

              {!loadingOffers && offers.length > 0 && (
                <div
                  className="ads-track"
                  style={{
                    transform: `translate3d(-${activeIndex * 100}%, 0, 0)`,
                  }}
                >
                  {offers.map((o) => (
                    <div className="ad-item" key={o.id}>
                      <div className="ad-heading">
                        {o.title || o.product_name || "Special Offer"}
                      </div>
                      <div className="ad-product">
                        <div className="ad-media">
                          {o.image ? (
                            <img
                              src={resolveMediaUrl(o.image)}
                              alt={o.title || "Offer"}
                              className="ad-image"
                            />
                          ) : (
                            <div className="ad-placeholder">No image available</div>
                          )}
                        </div>
                        <div className="ad-price">
                          {o.offer_price && o.original_price ? (
                            <>
                              <span className="price-off">₹{o.original_price}</span>
                              <span className="price-on">₹{o.offer_price}</span>
                            </>
                          ) : (
                            <span className="price-on">
                              {o.original_price || o.offer_price
                                ? `₹${o.original_price || o.offer_price}`
                                : "Price not set"}
                            </span>
                          )}
                        </div>
                        <div className="ad-subtitle">
                          {o.subtitle || "Limited time offer"}
                        </div>
                      </div>
                      {o.product_id ? (
                        <Link
                          to={`/product/${o.product_id}`}
                          className="ad-cta"
                        >
                          Buy Now <ArrowRight size={16} />
                        </Link>
                      ) : (
                        <Link to="/products" className="ad-cta">
                          Buy Now <ArrowRight size={16} />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
