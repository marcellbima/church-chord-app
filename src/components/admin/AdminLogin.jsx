// src/components/admin/AdminLogin.jsx
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Email atau password salah.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div style={styles.logo}>♪</div>
        <h1 style={styles.title}>Church Chord Admin</h1>
        <p style={styles.sub}>Login untuk mengelola partitur & chord</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "radial-gradient(ellipse at 50% 30%, #1a1a3e 0%, #0a0a1a 70%)",
    fontFamily: "Georgia, serif",
  },
  card: {
    background: "#0f0f1e",
    border: "1px solid #2d2d5e",
    borderRadius: 16,
    padding: "40px 48px",
    width: "100%", maxWidth: 400,
    textAlign: "center",
    animation: "fadeIn 0.5s ease",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  logo: {
    fontSize: "3rem", color: "#c9a84c",
    marginBottom: 12,
  },
  title: {
    margin: "0 0 6px", fontSize: "1.4rem",
    color: "#e8e8f0", fontWeight: "bold",
  },
  sub: { margin: "0 0 28px", color: "#6666aa", fontSize: "0.85rem" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: {
    background: "#16213e", border: "1px solid #2d2d5e",
    color: "#e8e8f0", borderRadius: 8, padding: "12px 16px",
    fontSize: "0.95rem", outline: "none",
    transition: "border-color 0.15s",
  },
  error: { color: "#ff8888", fontSize: "0.85rem", margin: "0" },
  btn: {
    background: "#c9a84c", color: "#1a1a2e",
    border: "none", borderRadius: 8,
    padding: "14px", fontWeight: "bold",
    cursor: "pointer", fontSize: "1rem",
    marginTop: 4, letterSpacing: "0.05em",
    transition: "opacity 0.15s",
  },
};
