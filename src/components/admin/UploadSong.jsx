// src/components/admin/UploadSong.jsx
import { useState } from "react";
import { createSong, deleteSong } from "../../lib/firestore";
import { uploadScore } from "../../lib/storage";

export default function UploadSong({ onUploaded }) {
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("C");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const KEYS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B",
                 "Am","A#m","Bm","Cm","C#m","Dm","D#m","Em","Fm","F#m","Gm","G#m"];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError("Judul dan file wajib diisi.");
      return;
    }
    setError("");
    setUploading(true);
    setProgress(0);

    const tempId = `song-${Date.now()}`;

    try {
      const { url, fileType, storagePath } = await uploadScore(
        file,
        tempId,
        (pct) => setProgress(pct)
      );

      const songId = await createSong({
        title: title.trim(),
        key,
        fileUrl: url,
        fileType,
        storagePath,
        totalPages: 1,
      });

      setTitle("");
      setKey("C");
      setFile(null);
      setProgress(0);
      onUploaded?.(songId);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err.code === "storage/unauthorized"
          ? "Akses ditolak. Pastikan Storage Rules sudah di-deploy dan Anda sudah login."
          : err.code === "storage/canceled"
          ? "Upload dibatalkan."
          : `Upload gagal: ${err.message}`
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.heading}>Upload Partitur Baru</h2>

      <label style={styles.label}>Judul Lagu</label>
      <input
        style={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="contoh: Bapa Kami"
        required
      />

      <label style={styles.label}>Kunci Dasar</label>
      <select style={styles.input} value={key} onChange={(e) => setKey(e.target.value)}>
        {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>

      <label style={styles.label}>File Partitur (PDF atau Gambar)</label>
      <div style={styles.fileArea}>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          id="file-input"
          style={{ display: "none" }}
          onChange={(e) => setFile(e.target.files[0])}
        />
        <label htmlFor="file-input" style={styles.fileBtn}>
          {file ? `📄 ${file.name}` : "🗂 Pilih File..."}
        </label>
      </div>

      {uploading && (
        <div>
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#c9a84c", textAlign: "right" }}>
            {progress < 100 ? `Mengupload... ${progress}%` : "✓ Selesai, menyimpan data..."}
          </p>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      <button type="submit" style={styles.submitBtn} disabled={uploading}>
        {uploading ? "Mengupload..." : "Upload & Simpan"}
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: "flex", flexDirection: "column", gap: 12,
    maxWidth: 480, padding: 24,
    background: "#0f0f1e",
    border: "1px solid #2d2d5e",
    borderRadius: 12,
    fontFamily: "Georgia, serif",
    color: "#e8e8f0",
  },
  heading: { margin: "0 0 8px", color: "#c9a84c", fontSize: "1.1rem" },
  label: { fontSize: "0.8rem", color: "#8888aa", textTransform: "uppercase", letterSpacing: "0.08em" },
  input: {
    background: "#16213e", border: "1px solid #2d2d5e",
    color: "#e8e8f0", borderRadius: 6, padding: "10px 12px",
    fontSize: "0.95rem", outline: "none",
  },
  fileArea: { display: "flex" },
  fileBtn: {
    background: "#16213e", border: "1px dashed #2d2d5e",
    color: "#8888cc", borderRadius: 6, padding: "10px 16px",
    cursor: "pointer", fontSize: "0.9rem", flex: 1,
    transition: "border-color 0.15s",
  },
  progressWrap: {
    height: 8, background: "#16213e", borderRadius: 8,
    overflow: "hidden", position: "relative",
  },
  progressBar: {
    height: "100%", background: "#c9a84c",
    transition: "width 0.2s", borderRadius: 8,
  },
  progressText: {
    position: "absolute", right: 8, top: -2,
    fontSize: "0.7rem", color: "#c9a84c",
  },
  error: { color: "#ff8888", fontSize: "0.85rem", margin: 0 },
  submitBtn: {
    background: "#c9a84c", color: "#1a1a2e",
    border: "none", borderRadius: 8,
    padding: "12px", fontWeight: "bold",
    cursor: "pointer", fontSize: "0.95rem",
    marginTop: 8, transition: "opacity 0.15s",
  },
};