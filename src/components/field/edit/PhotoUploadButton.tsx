"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CLOUD_NAME = "dgcdcqjrz";
const UPLOAD_PRESET = "coastal_field_photos";
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
};

export function PhotoUploadButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  function pickFile() {
    if (busy) return;
    inputRef.current?.click();
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", `coastal/field/jobs/${jobId}`);

      const cloudRes = await fetch(UPLOAD_URL, { method: "POST", body: fd });
      const cloudJson = (await cloudRes.json().catch(() => ({}))) as
        | CloudinaryUploadResponse
        | undefined;

      if (!cloudRes.ok || !cloudJson?.secure_url || !cloudJson.public_id) {
        toast.error("Upload failed", {
          description:
            cloudJson?.error?.message ??
            `Cloudinary returned HTTP ${cloudRes.status}`,
        });
        return;
      }

      const apiRes = await fetch(`/api/field/jobs/${jobId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secure_url: cloudJson.secure_url,
          public_id: cloudJson.public_id,
        }),
      });
      const apiJson = await apiRes.json().catch(() => ({}));
      if (!apiRes.ok) {
        toast.error("Photo saved to Cloudinary but not linked", {
          description: apiJson?.error ?? `HTTP ${apiRes.status}`,
        });
        return;
      }

      toast.success("Photo uploaded");
      router.refresh();
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={pickFile}
        disabled={busy}
        aria-label="Add photo"
      >
        {busy ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" strokeWidth={1.75} />
        ) : (
          <Camera className="mr-1 h-3 w-3" strokeWidth={1.75} />
        )}
        Add
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onChange}
      />
    </>
  );
}
