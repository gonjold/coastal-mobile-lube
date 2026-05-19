"use client";

import { useState, useRef } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import type { Booking } from "@/lib/types/booking";

type Photo = NonNullable<Booking["photos"]>[number];

interface Props {
  bookingId: string;
  photos: Photo[];
}

async function resizeImage(
  file: File,
  maxDim = 1920,
  quality = 0.85
): Promise<Blob> {
  const img = await createImageBitmap(file);
  const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.convertToBlob({ type: "image/jpeg", quality });
}

export default function PhotoCapture({ bookingId, photos }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<Photo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await resizeImage(file);
      const ts = Date.now();
      const fileRef = storageRef(storage, `photos/${bookingId}/${ts}.jpg`);
      await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(fileRef);
      await updateDoc(doc(db, "bookings", bookingId), {
        photos: arrayUnion({
          url,
          capturedAt: Timestamp.fromMillis(ts),
        }),
      });
    } catch (err) {
      console.error("Photo upload failed:", err);
      setError("Photo upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm("Delete this photo?")) return;
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        photos: arrayRemove(photo),
      });
      setEnlargedPhoto(null);
    } catch (err) {
      console.error("Photo delete failed:", err);
      setError("Delete failed. Try again.");
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full min-h-[48px] rounded-lg bg-[#E07B2D] font-semibold text-white shadow disabled:opacity-60"
      >
        {uploading ? "Uploading..." : "Add photo"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.url}
              onClick={() => setEnlargedPhoto(photo)}
              className="aspect-square overflow-hidden rounded-lg bg-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setEnlargedPhoto(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEnlargedPhoto(null);
            }}
            className="absolute right-4 top-4 px-4 py-3 text-2xl text-white"
            aria-label="Close"
          >
            ✕
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(enlargedPhoto);
            }}
            className="absolute bottom-6 left-1/2 min-h-[48px] -translate-x-1/2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white"
          >
            Delete photo
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enlargedPhoto.url}
            alt=""
            className="max-h-full max-w-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
