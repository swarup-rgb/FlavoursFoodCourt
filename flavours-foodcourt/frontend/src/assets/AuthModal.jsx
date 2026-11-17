
import { useState } from "react";
import { loginCustomer, registerCustomer } from "./authService";
import "./AuthModal.css";

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    identifier: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "register") {
        const result = await registerCustomer({
          name: form.name.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          password: form.password,
        });

        setSuccess(result.message || "Registration successful!");
        setMode("login");
        setForm((previous) => ({
          ...previous,
          identifier: previous.email,
          password: "",
        }));
      } else {
        const result = await loginCustomer({
          identifier: form.identifier.trim(),
          password: form.password,
        });

        if (result.token) {
          localStorage.setItem("authToken", result.token);
        }

        if (onLoginSuccess) {
          onLoginSuccess(result);
        }

        setSuccess(result.message || "Login successful!");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="auth-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2>
          {mode === "login" ? "Welcome Back!" : "Create Account"}
        </h2>

        <p className="auth-subtitle">
          {mode === "login"
            ? "Login to Flavours Food Court"
            : "Register to enjoy delicious food"}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
              setSuccess("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                minLength={2}
                maxLength={100}
                autoComplete="name"
                required
              />

              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />

              <label htmlFor="auth-mobile">Mobile Number</label>
              <input
                id="auth-mobile"
                name="mobile"
                type="tel"
                placeholder="10-digit mobile number"
                value={form.mobile}
                onChange={handleChange}
                pattern="[0-9]{10}"
                maxLength={10}
                autoComplete="tel"
                required
              />
            </>
          )}

          {mode === "login" && (
            <>
              <label htmlFor="auth-identifier">Email or Mobile</label>
              <input
                id="auth-identifier"
                name="identifier"
                type="text"
                placeholder="Enter email or mobile"
                value={form.identifier}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </>
          )}

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
          />

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
