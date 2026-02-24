// src/components/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { getSongs, deleteSong } from "../../lib/firestore";
import { useAuth } from "../../hooks/useAuth";
import UploadSong from "./UploadSong";
import ChordEditor from "./ChordEditor";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" | "upload" | "edit"
  const [editingSong, setEditingSong] = useState(null);

  const loadSongs = () => {
    setLoading(true);
    getSongs()
      .then(setSongs)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSongs(); }, []);

  async function handleDelete(song) {
    if (!confirm(`Hapus lagu "${song.title}"? Semua chord juga akan dihapus.`)) return;
    await deleteSong(song.id);
    loadSongs();
  }

  if (view === "upload") {
    return (
      <div style={styles.root}>
        <AdminNav user={user} onLogout={logout} onBack={() => setView("list")} />
        <div style={styles.center}>
          <UploadSong onUploaded={() => { loadSongs(); setView("list"); }} />
        </div>
      </div>
    );
  }

  if (view === "edit" && editingSong) {
    return (
      <div style={styles.root}>
        <AdminNav
          user={user} onLogout={logout}
          onBack={() => { setView("list"); setEditingSong(null); }}
        />
        <ChordEditor song={editingSong} />
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <AdminNav user={user} onLogout={logout} />

      <div style={styles.content}>
        <div style={styles.topRow}>
          <h2 style={styles.sectionTitle}>Daftar Lagu ({songs.length})</h2>
          <button style={styles.uploadBtn} onClick={() => setView("upload")}>
            + Upload Partitur
          </button>
        </div>

        {loading ? (
          <p style={styles.muted}>Memuat...</p>
        ) : songs.length === 0 ? (
          <p style={styles.muted}>Belum ada lagu. Upload partitur pertama Anda!</p>
        ) : (
          <div style={styles.songList}>
            {songs.map((song) => (
              <div key={song.id} style={styles.songCard}>
                <div style={styles.songIcon}>
                  {song.fileType === "pdf" ? "📄" : "🖼"}
                </div>
                <div style={styles.songInfo}>
                  <div style={styles.songTitle}>{song.title}</div>
                  <div style={styles.songMeta}>
                    Kunci: <strong style={{ color: "#c9a84c" }}>{song.key}</strong>
                    {" · "}
                    {song.fileType?.toUpperCase()}
                  </div>
                </div>
                <div style={styles.songActions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => { setEditingSong(song); setView("edit"); }}
                  >
                    ✏ Edit Chord
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(song)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminNav({ user, onLogout, onBack }) {
  return (
    <div style={styles.nav}>
      <div style={styles.navLeft}>
        {onBack && (
          <button style={styles.backBtn} onClick={onBack}>← Kembali</button>
        )}
        <span style={styles.navTitle}>♪ Admin Panel</span>
      </div>
      <div style={styles.navRight}>
        <span style={styles.navUser}>{user?.email}</span>
        <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#1a1a2e",
    color: "#e8e8f0",
    fontFamily: "Georgia, serif",
    display: "flex", flexDirection: "column",
  },
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 24px",
    background: "#0f0f1e", borderBottom: "1px solid #2d2d5e",
  },
  navLeft: { display: "flex", alignItems: "center", gap: 16 },
  navTitle: { fontSize: "1rem", fontWeight: "bold", color: "#c9a84c" },
  navRight: { display: "flex", alignItems: "center", gap: 12 },
  navUser: { fontSize: "0.8rem", color: "#8888aa" },
  backBtn: {
    background: "transparent", border: "none",
    color: "#8888cc", cursor: "pointer", fontSize: "0.9rem",
  },
  logoutBtn: {
    background: "#2d1a1a", border: "1px solid #5a2a2a",
    color: "#ff8888", borderRadius: 6, padding: "6px 14px",
    cursor: "pointer", fontSize: "0.82rem",
  },
  content: { padding: "28px 24px", maxWidth: 900, margin: "0 auto", width: "100%" },
  topRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: { margin: 0, fontSize: "1.1rem", color: "#c9a84c" },
  uploadBtn: {
    background: "#c9a84c", color: "#1a1a2e",
    border: "none", borderRadius: 8,
    padding: "10px 20px", fontWeight: "bold",
    cursor: "pointer", fontSize: "0.9rem",
  },
  muted: { color: "#6666aa" },
  songList: { display: "flex", flexDirection: "column", gap: 10 },
  songCard: {
    display: "flex", alignItems: "center", gap: 16,
    background: "#0f0f1e", border: "1px solid #2d2d5e",
    borderRadius: 10, padding: "14px 18px",
  },
  songIcon: { fontSize: "1.5rem", flexShrink: 0 },
  songInfo: { flex: 1 },
  songTitle: { fontWeight: "bold", marginBottom: 4 },
  songMeta: { fontSize: "0.82rem", color: "#8888aa" },
  songActions: { display: "flex", alignItems: "center", gap: 8 },
  editBtn: {
    background: "#16213e", border: "1px solid #2d2d5e",
    color: "#c9a84c", borderRadius: 6,
    padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem",
  },
  deleteBtn: {
    background: "#2d1a1a", border: "1px solid #5a2a2a",
    color: "#ff8888", borderRadius: 6,
    padding: "8px 10px", cursor: "pointer", fontSize: "0.9rem",
  },
  center: {
    display: "flex", justifyContent: "center",
    padding: "40px 20px",
  },
};
