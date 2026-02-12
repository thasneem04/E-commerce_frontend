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
import grabLatest from "../assets/grab_our_latest_products.png";
import cookwarePromo from "../assets/All_50_Off_1.png";
import appliancesPromo from "../assets/All.png";
import lionPromo from "../assets/li.png";
import "./CustomerLanding.css";

export default function CustomerLanding() {
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [offersError, setOffersError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    getPublicOffers()
      .then((res) => {
        const payload = res?.data;
        const normalized = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
            ? payload.results
            : payload
              ? [payload]
              : [];
        const visibleOffers = normalized
          .filter((o) => o && o.is_active !== false)
          .sort(
            (a, b) => Number(a?.display_order || 0) - Number(b?.display_order || 0)
          );
        setOffers(visibleOffers);
        setOffersError("");
      })
      .catch((err) => {
        console.error("Failed to load offers", err);
        setOffers([]);
        const detail =
          err?.response?.data?.detail ||
          (typeof err?.response?.data === "string" ? err.response.data : "");
        setOffersError(detail || "Unable to load offers right now");
      })
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

  useEffect(() => {
    const revealNodes = document.querySelectorAll(".scroll-reveal");
    if (!revealNodes.length) return;

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealNodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

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
              <li>
                <ShoppingBag size={18} />
                <span>Free shipping throughout India</span>
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
              <div className="ads-meta">
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
                  <div className="ad-heading">
                    {offersError ? "Offers unavailable" : "No offers yet"}
                  </div>
                  <div className="ad-subtitle">
                    {offersError || "Check back soon for fresh deals"}
                  </div>
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
        <div className="scroll-hint">Scroll down to know more about us</div>
      </section>

      <section className="logo-intro">
        <div className="logo-intro-inner">
          <div className="logo-stage scroll-reveal reveal-left">
            <div className="logo-halo" />
            <div className="logo-orbit" />
            <div className="logo-orbit orbit-2" />
            <div className="logo-card">
              <img src="/MrLionLogoFinal.png" alt="VasanthaMaaligai logo" />
            </div>
          </div>
          <div className="logo-copy scroll-reveal reveal-right">
            <p className="logo-eyebrow">A MARK OF TRUST &amp; TRADITION</p>
            <h2>Premium Stainless Steel Vessels Crafted for Generations</h2>
            <p>
              At VasanthaMaaligai, we bring you a curated collection of high-quality
              kitchen vessels designed to combine strength, elegance, and long-lasting
              performance. Every product reflects our commitment to durability, safety,
              and timeless craftsmanship.
            </p>
            <p>
              From everyday cooking essentials to premium serving pieces, our vessels
              are built to withstand daily use while maintaining their shine and
              structure for years.
            </p>
          </div>
        </div>
      </section>

      <section className="latest-products">
        <div className="latest-inner">
          <div className="latest-panel scroll-reveal reveal-left">
            <div className="latest-panel-title">FEATURED PRODUCT</div>
            <div className="featured-media">
              <img src={grabLatest} alt="Featured product" />
            </div>
            <div className="featured-name">Premium Kitchen Essentials</div>
            <div className="featured-desc">
              Crafted for durability and elegance, designed to elevate everyday
              cooking.
            </div>
            <Link to="/products" className="latest-cta primary">
              <ShoppingBag size={16} />
              Shop Now
            </Link>
          </div>
          <div className="latest-card scroll-reveal reveal-right">
            <h3>Discover Our Premium Collection</h3>
            <Link to="/products" className="latest-cta secondary">
              <ShoppingBag size={16} />
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      <section className="cookware-feature">
        <div className="cookware-feature-inner">
          <div className="cookware-feature-media scroll-reveal reveal-left">
            <img src={cookwarePromo} alt="Cookware offer" />
          </div>
          <div className="cookware-feature-content scroll-reveal reveal-right">
            <p className="cookware-kicker">VasanthaMaaligai</p>
            <h2>COOKWARE</h2>
            <p>
              Explore top-notch cookware in Erode for an elevated culinary
              journey. From non-stick pans to stylish stainless steel, our
              collection blends durability with elegance, making every meal a
              masterpiece.
            </p>
            <Link to="/products" className="cookware-btn">
              COOKWARE OFFERS
            </Link>
          </div>
        </div>
      </section>

      <section className="appliances-feature">
        <div className="appliances-feature-inner">
          <div className="appliances-feature-content scroll-reveal reveal-left">
            <p className="cookware-kicker">VasanthaMaaligai</p>
            <h2>APPLIANCES</h2>
            <p>
              Upgrade your kitchen with cutting-edge appliances in Erode. From
              efficient blenders to advanced coffee makers, our collection
              combines technology and style for a seamless culinary experience.
              Transform your kitchen into a hub of innovation.
            </p>
            <Link to="/products" className="cookware-btn">
              BUY NOW
            </Link>
          </div>
          <div className="appliances-feature-media scroll-reveal reveal-right">
            <img src={appliancesPromo} alt="Appliances offer" />
          </div>
        </div>
      </section>

      <section className="cookware-feature lion-feature">
        <div className="cookware-feature-inner">
          <div className="cookware-feature-media scroll-reveal reveal-left">
            <img src={lionPromo} alt="Mr.Lion offer" />
          </div>
          <div className="cookware-feature-content scroll-reveal reveal-right">
            <p className="cookware-kicker">VasanthaMaaligai</p>
            <h2>MR.LION</h2>
            <p>
              Discover the essence of quality and innovation with Mr.Lion. Our
              stylish cookware and cutting-edge kitchen appliances redefine
              culinary excellence, ensuring each moment in your kitchen is a
              roar of sophistication. Elevate your experience with Mr.Lion.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
