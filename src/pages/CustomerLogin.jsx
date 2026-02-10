import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomerNavbar from "../components/CustomerNavbar";
import api from "../api/apis";
import { useShop } from "../context/ShopContext";
import "./CustomerLogin.css";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUserData } = useShop();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setError("");
    setMessage("");
  }, [mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (mode === "register") {
        if (form.password !== form.confirm_password) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        await api.post("customer/register/", {
          name: form.name,
          email: form.email,
          password: form.password,
          confirm_password: form.confirm_password,
        });
        setMessage("Registration successful. Please login.");
        setMode("login");
      } else {
        await api.post("customer/login/", {
          email: form.email,
          password: form.password,
        });
        await refreshUserData();
        const redirectTo =
          location.state?.redirectTo && typeof location.state.redirectTo === "string"
            ? location.state.redirectTo
            : "/";
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || "Authentication failed";
      if (detail === "User already exists" && mode === "register") {
        setError("Email already registered. Please login.");
        setMode("login");
      } else if (detail === "Invalid credentials" && mode === "login") {
        setError("Invalid credentials.");
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="customer-auth-page">
      <CustomerNavbar />
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <input
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            )}
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            {mode === "register" && (
              <input
                name="confirm_password"
                type="password"
                placeholder="Confirm password"
                value={form.confirm_password}
                onChange={handleChange}
                required
              />
            )}
            {message && <div className="auth-message">{message}</div>}
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Login"
                  : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
