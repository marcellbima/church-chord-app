// src/lib/firestore.js
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ==================== SONGS ====================

export async function getSongs() {
  const q = query(collection(db, "songs"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getSongById(songId) {
  const ref = doc(db, "songs", songId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Song not found");
  return { id: snap.id, ...snap.data() };
}

export async function createSong({ title, key, fileUrl, fileType, totalPages }) {
  const ref = await addDoc(collection(db, "songs"), {
    title,
    key,         // e.g. "C", "Am", "G"
    fileUrl,
    fileType,    // "pdf" | "image"
    totalPages:  totalPages || 1,
    createdAt:   serverTimestamp(),
  });
  return ref.id;
}

export async function updateSong(songId, data) {
  const ref = doc(db, "songs", songId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSong(songId) {
  // Hapus semua chord dulu
  await deleteAllChords(songId);
  await deleteDoc(doc(db, "songs", songId));
}

// ==================== CHORDS (Subcollection) ====================

export async function getChords(songId) {
  const ref = collection(db, "songs", songId, "chords");
  const q = query(ref, orderBy("page"), orderBy("x"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function addChord(songId, { text, x, y, page }) {
  const ref = collection(db, "songs", songId, "chords");
  const docRef = await addDoc(ref, {
    text,   // e.g. "Am", "G", "F/C"
    x,      // posisi X dalam persen (0-100) relatif terhadap lebar partitur
    y,      // posisi Y dalam persen (0-100) relatif terhadap tinggi halaman
    page,   // nomor halaman (0-indexed)
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateChord(songId, chordId, data) {
  const ref = doc(db, "songs", songId, "chords", chordId);
  await updateDoc(ref, data);
}

export async function deleteChord(songId, chordId) {
  await deleteDoc(doc(db, "songs", songId, "chords", chordId));
}

export async function deleteAllChords(songId) {
  const chords = await getChords(songId);
  const promises = chords.map((c) =>
    deleteDoc(doc(db, "songs", songId, "chords", c.id))
  );
  await Promise.all(promises);
}

// Simpan semua chord sekaligus (bulk write saat admin selesai edit)
export async function saveAllChords(songId, chords) {
  // 1. Hapus semua chord lama
  await deleteAllChords(songId);
  // 2. Tulis ulang semua chord baru
  const ref = collection(db, "songs", songId, "chords");
  const promises = chords.map((c) =>
    addDoc(ref, {
      text: c.text,
      x:    c.x,
      y:    c.y,
      page: c.page,
      createdAt: serverTimestamp(),
    })
  );
  await Promise.all(promises);
}
