// src/components/shared/PdfViewer.jsx
/**
 * PdfViewer - render satu halaman PDF menggunakan PDF.js
 *
 * Setup: tambahkan di index.html atau _document.js:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
 * <script>pdfjsLib.GlobalWorkerOptions.workerSrc =
 *   'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';</script>
 */
import { useEffect, useRef, useState } from "react";

export default function PdfViewer({ url, page = 0, onPageCount, onDimensionsChange }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url || typeof window === "undefined") return;
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) {
      setError("PDF.js belum di-load. Tambahkan script PDF.js di index.html.");
      return;
    }

    let cancelled = false;

    async function renderPage() {
      try {
        const pdf = await pdfjsLib.getDocument({ url }).promise;
        if (cancelled) return;

        onPageCount?.(pdf.numPages);

        const pageNum = page + 1; // PDF.js 1-indexed
        const pdfPage = await pdf.getPage(Math.min(pageNum, pdf.numPages));
        if (cancelled) return;

        const viewport = pdfPage.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        onDimensionsChange?.(viewport.width, viewport.height);

        await pdfPage.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        }).promise;
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    renderPage();
    return () => { cancelled = true; };
  }, [url, page]);

  if (error) {
    return (
      <div style={{
        padding: 24, background: "#2d1a1a", color: "#ff8888",
        borderRadius: 8, fontFamily: "monospace", fontSize: "0.85rem",
      }}>
        ⚠ Error PDF: {error}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", display: "block", borderRadius: 4 }}
    />
  );
}
