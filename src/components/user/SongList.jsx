// src/components/user/SongList.jsx
import { useState, useEffect } from "react";
import { getSongs } from "../../lib/firestore";

export default function SongList({ onSelectSong }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getSongs()
      .then(setSongs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = songs.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.key?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.root}>
      <div style={styles.hero}>
        <div style={styles.heroIcon}>♪</div>
        <h1 style={styles.heroTitle}>Chord Lagu Gereja</h1>
        <p style={styles.heroSub}>Partitur dengan overlay chord interaktif</p>
      </div>

      <div style={styles.searchWrap}>
        <input
          style={styles.search}
          placeholder="🔍 Cari judul atau kunci lagu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={styles.loading}>Memuat lagu...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>
          {search ? `Tidak ada lagu dengan kata kunci "${search}"` : "Belum ada lagu."}
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((song) => (
            <button
              key={song.id}
              style={styles.card}
              onClick={() => onSelectSong(song)}
            >
              <div style={styles.cardIcon}>
                {song.fileType === "pdf" ? "📄" : "🖼"}
              </div>
              <div style={styles.cardInfo}>
                <div style={styles.cardTitle}>{song.title}</div>
                <div style={styles.cardMeta}>
                  Kunci: <strong style={{ color: "#c9a84c" }}>{song.key}</strong>
                  {song.totalPages > 1 && (
                    <span style={styles.pages}> · {song.totalPages} hal</span>
                  )}
                </div>
              </div>
              <div style={styles.cardArrow}>→</div>
            </button>
          ))}
        </div>
      )}

      <style>{styles._css}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#1a1a2e",
    color: "#e8e8f0",
    fontFamily: "Georgia, serif",
    paddingBottom: 48,
  },
  hero: {
    textAlign: "center",
    padding: "60px 24px 32px",
    background: "radial-gradient(ellipse at 50% 0%, #1a1a3e 0%, #1a1a2e 60%)",
    borderBottom: "1px solid #2d2d5e",
  },
  heroIcon: { fontSize: "3rem", color: "#c9a84c", marginBottom: 12 },
  heroTitle: { margin: "0 0 8px", fontSize: "2rem", fontWeight: "bold", color: "#e8e8f0" },
  heroSub: { margin: 0, color: "#6666aa", fontSize: "0.95rem" },
  searchWrap: { maxWidth: 600, margin: "28px auto 0", padding: "0 20px" },
  search: {
    width: "100%", boxSizing: "border-box",
    background: "#0f0f1e", border: "1px solid #2d2d5e",
    color: "#e8e8f0", borderRadius: 10, padding: "12px 16px",
    fontSize: "0.95rem", outline: "none",
  },
  loading: {
    textAlign: "center", padding: "60px 24px",
    color: "#6666aa", fontSize: "1rem",
  },
  empty: {
    textAlign: "center", padding: "60px 24px",
    color: "#6666aa", fontSize: "0.95rem",
  },
  grid: {
    maxWidth: 760, margin: "24px auto 0", padding: "0 16px",
    display: "flex", flexDirection: "column", gap: 12,
  },
  card: {
    display: "flex", alignItems: "center", gap: 16,
    background: "#0f0f1e", border: "1px solid #2d2d5e",
    borderRadius: 10, padding: "16px 20px",
    cursor: "pointer", textAlign: "left",
    transition: "border-color 0.2s, background 0.2s",
    color: "inherit",
    width: "100%",
  },
  cardIcon: { fontSize: "1.5rem", flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: "1rem", fontWeight: "bold", color: "#e8e8f0", marginBottom: 4 },
  cardMeta: { fontSize: "0.82rem", color: "#8888aa" },
  pages: { color: "#8888aa" },
  cardArrow: { color: "#c9a84c", fontSize: "1.2rem", flexShrink: 0 },
  _css: `
    button[style]:hover {
      border-color: #c9a84c !important;
      background: #141428 !important;
    }
  `,
};
