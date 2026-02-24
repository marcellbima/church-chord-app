// src/lib/transpose.js

// Urutan nada chromatic
const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Alias enharmonic (Db = C#, dll)
const ENHARMONIC = {
  Db: "C#", Eb: "D#", Fb: "E", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B",
};

// Normalisasi nada ke chromatic standar
function normalize(note) {
  return ENHARMONIC[note] || note;
}

// Transpose satu nada dasar (tanpa suffix seperti 'm', 'maj7', dll)
function transposeNote(note, semitones) {
  const normalized = normalize(note);
  const index = CHROMATIC.indexOf(normalized);
  if (index === -1) return note; // tidak dikenali, kembalikan apa adanya
  const newIndex = ((index + semitones) % 12 + 12) % 12;
  return CHROMATIC[newIndex];
}

/**
 * Parse chord string menjadi {root, bass, suffix}
 * Contoh: "Am7" → {root:"A", bass:null, suffix:"m7"}
 * Contoh: "G/B" → {root:"G", bass:"B", suffix:""}
 * Contoh: "Cmaj7/E" → {root:"C", bass:"E", suffix:"maj7"}
 */
function parseChord(chord) {
  // Regex: root note (dengan optional # atau b), lalu suffix, lalu optional /bass
  const match = chord.match(/^([A-G][#b]?)((?:m(?!aj)|dim|aug|maj|sus|add|\d|\/[^/])*?)(?:\/([A-G][#b]?))?$/);
  if (!match) return null;
  return {
    root:   match[1],
    suffix: match[2] || "",
    bass:   match[3] || null,
  };
}

/**
 * Transpose satu chord string
 * @param {string} chord - e.g. "Am7", "G/B", "Cmaj7"
 * @param {number} semitones - jumlah semitone (+/-)
 * @returns {string}
 */
export function transposeChord(chord, semitones) {
  if (!chord || semitones === 0) return chord;

  const parsed = parseChord(chord.trim());
  if (!parsed) return chord;

  const newRoot = transposeNote(parsed.root, semitones);
  const newBass = parsed.bass ? transposeNote(parsed.bass, semitones) : null;

  return newBass
    ? `${newRoot}${parsed.suffix}/${newBass}`
    : `${newRoot}${parsed.suffix}`;
}

/**
 * Transpose semua chord dalam array
 * @param {Array<{id, text, x, y, page}>} chords
 * @param {number} semitones
 * @returns {Array}
 */
export function transposeAll(chords, semitones) {
  return chords.map((c) => ({
    ...c,
    text: transposeChord(c.text, semitones),
  }));
}

/**
 * Transpose key lagu (untuk display kunci dasar)
 * @param {string} key - e.g. "C", "Am", "G#"
 * @param {number} semitones
 * @returns {string}
 */
export function transposeKey(key, semitones) {
  if (!key) return key;
  // key bisa "C", "Am", "C#m", dsb
  const isMinor = key.endsWith("m") && !key.endsWith("dim");
  const root = isMinor ? key.slice(0, -1) : key;
  const newRoot = transposeNote(root, semitones);
  return isMinor ? `${newRoot}m` : newRoot;
}

// Export chromatic scale untuk UI (pilih semitone target)
export { CHROMATIC };
