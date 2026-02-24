// src/App.jsx
import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import SongList from "./components/user/SongList";
import SongViewer from "./components/user/SongViewer";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";

function AppContent() {
  const { user, loading } = useAuth();
  const [selectedSong, setSelectedSong] = useState(null);
  const [adminMode, setAdminMode] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#1a1a2e", color: "#c9a84c", fontFamily: "Georgia",
        fontSize: "1.2rem",
      }}>
        ♪ Memuat...
      </div>
    );
  }

  // Admin route: /#admin
  const isAdminRoute = window.location.hash === "#admin" || adminMode;

  if (isAdminRoute) {
    if (!user) return <AdminLogin />;
    return <AdminDashboard />;
  }

  // User route
  if (selectedSong) {
    return (
      <div>
        <button
          onClick={() => setSelectedSong(null)}
          style={{
            position: "fixed", top: 12, left: 12, zIndex: 100,
            background: "rgba(15,15,30,0.9)", border: "1px solid #2d2d5e",
            color: "#c9a84c", borderRadius: 6, padding: "6px 14px",
            cursor: "pointer", fontSize: "0.85rem",
          }}
        >
          ← Kembali
        </button>
        <SongViewer song={selectedSong} />
      </div>
    );
  }

  return (
    <div>
      <SongList onSelectSong={setSelectedSong} />
      {/* Link admin tersembunyi di footer */}
      <div style={{
        textAlign: "center", padding: "20px",
        borderTop: "1px solid #1e1e3e",
      }}>
        <a
          href="#admin"
          onClick={(e) => { e.preventDefault(); setAdminMode(true); }}
          style={{ color: "#3a3a5e", fontSize: "0.7rem", textDecoration: "none" }}
        >
          admin
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
