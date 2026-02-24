// src/components/admin/ChordEditor.jsx
import { useState, useRef, useEffect } from "react";
import { saveAllChords } from "../../lib/firestore";
import ChordOverlay from "../shared/ChordOverlay";
import PdfViewer from "../shared/PdfViewer";

let _idCounter = 0;
const tmpId = () => `tmp-${++_idCounter}`;

export default function ChordEditor({ song }) {
  const [chords, setChords] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editText, setEditText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pendingPos, setPendingPos] = useState(null); // {x, y} untuk chord baru
  const [addMode, setAddMode] = useState(false);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const scoreRef = useRef(null);

  // Load chord dari Firestore saat pertama kali / ganti lagu
  useEffect(() => {
    import("../../lib/firestore").then(({ getChords }) => {
      getChords(song.id).then((data) => setChords(data));
    });
  }, [song.id]);

  const chordsForPage = chords.filter((c) => c.page === currentPage);

  // Klik di area partitur → tambah chord baru (kalau add mode)
  function handleScoreClick(e) {
    if (!addMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPos({ x, y });
    setEditText("");
  }

  function confirmAddChord() {
    if (!editText.trim() || !pendingPos) return;
    const newChord = {
      id: tmpId(),
      text: editText.trim(),
      x: pendingPos.x,
      y: pendingPos.y,
      page: currentPage,
    };
    setChords((prev) => [...prev, newChord]);
    setPendingPos(null);
    setEditText("");
  }

  function handleDragEnd(id, newX, newY) {
    setChords((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x: newX, y: newY } : c))
    );
  }

  function handleDeleteSelected() {
    if (!selectedId) return;
    setChords((prev) => prev.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  }

  function handleEditSelected() {
    const chord = chords.find((c) => c.id === selectedId);
    if (!chord) return;
    const newText = prompt("Edit chord:", chord.text);
    if (newText !== null && newText.trim()) {
      setChords((prev) =>
        prev.map((c) =>
          c.id === selectedId ? { ...c, text: newText.trim() } : c
        )
      );
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveAllChords(song.id, chords);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert("Gagal menyimpan: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedChord = chords.find((c) => c.id === selectedId);

  return (
    <div style={styles.root}>
      {/* ── TOOLBAR ── */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <span style={styles.songTitle}>{song.title}</span>
          <span style={styles.badge}>Mode Edit</span>
        </div>

        <div style={styles.toolbarControls}>
          {/* Add Mode Toggle */}
          <button
            style={{
              ...styles.btn,
              background: addMode ? "#c9a84c" : "#16213e",
              color: addMode ? "#1a1a2e" : "#c9a84c",
              border: "1px solid #c9a84c",
            }}
            onClick={() => {
              setAddMode((v) => !v);
              setPendingPos(null);
            }}
          >
            {addMode ? "✓ Mode Tambah Aktif" : "+ Tambah Chord"}
          </button>

          {/* Edit & Delete */}
          {selectedId && (
            <>
              <button style={styles.btn} onClick={handleEditSelected}>
                ✏ Edit "{selectedChord?.text}"
              </button>
              <button
                style={{ ...styles.btn, background: "#4a1a1a", color: "#ff8888", border: "1px solid #ff5555" }}
                onClick={handleDeleteSelected}
              >
                🗑 Hapus
              </button>
            </>
          )}

          {/* Save */}
          <button
            style={{
              ...styles.btn,
              background: saved ? "#1a4a1a" : "#c9a84c",
              color: saved ? "#88ff88" : "#1a1a2e",
              fontWeight: "bold",
              marginLeft: 12,
            }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : saved ? "✓ Tersimpan" : "💾 Simpan"}
          </button>
        </div>
      </div>

      {/* ── HINT ── */}
      {addMode && (
        <div style={styles.hint}>
          💡 Klik pada area partitur untuk menambahkan chord di posisi tersebut
        </div>
      )}

      {/* ── SCORE AREA ── */}
      <div style={styles.content}>
        <div
          ref={scoreRef}
          style={{ position: "relative", maxWidth: 900, width: "100%", cursor: addMode ? "crosshair" : "default" }}
          onClick={handleScoreClick}
        >
          {song.fileType === "pdf" ? (
            <PdfViewer
              url={song.fileUrl}
              page={currentPage}
              onPageCount={setTotalPages}
              onDimensionsChange={(w, h) => { setPageWidth(w); setPageHeight(h); }}
            />
          ) : (
            <img
              src={song.fileUrl}
              alt={song.title}
              style={{ width: "100%", display: "block" }}
              onLoad={(e) => {
                setPageWidth(e.target.offsetWidth);
                setPageHeight(e.target.offsetHeight);
              }}
            />
          )}

          {/* Chord Overlay - editable */}
          <ChordOverlay
            chords={chordsForPage}
            containerWidth={pageWidth}
            containerHeight={pageHeight}
            readOnly={false}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDragEnd={handleDragEnd}
          />

          {/* Pending position indicator */}
          {pendingPos && (
            <div style={{
              position: "absolute",
              left: `${pendingPos.x}%`,
              top: `${pendingPos.y}%`,
              transform: "translate(-50%, -100%)",
              background: "#c9a84c",
              color: "#1a1a2e",
              borderRadius: 4,
              padding: "2px 8px",
              fontWeight: "bold",
              zIndex: 20,
              whiteSpace: "nowrap",
            }}>
              📍 Baru
            </div>
          )}
        </div>
      </div>

      {/* ── CHORD INPUT POPUP ── */}
      {pendingPos && (
        <div style={styles.popup}>
          <div style={styles.popupCard}>
            <p style={{ margin: "0 0 12px", color: "#c9a84c", fontWeight: "bold" }}>
              Ketik chord di posisi ({Math.round(pendingPos.x)}%, {Math.round(pendingPos.y)}%)
            </p>
            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmAddChord();
                if (e.key === "Escape") setPendingPos(null);
              }}
              placeholder="contoh: Am, G/B, Cmaj7"
              style={styles.input}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={{ ...styles.btn, flex: 1, background: "#c9a84c", color: "#1a1a2e", fontWeight: "bold" }}
                onClick={confirmAddChord}>
                Tambahkan
              </button>
              <button style={{ ...styles.btn, flex: 1 }} onClick={() => setPendingPos(null)}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE NAV ── */}
      {song.fileType === "pdf" && totalPages > 1 && (
        <div style={styles.pageNav}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              style={{
                ...styles.pageBtn,
                background: currentPage === i ? "#c9a84c" : "#16213e",
                color: currentPage === i ? "#1a1a2e" : "#8888aa",
                fontWeight: currentPage === i ? "bold" : "normal",
              }}
              onClick={() => setCurrentPage(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#1a1a2e",
    color: "#e8e8f0",
    fontFamily: "Georgia, serif",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#0f0f1e",
    borderBottom: "1px solid #2d2d5e",
    flexWrap: "wrap",
    gap: 10,
    zIndex: 10,
  },
  toolbarLeft: { display: "flex", alignItems: "center", gap: 12 },
  songTitle: { fontSize: "1.1rem", fontWeight: "bold", color: "#c9a84c" },
  badge: {
    background: "#2d1a4e", color: "#aa88ff",
    border: "1px solid #6644cc", borderRadius: 4,
    fontSize: "0.7rem", padding: "2px 8px", letterSpacing: "0.08em",
  },
  toolbarControls: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  btn: {
    background: "#16213e",
    border: "1px solid #2d2d5e",
    color: "#e8e8f0",
    borderRadius: 6,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: "0.85rem",
    transition: "background 0.15s",
  },
  hint: {
    background: "#1e1e0e",
    borderBottom: "1px solid #5a5a00",
    color: "#d4d480",
    padding: "8px 20px",
    fontSize: "0.82rem",
  },
  content: {
    flex: 1, overflow: "auto", padding: 24,
    display: "flex", justifyContent: "center",
  },
  popup: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100,
  },
  popupCard: {
    background: "#0f0f1e",
    border: "1px solid #c9a84c",
    borderRadius: 12,
    padding: 24,
    minWidth: 300,
  },
  input: {
    width: "100%",
    background: "#16213e",
    border: "1px solid #2d2d5e",
    color: "#e8e8f0",
    borderRadius: 6,
    padding: "10px 14px",
    fontSize: "1.1rem",
    fontFamily: "'Courier New', monospace",
    boxSizing: "border-box",
    outline: "none",
  },
  pageNav: {
    display: "flex", justifyContent: "center", gap: 8,
    padding: 12, background: "#0f0f1e", borderTop: "1px solid #2d2d5e",
  },
  pageBtn: {
    border: "1px solid #2d2d5e",
    width: 36, height: 36, borderRadius: 6, cursor: "pointer",
    fontSize: "0.85rem", transition: "all 0.15s",
  },
};
