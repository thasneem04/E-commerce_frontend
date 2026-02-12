import { useEffect, useState } from "react";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Package,
  IndianRupee,
  BadgePercent,
  Boxes,
  CheckCircle,
  Archive,
  LogOut,
  Tag,
  Search,
  Truck,
  MessageCircle,
} from "lucide-react";
import api from "../api/apis";
import ProductModel from "../components/ProductModel";
import OfferModel from "../components/OfferModel";
import { getSellerOffers, deleteOffer } from "../api/offerApi";
import { resolveMediaUrl } from "../utils/media";
import "./Dashboard.css";
import { useLocation, useNavigate } from "react-router-dom";

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
}

function getLineTotal(item) {
  if (item?.line_total !== undefined && item?.line_total !== null && item?.line_total !== "") {
    return item.line_total;
  }
  const qty = Number(item?.quantity);
  const price = Number(item?.price);
  if (!Number.isFinite(qty) || !Number.isFinite(price)) return null;
  return qty * price;
}

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [view, setView] = useState("active");
  const [customers, setCustomers] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [expandedCustomers, setExpandedCustomers] = useState(new Set());
  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [enquiriesError, setEnquiriesError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [showAlert, setShowAlert] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showOfferAlert, setShowOfferAlert] = useState(false);
  const [offerDeleteId, setOfferDeleteId] = useState(null);
  const [deletingOffer, setDeletingOffer] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [search, setSearch] = useState("");

  const isProductView = view === "active" || view === "inactive";
  const isOffersView = view === "offers";
  const isOrdersView = view === "orders";
  const isEnquiriesView = view === "enquiries";

  const statusFlow = ["placed", "shipped", "out_for_delivery", "delivered"];
  const nextStatusOptions = (current) => {
    const idx = statusFlow.indexOf(current);
    if (idx === -1) return statusFlow;
    return statusFlow.slice(idx);
  };

  const handleStatusChange = async (orderId, next) => {
    if (!orderId || !next) return;
    try {
      await api.patch(`seller/orders/${orderId}/status/`, {
        status: next,
      });
      setCustomers((prev) =>
        prev.map((customer) => ({
          ...customer,
          orders: (customer.orders || []).map((order) =>
            order.id === orderId ? { ...order, status: next } : order
          ),
        }))
      );
      setToast("Status updated");
      setTimeout(() => setToast(""), 1500);
    } catch {
      setToast("Update failed");
      setTimeout(() => setToast(""), 1500);
    }
  };

  const toggleCustomer = (key) => {
    setExpandedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getCustomerKey = (c) =>
    c.customer_id ?? c.customer_email ?? c.phone ?? c.customer_name;

  const loadOrders = async ({ silent } = {}) => {
    if (!silent) {
      setOrdersLoading(true);
      setOrdersError("");
    }
    try {
      const res = await api.get("seller/orders/?group=customer");
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      if (!silent) {
        setOrdersError("Failed to load orders");
      }
    } finally {
      if (!silent) {
        setOrdersLoading(false);
      }
    }
  };

  const loadEnquiries = async ({ silent } = {}) => {
    if (!silent) {
      setEnquiriesLoading(true);
      setEnquiriesError("");
    }
    try {
      const res = await api.get("seller/enquiries/");
      setEnquiries(res.data || []);
    } catch (err) {
      console.error("Failed to fetch enquiries", err);
      if (!silent) {
        setEnquiriesError("Failed to load enquiries");
      }
    } finally {
      if (!silent) {
        setEnquiriesLoading(false);
      }
    }
  };

  const visibleProducts =
    isProductView && isSearching && search.trim() !== ""
      ? products.filter((p) => {
          const q = search.toLowerCase();
          return (
            p.name?.toLowerCase().includes(q) ||
            p.category_name?.toLowerCase().includes(q)
          );
        })
      : products;

  // FETCH PRODUCTS
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const endpoint = view === "inactive" ? "products/inactive/" : "products/";
      const res = await api.get(endpoint);
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname.includes("/seller/orders")) {
      setView("orders");
      return;
    }
    if (location.pathname.includes("/seller/enquiries")) {
      setView("enquiries");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isProductView) {
      fetchProducts();
      setSearch("");
      setIsSearching(false);
    }
    if (isOffersView) {
      setOffersLoading(true);
      getSellerOffers()
        .then((res) => setOffers(res.data))
        .catch((err) => console.error("Failed to fetch offers", err))
        .finally(() => setOffersLoading(false));
    }
    if (isOrdersView) {
      loadOrders();
    }
    if (isEnquiriesView) {
      loadEnquiries();
    }
  }, [view]);

  useEffect(() => {
    if (!isOrdersView && !isEnquiriesView) return;
    const interval = setInterval(() => {
      if (isOrdersView) {
        loadOrders({ silent: true });
      }
      if (isEnquiriesView) {
        loadEnquiries({ silent: true });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isOrdersView, isEnquiriesView]);


  // LOGOUT (SESSION BASED)
  const handleLogout = async () => {
    try {
      await api.post("auth/logout/");
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h1 className="logo">Vasanthamaaligai</h1>

        <nav className="menu">
          <button
            className={`icon-text ${view === "active" ? "active" : ""}`}
            onClick={() => {
              setView("active");
              navigate("/seller");
            }}
          >
            <CheckCircle size={16} />
            <span>Active Products</span>
          </button>

          <button
            className={`icon-text ${view === "inactive" ? "active" : ""}`}
            onClick={() => {
              setView("inactive");
              navigate("/seller");
            }}
          >
            <Archive size={16} />
            <span>Inactive Products</span>
          </button>

          <button
            className={`icon-text ${view === "offers" ? "active" : ""}`}
            onClick={() => {
              setView("offers");
              navigate("/seller");
            }}
          >
            <BadgePercent size={16} />
            <span>Offers</span>
          </button>

          <button
            className={`icon-text ${view === "orders" ? "active" : ""}`}
            onClick={() => {
              setView("orders");
              navigate("/seller/orders");
            }}
          >
            <Truck size={16} />
            <span>Orders</span>
          </button>
          <button
            className={`icon-text ${view === "enquiries" ? "active" : ""}`}
            onClick={() => {
              setView("enquiries");
              navigate("/seller/enquiries");
            }}
          >
            <MessageCircle size={16} />
            <span>Enquiry</span>
          </button>
        </nav>
        <button className="logout icon-text" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="main-header">
          <h2>
            {view === "active"
              ? "Products"
              : view === "inactive"
                ? "Inactive Products"
                : view === "offers"
                  ? "Offers"
                  : view === "orders"
                    ? "Orders"
                    : "Enquiry"}
          </h2>

          {isProductView && (
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search products or categories…"
                value={search}
                onFocus={() => setIsSearching(true)}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => {
                  if (search.trim() === "") {
                    setIsSearching(false);
                  }
                }}
              />
            </div>
          )}

          {view === "active" && (
            <button
              className="primary-btn"
              onClick={() => {
                setEditingProduct(null);
                setShowModal(true);
              }}
            >
              <Plus size={16} /> Add Product
            </button>
          )}

          {view === "offers" && (
            <button
              className="primary-btn"
              onClick={() => {
                setEditingOffer(null);
                setShowOfferModal(true);
              }}
            >
              <Plus size={16} /> Add Offer
            </button>
          )}
        </header>

        {isProductView && loading && <p>Loading…</p>}

        {isProductView && !loading && products.length === 0 && (
          <p>No products found</p>
        )}

        {isProductView && (
          <div className="grid">
            {visibleProducts.map((p) => (
              <div className="card" key={p.id}>
                {p.image && (
                  <img
                    src={resolveMediaUrl(p.image)}
                    alt={p.name}
                    className="card-image"
                    onClick={() =>
                      setPreviewImage(resolveMediaUrl(p.image))
                    }
                  />
                )}
                <h3 className="icon-text">
                  <Package size={18} />
                  <span>{p.name}</span>
                </h3>

                <span className="category icon-text">
                  <Tag size={14} />
                  <span>{p.category_name}</span>
                </span>

                <p className="icon-text">
                  <IndianRupee size={14} />
                  <span>{p.original_price}</span>
                </p>

                <p className="icon-text">
                  <BadgePercent size={14} />
                  <span>{p.offer_price ? `₹${p.offer_price}` : "No offer"}</span>
                </p>

                {Array.isArray(p.size_variants) && p.size_variants.length > 0 && (
                  <p className="icon-text">
                    <Tag size={14} />
                    <span>
                      {p.size_variants
                        .map((v) => `${v.size_label}: ₹${v.selling_price ?? v.original_price}`)
                        .join(" | ")}
                    </span>
                  </p>
                )}

                <p
                  className={`icon-text stock ${
                    p.stock <= 5 ? "low stock-alert" : "ok"
                  }`}
                >
                  <Boxes size={30} />
                  <span>Stock: {p.stock}</span>

                  {p.stock <= 5 && (
                    <AlertTriangle size={25} className="alert-icon" />
                  )}
                </p>

                <div className="actions">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setEditingProduct(p);
                      setShowModal(true);
                    }}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className="icon-btn danger"
                    onClick={() => {
                      setDeleteId(p.id);
                      setShowAlert(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isOffersView && offersLoading && <p>Loading offers…</p>}

        {isOffersView && !offersLoading && offers.length === 0 && (
          <p>No offers found</p>
        )}

        {isOffersView && (
          <div className="grid offers-grid">
            {offers.map((o) => (
              <div className="card offer-card" key={o.id}>
                {o.image && (
                  <img
                    src={resolveMediaUrl(o.image)}
                    alt={o.title}
                    className="offer-image"
                    onClick={() =>
                      setPreviewImage(resolveMediaUrl(o.image))
                    }
                  />
                )}
                <h3 className="icon-text">
                  <BadgePercent size={18} />
                  <span>{o.title}</span>
                </h3>
                {o.subtitle && <p>{o.subtitle}</p>}
                <p className="icon-text">
                  <Tag size={14} />
                  <span>{o.product_name || `Product ID: ${o.product_id}`}</span>
                </p>
                <p className="icon-text">
                  <IndianRupee size={14} />
                  <span>
                    {o.offer_price ? `₹${o.offer_price}` : `₹${o.original_price}`}
                  </span>
                </p>
                <p className="icon-text">
                  <Boxes size={16} />
                  <span>Display Order: {o.display_order}</span>
                </p>
                <span className={`offer-status ${o.is_active ? "ok" : "low"}`}>
                  {o.is_active ? "Active" : "Inactive"}
                </span>
                <div className="actions">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setEditingOffer(o);
                      setShowOfferModal(true);
                    }}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className="icon-btn danger"
                    onClick={() => {
                      setOfferDeleteId(o.id);
                      setShowOfferAlert(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isOrdersView && ordersLoading && <p>Loading orders…</p>}

        {isOrdersView && !ordersLoading && ordersError && (
          <p>{ordersError}</p>
        )}

        {isOrdersView && !ordersLoading && !ordersError && customers.length === 0 && (
          <p>No orders found</p>
        )}

        {isOrdersView && (
          <div className="customer-orders">
            {customers.map((customer) => {
              const key = getCustomerKey(customer);
              const expanded = expandedCustomers.has(key);
              return (
                <div className="customer-card" key={key}>
                  <div className="customer-head">
                    <div className="customer-meta">
                      <div className="customer-name">
                        {customer.customer_name || "Customer"}
                      </div>
                      <div className="customer-contact">
                        {customer.customer_email && (
                          <span>{customer.customer_email}</span>
                        )}
                        {customer.phone && <span>{customer.phone}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="customer-toggle"
                      onClick={() => toggleCustomer(key)}
                    >
                      {expanded ? "Hide Orders" : "View Orders"}
                    </button>
                  </div>

                  <div className="customer-stats">
                    <div>
                      <span className="stat-label">Orders</span>
                      <span className="stat-value">
                        {customer.total_orders || 0}
                      </span>
                    </div>
                    <div>
                      <span className="stat-label">Total Value</span>
                      <span className="stat-value">
                        {formatPrice(customer.total_value)}
                      </span>
                    </div>
                    <div>
                      <span className="stat-label">Last Order</span>
                      <span className="stat-value">
                        {customer.last_order_date
                          ? new Date(customer.last_order_date).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {expanded && (
                    <div className="customer-orders-list">
                      {(customer.orders || []).map((o) => (
                        <div className="order-card" key={o.id}>
                          <div className="order-top">
                            <div>
                              <div className="order-id">Order #{o.id}</div>
                              <div className="order-date">
                                {new Date(o.created_at).toLocaleString()}
                              </div>
                            </div>
                            <span className={`order-status ${o.status}`}>
                              {o.status}
                            </span>
                          </div>
                          <div className="order-items">
                            {o.items.map((it) => {
                              const imageUrl = resolveMediaUrl(it.image);
                              const lineTotal = getLineTotal(it);
                              return (
                                <div className="order-item" key={it.product_id}>
                                  <div className="order-item-image-wrap">
                                    {imageUrl ? (
                                      <img
                                        src={imageUrl}
                                        alt={it.product_name}
                                        className="order-item-image"
                                        onClick={() => setPreviewImage(imageUrl)}
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="order-item-placeholder">
                                        No image
                                      </div>
                                    )}
                                  </div>
                                  <div className="order-item-details">
                                    <div className="order-item-name">
                                      {it.product_name}
                                    </div>
                                    {it.size_label && (
                                      <div className="order-item-category">
                                        Size: {it.size_label}
                                      </div>
                                    )}
                                    {it.category_name && (
                                      <div className="order-item-category">
                                        {it.category_name}
                                      </div>
                                    )}
                                    <div className="order-item-unit">
                                      Unit: {formatPrice(it.price)}
                                    </div>
                                  </div>
                                  <div className="order-item-pricing">
                                    <div>Qty: {it.quantity}</div>
                                    <div className="order-item-total">
                                      {formatPrice(lineTotal)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="order-total">
                            Total: {formatPrice(o.total_amount)}
                          </div>
                          <div className="order-actions">
                            <select
                              value={o.status}
                              onChange={(e) =>
                                handleStatusChange(o.id, e.target.value)
                              }
                              disabled={
                                o.status === "cancelled" ||
                                o.status === "delivered"
                              }
                            >
                              {(o.status === "cancelled" ||
                              o.status === "delivered"
                                ? [o.status]
                                : nextStatusOptions(o.status)
                              ).map((s) => (
                                <option key={s} value={s}>
                                  {s.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isEnquiriesView && enquiriesLoading && <p>Loading enquiries…</p>}

        {isEnquiriesView && !enquiriesLoading && enquiriesError && (
          <p>{enquiriesError}</p>
        )}

        {isEnquiriesView &&
          !enquiriesLoading &&
          !enquiriesError &&
          enquiries.length === 0 && <p>No enquiries found</p>}

        {isEnquiriesView && (
          <div className="enquiry-list">
            {enquiries.map((e) => (
              <div className="enquiry-card" key={e.id}>
                <div className="enquiry-top">
                  <div>
                    <div className="enquiry-name">{e.name}</div>
                    <div className="enquiry-email">{e.email}</div>
                  </div>
                  <span className="enquiry-subject">{e.subject}</span>
                </div>
                {e.order_id && (
                  <div className="enquiry-order">Order ID: {e.order_id}</div>
                )}
                <div className="enquiry-message">{e.message}</div>
                <div className="enquiry-date">
                  {new Date(e.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {toast && <div className="seller-toast">{toast}</div>}
      </main>

      {/* PRODUCT MODAL */}
      {showModal && (
        <ProductModel
          product={editingProduct}
          onClose={() => setShowModal(false)}
          onSaved={fetchProducts}
        />
      )}
      {showOfferModal && (
        <OfferModel
          onClose={() => setShowOfferModal(false)}
          offer={editingOffer}
          onSaved={() => {
            setOffersLoading(true);
            getSellerOffers()
              .then((res) => setOffers(res.data))
              .finally(() => setOffersLoading(false));
          }}
        />
      )}
      {previewImage && (
        <div
          className="image-preview-backdrop"
          onClick={() => setPreviewImage(null)}
        >
          <div className="image-preview">
            <img src={previewImage} alt="Preview" />
            <button className="close-btn" onClick={() => setPreviewImage(null)}>
              ✕
            </button>
          </div>
        </div>
      )}
      {showAlert && (
        <div className="alert-backdrop">
          <div className="alert-box">
            <div className="alert-header">
              <AlertTriangle size={22} />
              <h3>Deactivate Product</h3>

              <button
                className="alert-close"
                onClick={() => setShowAlert(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p>
              This product will be moved to <strong>Inactive Products</strong>.
              <br />
              You can restore it later.
            </p>

            <div className="alert-actions">
              <button
                className="alert-btn cancel"
                onClick={() => setShowAlert(false)}
              >
                Cancel
              </button>

              <button
                className="alert-btn danger"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await api.delete(`products/${deleteId}/`);
                    fetchProducts();
                  } finally {
                    setDeleting(false);
                    setShowAlert(false);
                  }
                }}
              >
                {deleting ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showOfferAlert && (
        <div className="alert-backdrop">
          <div className="alert-box">
            <div className="alert-header">
              <AlertTriangle size={22} />
              <h3>Delete Offer</h3>

              <button
                className="alert-close"
                onClick={() => setShowOfferAlert(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p>
              This offer will be permanently deleted.
              <br />
              This action cannot be undone.
            </p>

            <div className="alert-actions">
              <button
                className="alert-btn cancel"
                onClick={() => setShowOfferAlert(false)}
              >
                Cancel
              </button>

              <button
                className="alert-btn danger"
                disabled={deletingOffer}
                onClick={async () => {
                  if (!offerDeleteId) return;
                  setDeletingOffer(true);
                  try {
                    await deleteOffer(offerDeleteId);
                    setOffersLoading(true);
                    const res = await getSellerOffers();
                    setOffers(res.data || []);
                  } finally {
                    setOffersLoading(false);
                    setDeletingOffer(false);
                    setShowOfferAlert(false);
                    setOfferDeleteId(null);
                  }
                }}
              >
                {deletingOffer ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
