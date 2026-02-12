import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import api, { bootstrapCsrf } from "./api/apis";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CustomerLanding from "./pages/CustomerLanding";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import { ShopProvider } from "./context/ShopContext";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerProfile from "./pages/CustomerProfile";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import TrackOrder from "./pages/TrackOrder";
import Enquiry from "./pages/Enquiry";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
       
    let mounted = true;

    const checkSession = async () => {
      try {
        const path = window.location.pathname || "";
        if (!path.startsWith("/seller")) {
          if (mounted) setCheckingSession(false);
          return;
        }
        await bootstrapCsrf();
        await api.get("auth/me/");
        if (mounted) setLoggedIn(true);
      } catch {
        if (mounted) setLoggedIn(false);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  if (checkingSession) return null;

  return (
    <BrowserRouter>
      <ShopProvider>
        <Routes>
          {/* Customer site */}
          <Route path="/" element={<CustomerLanding />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<TrackOrder />} />
          <Route path="/enquiry" element={<Enquiry />} />

          {/* Seller login */}
          <Route
            path="/login"
            element={<Login onLogin={() => setLoggedIn(true)} />}
          />

          {/* Seller dashboard (protected) */}
        <Route
          path="/seller"
          element={
            loggedIn ? (
              <Dashboard onLogout={() => setLoggedIn(false)} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/seller/orders"
          element={
            loggedIn ? (
              <Dashboard onLogout={() => setLoggedIn(false)} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/seller/enquiries"
          element={
            loggedIn ? (
              <Dashboard onLogout={() => setLoggedIn(false)} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
      </ShopProvider>
    </BrowserRouter>
  );
}

export default App;
