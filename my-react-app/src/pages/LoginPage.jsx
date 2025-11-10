import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "/src/contexts/AuthContext.jsx"; // use the hook
import axios from "axios";
import "../styles/Auth.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // get login function from context
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://127.0.0.1:8000/auth/login", {
        username,
        password,
      });

      // Save user in context (here just username for simplicity)
      login({ username });

      // Optionally save token
      localStorage.setItem("token", response.data.access_token);

      navigate("/home");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Invalid username or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🎨 Login to Collaborative Canvas</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p>
          Don’t have an account?{" "}
          <span className="register-link" onClick={() => navigate("/register")}>
            Register here
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
