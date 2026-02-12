import { Heart } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import "./WishlistButton.css";

export default function WishlistButton({ productId, className }) {
  const { wishlistIds, toggleWishlist } = useShop();
  const navigate = useNavigate();
  const isWishlisted = wishlistIds.has(productId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId).catch((err) => {
      if (err?.code === "AUTH_REQUIRED") {
        navigate("/customer/login");
        return;
      }
    });
  };

  return (
    <button
      type="button"
      className={`wishlist-btn ${isWishlisted ? "active" : ""} ${className || ""}`}
      onClick={handleClick}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart size={16} />
    </button>
  );
}
