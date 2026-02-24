# ♪ Church Chord App

Aplikasi web untuk menampilkan partitur lagu gereja dengan overlay chord interaktif.

---

## 🗂 Struktur Folder

```
church-chord-app/
├── src/
│   ├── App.jsx                    ← Entry point, routing user/admin
│   ├── main.jsx                   ← React root render
│   ├── lib/
│   │   ├── firebase.js            ← Firebase config & instance
│   │   ├── firestore.js           ← CRUD songs & chords
│   │   ├── storage.js             ← Upload/delete file partitur
│   │   └── transpose.js           ← Sistem transpose chord
│   ├── hooks/
│   │   └── useAuth.js             ← Firebase Auth context & hook
│   └── components/
│       ├── user/
│       │   ├── SongList.jsx       ← Halaman daftar lagu (user)
│       │   └── SongViewer.jsx     ← Viewer partitur + chord + transpose
│       ├── admin/
│       │   ├── AdminLogin.jsx     ← Form login admin
│       │   ├── AdminDashboard.jsx ← Manajemen lagu (admin)
│       │   ├── ChordEditor.jsx    ← Editor chord drag & drop
│       │   └── UploadSong.jsx     ← Form upload partitur
│       └── shared/
│           ├── ChordOverlay.jsx   ← Overlay chord (read & edit mode)
│           └── PdfViewer.jsx      ← Render PDF dengan PDF.js
├── index.html                     ← HTML + PDF.js CDN
├── vite.config.js
├── package.json
├── firebase.json                  ← Firebase Hosting config
├── firestore.rules                ← Security rules Firestore
├── firestore.indexes.json         ← Index Firestore
└── storage.rules                  ← Security rules Storage
```

---

## 🚀 Setup Step-by-Step

### 1. Buat Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Klik **Add Project** → beri nama → selesaikan wizard
3. Di Project Settings → **Your apps** → klik ikon Web (`</>`)
4. Daftarkan app, copy `firebaseConfig`

### 2. Aktifkan Layanan Firebase

Di Firebase Console:

- **Authentication** → Sign-in method → aktifkan **Email/Password**
- **Firestore Database** → Create database → pilih region terdekat (misalnya `asia-southeast1`)
- **Storage** → Get started

### 3. Buat Akun Admin

Di Firebase Console → Authentication → **Add user**:
- Masukkan email & password admin Anda

### 4. Konfigurasi App

Edit `src/lib/firebase.js`, isi dengan config Anda:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "nama-project.firebaseapp.com",
  projectId: "nama-project",
  storageBucket: "nama-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc...",
};
```

### 5. Install & Jalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`

---

## 📱 Penggunaan

### User (publik)
- Buka URL aplikasi → lihat daftar lagu
- Klik lagu → lihat partitur + chord overlay
- Gunakan tombol **+/−** untuk transpose
- Gunakan tombol zoom dan fullscreen

### Admin
- Buka `http://localhost:5173/#admin` (atau klik link kecil "admin" di footer)
- Login dengan email & password admin
- **Upload Partitur**: klik "+ Upload Partitur", isi judul, kunci, pilih file PDF/gambar
- **Edit Chord**: klik "✏ Edit Chord" pada lagu
  - Klik "+ Tambah Chord" untuk aktifkan mode tambah
  - Klik pada partitur → ketik chord → Enter
  - Drag chord untuk pindahkan posisi
  - Klik chord untuk select → edit atau hapus
  - Klik "💾 Simpan" untuk menyimpan ke Firestore

---

## 🎵 Sistem Transpose

Mendukung semua chord standar:

| Jenis | Contoh |
|-------|--------|
| Major | C, D, E, F, G, A, B |
| Sharp | C#, D#, F#, G#, A# |
| Minor | Am, Bm, Cm, Dm, Em |
| Slash | G/B, F/C, Am/E |
| Extended | Cmaj7, G7, Am7, Dsus4 |
| Enharmonic | Db→C#, Eb→D#, Bb→A# |

```js
import { transposeChord, transposeAll, transposeKey } from "./lib/transpose";

transposeChord("Am", 2)          // → "Bm"
transposeChord("G/B", 1)         // → "G#/C"
transposeChord("Cmaj7", -1)      // → "Bmaj7"
transposeKey("C", 2)             // → "D"
transposeKey("Am", 3)            // → "Cm"
```

---

## ☁️ Deploy

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting    # pilih dist, SPA=yes
npm run build
firebase deploy
```

### Vercel (alternatif)

```bash
npm install -g vercel
vercel --prod
```

> Pastikan environment variable Firebase Anda di-set jika menggunakan `.env`

---

## 🗄 Struktur Firestore

```
songs/                           ← Collection
  {songId}/                      ← Document
    title: "Bapa Kami"
    key: "C"
    fileUrl: "https://storage.googleapis.com/..."
    fileType: "pdf"              // "pdf" | "image"
    storagePath: "scores/..."
    totalPages: 2
    createdAt: Timestamp

    chords/                      ← Subcollection
      {chordId}/                 ← Document
        text: "Am"
        x: 23.5                  // posisi % dari lebar kontainer
        y: 41.2                  // posisi % dari tinggi halaman
        page: 0                  // nomor halaman (0-indexed)
        createdAt: Timestamp
```

---

## 🔒 Security Rules Ringkasan

| Resource | Read | Write |
|----------|------|-------|
| songs | ✅ Publik | 🔐 Admin (auth) |
| songs/chords | ✅ Publik | 🔐 Admin (auth) |
| storage/scores | ✅ Publik | 🔐 Admin (auth), max 20MB |

---

## 🛠 Tech Stack

- **React + Vite** — frontend framework
- **Firebase Auth** — autentikasi admin
- **Cloud Firestore** — database chord & metadata lagu
- **Firebase Storage** — penyimpanan PDF/gambar partitur
- **PDF.js (CDN)** — render PDF di browser
- **Firebase Hosting / Vercel** — deployment

---

## 📦 Pengembangan Lanjutan (Opsaran)

- [ ] Multi-user admin (role-based via Firestore)
- [ ] Export chord sheet ke PDF
- [ ] Import chord dari file teks/ChordPro
- [ ] Pencarian chord otomatis dengan AI
- [ ] Metronome terintegrasi
- [ ] Koleksi lagu per event/ibadah
