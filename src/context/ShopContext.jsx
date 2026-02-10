import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/apis";

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [loadingShop, setLoadingShop] = useState(true);
  const [customer, setCustomer] = useState({
    authenticated: null,
    profile_complete: false,
  });

  const refreshWishlist = async () => {
    try {
      const res = await api.get("wishlist/");
      setWishlist(res.data || []);
    } catch {
      setWishlist([]);
    }
  };

  const refreshCart = async () => {
    try {
      const res = await api.get("cart/");
      setCart(res.data || []);
    } catch {
      setCart([]);
    }
  };

  const refreshCustomer = async () => {
    try {
      const res = await api.get("customer/me/");
      const data = res.data || { authenticated: false };
      setCustomer(data);
      if (!data?.authenticated) {
        setWishlist([]);
        setCart([]);
      }
      return data;
    } catch {
      const data = { authenticated: false, profile_complete: false };
      setCustomer(data);
      setWishlist([]);
      setCart([]);
      return data;
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoadingShop(true);
    const restoreSession = async () => {
      const data = await refreshCustomer();
      if (data?.authenticated) {
        await Promise.all([
          refreshWishlist().catch(() => {}),
          refreshCart().catch(() => {}),
        ]);
      }
    };
    restoreSession()
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingShop(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const wishlistIds = useMemo(
    () => new Set(wishlist.map((w) => w.product?.id)),
    [wishlist]
  );

  const cartIds = useMemo(
    () => new Set(cart.map((c) => c.product?.id)),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cart]
  );

  const canShop = !!(customer?.authenticated && customer?.profile_complete);

  const toggleWishlist = async (productId) => {
    if (!productId) return;
    if (!customer?.authenticated) {
      const err = new Error("AUTH_REQUIRED");
      err.code = "AUTH_REQUIRED";
      throw err;
    }
    if (!customer?.profile_complete) {
      const err = new Error("PROFILE_REQUIRED");
      err.code = "PROFILE_REQUIRED";
      throw err;
    }

    const wasWishlisted = wishlistIds.has(productId);
    const prevWishlist = wishlist;

    // Optimistic UI update
    if (wasWishlisted) {
      setWishlist((items) =>
        items.filter((w) => w.product?.id !== productId)
      );
    } else {
      setWishlist((items) =>
        items.concat([{ id: `temp-${productId}`, product: { id: productId } }])
      );
    }

    try {
      if (wasWishlisted) {
        await api.delete(`wishlist/remove/${productId}/`);
      } else {
        await api.post("wishlist/add/", { product_id: productId });
      }
      await refreshWishlist();
    } catch {
      // revert on failure
      setWishlist(prevWishlist);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!productId) return;
    if (!customer?.authenticated) {
      const err = new Error("AUTH_REQUIRED");
      err.code = "AUTH_REQUIRED";
      throw err;
    }
    if (!customer?.profile_complete) {
      const err = new Error("PROFILE_REQUIRED");
      err.code = "PROFILE_REQUIRED";
      throw err;
    }
    await api.post("cart/add/", { product_id: productId, quantity });
    await refreshCart();
  };

  const updateCart = async (productId, quantity) => {
    if (!productId) return;
    if (!customer?.authenticated) {
      const err = new Error("AUTH_REQUIRED");
      err.code = "AUTH_REQUIRED";
      throw err;
    }
    if (!customer?.profile_complete) {
      const err = new Error("PROFILE_REQUIRED");
      err.code = "PROFILE_REQUIRED";
      throw err;
    }
    await api.put("cart/update/", { product_id: productId, quantity });
    await refreshCart();
  };

  const removeFromCart = async (productId) => {
    if (!productId) return;
    if (!customer?.authenticated) {
      const err = new Error("AUTH_REQUIRED");
      err.code = "AUTH_REQUIRED";
      throw err;
    }
    if (!customer?.profile_complete) {
      const err = new Error("PROFILE_REQUIRED");
      err.code = "PROFILE_REQUIRED";
      throw err;
    }
    await api.delete(`cart/remove/${productId}/`);
    await refreshCart();
  };

  const refreshUserData = async () => {
    const data = await refreshCustomer();
    if (data?.authenticated) {
      await Promise.all([refreshWishlist(), refreshCart()]);
    }
    return data;
  };

  const logoutCustomer = async () => {
    try {
      await api.post("customer/logout/");
    } catch {
      // ignore logout errors, still clear client state
    } finally {
      setCustomer({ authenticated: false, profile_complete: false });
      setWishlist([]);
      setCart([]);
    }
  };

  const value = {
    wishlist,
    cart,
    loadingShop,
    customer,
    canShop,
    wishlistIds,
    cartIds,
    cartCount,
    refreshCustomer,
    refreshUserData,
    refreshWishlist,
    refreshCart,
    toggleWishlist,
    addToCart,
    updateCart,
    removeFromCart,
    logoutCustomer,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return ctx;
}
