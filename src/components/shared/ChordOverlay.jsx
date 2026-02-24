// src/components/shared/ChordOverlay.jsx
/**
 * ChordOverlay - Merender chord sebagai label overlay di atas partitur
 *
 * Posisi chord disimpan dalam persen (x%, y%) relatif terhadap kontainer.
 * Saat readOnly=false (admin), chord bisa di-drag.
 */

export default function ChordOverlay({
  chords,
  containerWidth,
  containerHeight,
  readOnly = true,
  selectedId = null,
  onSelect,
  onDragEnd,
}) {
  if (!containerWidth || !containerHeight) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: containerWidth,
        height: containerHeight,
        pointerEvents: readOnly ? "none" : "auto",
      }}
    >
      {chords.map((chord) => (
        <ChordLabel
          key={chord.id}
          chord={chord}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          readOnly={readOnly}
          isSelected={selectedId === chord.id}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
}

function ChordLabel({
  chord,
  containerWidth,
  containerHeight,
  readOnly,
  isSelected,
  onSelect,
  onDragEnd,
}) {
  const x = (chord.x / 100) * containerWidth;
  const y = (chord.y / 100) * containerHeight;

  function handleMouseDown(e) {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(chord.id);

    const startX = e.clientX - x;
    const startY = e.clientY - y;

    function onMouseMove(me) {
      const newX = me.clientX - startX;
      const newY = me.clientY - startY;
      const pctX = Math.min(100, Math.max(0, (newX / containerWidth) * 100));
      const pctY = Math.min(100, Math.max(0, (newY / containerHeight) * 100));
      onDragEnd?.(chord.id, pctX, pctY);
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  // Touch support
  function handleTouchStart(e) {
    if (readOnly) return;
    const touch = e.touches[0];
    onSelect?.(chord.id);

    const startX = touch.clientX - x;
    const startY = touch.clientY - y;

    function onTouchMove(te) {
      const t = te.touches[0];
      const newX = t.clientX - startX;
      const newY = t.clientY - startY;
      const pctX = Math.min(100, Math.max(0, (newX / containerWidth) * 100));
      const pctY = Math.min(100, Math.max(0, (newY / containerHeight) * 100));
      onDragEnd?.(chord.id, pctX, pctY);
    }

    function onTouchEnd() {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    }

    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
        backgroundColor: isSelected ? "#c9a84c" : "rgba(26, 26, 46, 0.88)",
        color: isSelected ? "#1a1a2e" : "#f0d080",
        border: isSelected ? "2px solid #f0d080" : "1px solid rgba(200,160,60,0.6)",
        borderRadius: "4px",
        padding: "1px 5px",
        fontSize: "0.78rem",
        fontWeight: "bold",
        fontFamily: "'Courier New', monospace",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        cursor: readOnly ? "default" : "grab",
        userSelect: "none",
        zIndex: 10,
        boxShadow: isSelected
          ? "0 0 0 2px rgba(200,160,60,0.5)"
          : "0 1px 4px rgba(0,0,0,0.4)",
        transition: "background 0.1s, color 0.1s",
      }}
    >
      {chord.text}
    </div>
  );
}
