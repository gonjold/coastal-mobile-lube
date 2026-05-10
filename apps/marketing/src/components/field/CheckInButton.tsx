"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

type GeoResult = {
  lat: number;
  lng: number;
  accuracy: number;
} | null;

async function getPosition(): Promise<GeoResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  });
}

export function CheckInButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function checkIn() {
    if (pending) return;
    setPending(true);

    let geo: GeoResult = null;
    try {
      geo = await getPosition();
    } catch {
      geo = null;
    }

    if (!geo) {
      const ok = window.confirm("Couldn't get your location. Check in anyway?");
      if (!ok) {
        setPending(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/field/jobs/${jobId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geo ?? {}),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      toast.success("Checked in");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check-in failed";
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button onClick={checkIn} disabled={pending} className="flex-1 gap-1.5">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="h-4 w-4" strokeWidth={1.75} />
      )}
      {pending ? "Checking in" : "Check in"}
    </Button>
  );
}
