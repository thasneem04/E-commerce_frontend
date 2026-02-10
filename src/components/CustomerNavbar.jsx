import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  ShoppingCart,
  Heart,
  ClipboardList,
  User,
  MessageCircle,
  MoreHorizontal,
  LogOut,
} from "lucide-react";

import "./CustomerNavbar.css";
import logo from "../assets/Mr.LionLogoFinal.png";
import { useShop } from "../context/ShopContext";

export default function CustomerNavbar() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();
  const { cartCount, wishlist, logoutCustomer, customer } = useShop();
  const wishlistCount = wishlist.length;

  return (
    <nav className="customer-navbar">
      {/* Logo */}
      <div className="customer-logo">
  <img src={logo} alt="Logo" />
  <span className="shop-name">VasanthaMaaligai</span>
</div>


      {/* Hamburger (hidden on mobile) */}
      <div className="hamburger" onClick={() => setOpen(!open)}>
        ☰
      </div>

      {/* Nav Links */}
      <div className={`customer-nav-links ${open ? "open" : ""}`}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <Home size={18} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <Package size={18} />
          <span>Products</span>
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <span className="nav-icon">
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="nav-badge">{cartCount}</span>
            )}
          </span>
          <span>Cart</span>
        </NavLink>

        <NavLink
          to="/wishlist"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <span className="nav-icon">
            <Heart size={18} />
            {wishlistCount > 0 && (
              <span className="nav-badge">{wishlistCount}</span>
            )}
          </span>
          <span>Wishlist</span>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <ClipboardList size={18} />
          <span>Orders</span>
        </NavLink>

        <NavLink
          to="/customer/profile"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <User size={18} />
          <span>Profile</span>
        </NavLink>

        <NavLink
          to="/enquiry"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <MessageCircle size={18} />
          <span>Enquiry</span>
        </NavLink>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="mobile-bottom-nav">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `bottom-item ${isActive ? "active" : ""}`
          }
        >
          <Home size={22} />
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `bottom-item ${isActive ? "active" : ""}`
          }
        >
          <Package size={22} />
        </NavLink>
        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `bottom-item ${isActive ? "active" : ""}`
          }
        >
          <span className="bottom-icon">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="nav-badge">{cartCount}</span>
            )}
          </span>
        </NavLink>
        <NavLink
          to="/wishlist"
          className={({ isActive }) =>
            `bottom-item ${isActive ? "active" : ""}`
          }
        >
          <span className="bottom-icon">
            <Heart size={22} />
            {wishlistCount > 0 && (
              <span className="nav-badge">{wishlistCount}</span>
            )}
          </span>
        </NavLink>
        <button
          type="button"
          className={`bottom-item ${moreOpen ? "active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-label="More"
        >
          <MoreHorizontal size={22} />
        </button>
      </div>

      {/* More Sheet */}
      {moreOpen && (
        <div
          className="mobile-more-backdrop"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="mobile-more-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <NavLink to="/orders" className="more-item">
              <ClipboardList size={18} />
              Orders
            </NavLink>
            <NavLink to="/customer/profile" className="more-item">
              <User size={18} />
              Profile
            </NavLink>
            <NavLink to="/enquiry" className="more-item">
              <MessageCircle size={18} />
              Enquiry
            </NavLink>
            <button
              type="button"
              className="more-item logout"
              onClick={async () => {
                await logoutCustomer();
                setMoreOpen(false);
                navigate("/");
              }}
              disabled={!customer?.authenticated}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
