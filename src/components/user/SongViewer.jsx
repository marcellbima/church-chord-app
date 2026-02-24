// src/components/user/SongViewer.jsx
import { useState, useEffect, useRef } from "react";
import { getChords } from "../../lib/firestore";
import { transposeAll, transposeKey } from "../../lib/transpose";
import PdfViewer from "../shared/PdfViewer";
import ChordOverlay from "../shared/ChordOverlay";

export default function SongViewer({ song }) {
  const [chords, setChords] = useState([]);
  const [semitones, setSemitones] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef(null);
  const scoreRef = useRef(null);

  useEffect(() => {
    getChords(song.id).then(setChords).catch(console.error);
  }, [song.id]);

  const transposedChords = transposeAll(chords, semitones);
  const transposedKey = transposeKey(song.key, semitones);

  const handleTranspose = (delta) => setSemitones((prev) => ((prev + delta + 12) % 12));
  const handleZoom = (delta) => setScale((prev) => Math.min(3, Math.max(0.5, prev + delta)));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── DOWNLOAD PDF ──
  async function handleDownload() {
    setDownloading(true);
    try {
      // Load html2canvas & jsPDF dari CDN jika belum ada
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

      const { jsPDF } = window.jspdf;

      // Ambil semua halaman
      const totalPages = song.totalPages || 1;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      for (let p = 0; p < totalPages; p++) {
        // Render halaman
        if (p !== currentPage) setCurrentPage(p);
        await new Promise((r) => setTimeout(r, 600)); // tunggu render

        const el = scoreRef.current;
        if (!el) continue;

        const canvas = await window.html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = (canvas.height * pdfW) / canvas.width;

        if (p > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
      }

      // Reset ke halaman semula
      setCurrentPage(0);

      const filename = `${song.title.replace(/\s+/g, "-")}_${transposedKey}.pdf`;
      pdf.save(filename);
    } catch (err) {
      alert("Download gagal: " + err.message);
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const chordsForPage = transposedChords.filter((c) => c.page === currentPage);

  return (
    <div className="viewer-root" ref={containerRef}>
      {/* ── TOPBAR ── */}
      <div className="viewer-toolbar">
        <div className="toolbar-title">
          <span className="song-title">{song.title}</span>
          <span className="song-key">
            Kunci: <strong>{transposedKey}</strong>
          </span>
        </div>

        <div className="toolbar-controls">
          {/* Transpose */}
          <div className="control-group">
            <span className="control-label">Transpose</span>
            <button onClick={() => handleTranspose(-1)} className="btn-icon" title="Turun 1 semitone">−</button>
            <span className="semitone-badge">
              {semitones > 0 ? `+${semitones}` : semitones}
            </span>
            <button onClick={() => handleTranspose(1)} className="btn-icon" title="Naik 1 semitone">+</button>
            {semitones !== 0 && (
              <button onClick={() => setSemitones(0)} className="btn-reset" title="Reset">↺</button>
            )}
          </div>

          {/* Zoom */}
          <div className="control-group">
            <span className="control-label">Zoom</span>
            <button onClick={() => handleZoom(-0.1)} className="btn-icon">−</button>
            <span className="semitone-badge">{Math.round(scale * 100)}%</span>
            <button onClick={() => handleZoom(0.1)} className="btn-icon">+</button>
          </div>

          {/* Download PDF */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-download"
            title="Download PDF dengan chord"
          >
            {downloading ? "⏳ Memproses..." : "⬇ Download PDF"}
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="btn-icon" title="Fullscreen">
            {isFullscreen ? "⊠" : "⛶"}
          </button>
        </div>
      </div>

      {/* ── SCORE AREA ── */}
      <div className="viewer-content">
        <div
          className="score-container"
          style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
        >
          {/* Wrapper ini yang di-capture html2canvas */}
          <div ref={scoreRef} style={{ position: "relative", display: "inline-block", width: "100%" }}>
            {song.fileType === "pdf" ? (
              <PdfViewer
                url={song.fileUrl}
                page={currentPage}
                onPageCount={() => {}}
                onDimensionsChange={(w, h) => { setPageWidth(w); setPageHeight(h); }}
              />
            ) : (
              <img
                src={song.fileUrl}
                alt={song.title}
                crossOrigin="anonymous"
                style={{ width: "100%", display: "block" }}
                onLoad={(e) => {
                  setPageWidth(e.target.offsetWidth);
                  setPageHeight(e.target.offsetHeight);
                }}
              />
            )}

            {/* Chord Overlay */}
            <ChordOverlay
              chords={chordsForPage}
              containerWidth={pageWidth}
              containerHeight={pageHeight}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* ── PAGE NAVIGATOR ── */}
      {song.fileType === "pdf" && song.totalPages > 1 && (
        <div className="page-nav">
          {Array.from({ length: song.totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`page-btn ${currentPage === i ? "active" : ""}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <style>{viewerStyles}</style>
    </div>
  );
}

const viewerStyles = `
  .viewer-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #1a1a2e;
    color: #e8e8f0;
    font-family: 'Georgia', serif;
  }
  .viewer-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    background: #0f0f1e;
    border-bottom: 1px solid #2d2d5e;
    flex-wrap: wrap;
    gap: 10px;
    z-index: 10;
  }
  .toolbar-title {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .song-title {
    font-size: 1.1rem;
    font-weight: bold;
    color: #c9a84c;
    letter-spacing: 0.05em;
  }
  .song-key { font-size: 0.85rem; color: #8888aa; }
  .song-key strong { color: #e0c070; }
  .toolbar-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .control-group {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #16213e;
    border: 1px solid #2d2d5e;
    border-radius: 8px;
    padding: 4px 10px;
  }
  .control-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #6666aa;
    margin-right: 4px;
  }
  .btn-icon {
    background: #2d2d5e;
    border: none;
    color: #e8e8f0;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.15s;
  }
  .btn-icon:hover { background: #3d3d7e; }
  .btn-reset {
    background: transparent;
    border: none;
    color: #c9a84c;
    cursor: pointer;
    font-size: 1rem;
    padding: 0 4px;
  }
  .btn-download {
    background: #1a3a1a;
    border: 1px solid #2a6a2a;
    color: #88dd88;
    border-radius: 8px;
    padding: 6px 16px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: bold;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .btn-download:hover:not(:disabled) { background: #1e4a1e; }
  .btn-download:disabled { opacity: 0.6; cursor: wait; }
  .semitone-badge {
    min-width: 32px;
    text-align: center;
    font-size: 0.9rem;
    font-weight: bold;
    color: #c9a84c;
  }
  .viewer-content {
    flex: 1;
    overflow: auto;
    padding: 24px;
    display: flex;
    justify-content: center;
  }
  .score-container {
    position: relative;
    max-width: 900px;
    width: 100%;
  }
  .page-nav {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: #0f0f1e;
    border-top: 1px solid #2d2d5e;
  }
  .page-btn {
    background: #16213e;
    border: 1px solid #2d2d5e;
    color: #8888aa;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.15s;
  }
  .page-btn.active {
    background: #c9a84c;
    border-color: #c9a84c;
    color: #1a1a2e;
    font-weight: bold;
  }
  @media (max-width: 600px) {
    .viewer-toolbar { padding: 8px 12px; }
    .toolbar-controls { gap: 8px; }
    .viewer-content { padding: 12px; }
  }
`;