// src/lib/storage.js
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = "scores";

export async function uploadScore(file, songId, onProgress) {
  const ext = file.name.split(".").pop().toLowerCase();
  const fileType = ext === "pdf" ? "pdf" : "image";
  const storagePath = `${songId}/${Date.now()}.${ext}`;

  onProgress?.(10);

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: file,
    }
  );

  onProgress?.(80);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Upload gagal: ${response.status}`);
  }

  onProgress?.(100);

  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
  return { url, fileType, storagePath };
}

export async function deleteScore(storagePath) {
  if (!storagePath) return;
  await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    }
  );
}