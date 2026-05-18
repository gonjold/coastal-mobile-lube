"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Booking } from "@/lib/types/booking";
import { decodeVIN } from "@/lib/vehicleApi";

// Dynamic imports keep @zxing / signature_pad off the initial page bundle.
const VinScanner = dynamic(() => import("@/components/tech/VinScanner"), { ssr: false });
const EstimateBuilder = dynamic(() => import("@/components/tech/EstimateBuilder"), { ssr: false });
const EstimateLocked = dynamic(() => import("@/components/tech/EstimateLocked"), { ssr: false });
const JobCompleted = dynamic(() => import("@/components/tech/JobCompleted"), { ssr: false });

interface Props {
  bookingId: string;
  isAssignedTech: boolean;
}

interface VehicleForm {
  year: string;
  make: string;
  model: string;
  trim: string;
  vin: string;
  licenseTag: string;
}

export default function TechJobDetail({ bookingId, isAssignedTech }: Props) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vehicle, setVehicle] = useState<VehicleForm>({
    year: "", make: "", model: "", trim: "", vin: "", licenseTag: "",
  });
  const [odometerIn, setOdometerIn] = useState<string>("");
  const [customerComplaint, setCustomerComplaint] = useState<string>("");
  const [showScanner, setShowScanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [decodeStatus, setDecodeStatus] = useState<"idle" | "decoding" | "success" | "failed">("idle");
  const [decodeMessage, setDecodeMessage] = useState<string>("");

  useEffect(() => {
    if (!bookingId) return;
    const unsub = onSnapshot(
      doc(db, "bookings", bookingId),
      (snap) => {
        if (!snap.exists()) {
          setError("Job not found.");
          setLoading(false);
          return;
        }
        const data = { id: snap.id, ...snap.data() } as Booking;
        setBooking(data);
        setHydrated((wasHydrated) => {
          if (!wasHydrated) {
            setVehicle({
              year: data.vehicleYear?.toString() || "",
              make: data.vehicleMake || "",
              model: data.vehicleModel || "",
              trim: data.vehicleTrim || "",
              vin: data.vin || data.vinOrHull || "",
              licenseTag: data.licenseTag || "",
            });
            setOdometerIn(data.odometerIn != null ? String(data.odometerIn) : "");
            setCustomerComplaint(
              data.customerComplaint || data.notes || data.otherDescription || ""
            );
          }
          return true;
        });
        setLoading(false);
      },
      (err) => {
        setError("Failed to load job: " + err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [bookingId]);

  useEffect(() => {
    const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
    const vin = vehicle.vin;
    if (!vin || !VIN_REGEX.test(vin)) {
      setDecodeStatus("idle");
      setDecodeMessage("");
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setDecodeStatus("decoding");
      setDecodeMessage("Decoding VIN…");
      try {
        const result = await decodeVIN(vin);
        if (cancelled) return;
        if (!result || !result.vinDecoded) {
          setDecodeStatus("failed");
          setDecodeMessage("");
          return;
        }
        setVehicle((prev) => ({
          ...prev,
          year: result.year && result.year !== prev.year ? result.year : prev.year,
          make: result.make && result.make !== prev.make ? result.make : prev.make,
          model: result.model && result.model !== prev.model ? result.model : prev.model,
          trim: result.trim && result.trim !== prev.trim ? result.trim : prev.trim,
        }));
        setDecodeStatus("success");
        setDecodeMessage("VIN decoded");
      } catch {
        if (!cancelled) {
          setDecodeStatus("failed");
          setDecodeMessage("");
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [vehicle.vin]);

  async function handleStartJob() {
    if (!booking) return;
    const odoNum = parseInt(odometerIn.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(odoNum)) {
      setSaveError("Odometer In is required.");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const vinTrimmed = vehicle.vin.trim() || null;
      const updatePayload: Record<string, unknown> = {
        vehicleInfo: {
          year: vehicle.year ? parseInt(vehicle.year, 10) : null,
          make: vehicle.make.trim() || null,
          model: vehicle.model.trim() || null,
          trim: vehicle.trim.trim() || null,
          vin: vinTrimmed,
          licenseTag: vehicle.licenseTag.trim() || null,
          odometerIn: odoNum,
          odometerOut: booking.vehicleInfo?.odometerOut ?? null,
        },
        odometerIn: odoNum,
        licenseTag: vehicle.licenseTag.trim() || null,
        customerComplaint: customerComplaint.trim() || null,
        techCheckInAt: serverTimestamp(),
        jobStartedAt: serverTimestamp(),
        status: "in-progress",
        updatedAt: serverTimestamp(),
      };
      if (vehicle.year) updatePayload.vehicleYear = vehicle.year;
      if (vehicle.make) updatePayload.vehicleMake = vehicle.make.trim();
      if (vehicle.model) updatePayload.vehicleModel = vehicle.model.trim();
      if (vehicle.trim) updatePayload.vehicleTrim = vehicle.trim.trim();
      if (vinTrimmed) updatePayload.vin = vinTrimmed;
      await updateDoc(doc(db, "bookings", bookingId), updatePayload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setSaveError("Failed to save: " + msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="px-4 py-8 text-slate-500">Loading…</div>;
  if (error) return <div className="px-4 py-8 text-red-700">{error}</div>;
  if (!booking) return null;

  if (booking.status === "completed") {
    return <JobCompleted booking={booking} />;
  }

  if (booking.estimateLocked) {
    return <EstimateLocked booking={booking} />;
  }

  if (booking.techCheckInAt) {
    return <EstimateBuilder booking={booking} />;
  }

  // Pre-check-in panel
  if (!isAssignedTech) {
    return (
      <div className="px-4 py-6 text-slate-700">
        <p className="text-sm">
          This job is not assigned to you. Ask dispatch to assign it before
          starting check-in.
        </p>
      </div>
    );
  }

  const customerName = booking.customerName || booking.name || "Customer";
  const showScanButton = typeof navigator !== "undefined" && !!navigator.mediaDevices;

  return (
    <div className="pb-24">
      <header className="mb-4 mt-2">
        <h1 className="text-xl font-bold text-[#0B2040]">{customerName}</h1>
        <div className="text-sm text-slate-700">{booking.address}</div>
        <div className="mt-1 text-xs text-slate-500">
          {formatBookingTime(booking)} · {booking.service || ""}
        </div>
      </header>

      <Section title="Vehicle">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Year" value={vehicle.year} onChange={(v) => setVehicle({ ...vehicle, year: v })} type="number" />
          <Field label="Make" value={vehicle.make} onChange={(v) => setVehicle({ ...vehicle, make: v })} />
          <Field label="Model" value={vehicle.model} onChange={(v) => setVehicle({ ...vehicle, model: v })} />
          <Field label="Trim" value={vehicle.trim} onChange={(v) => setVehicle({ ...vehicle, trim: v })} />
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">VIN</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={vehicle.vin}
              onChange={(e) => setVehicle({ ...vehicle, vin: e.target.value.toUpperCase() })}
              placeholder="17-character VIN"
              className="flex-1 rounded border border-slate-300 px-3 py-3 text-base font-mono uppercase"
              maxLength={18}
            />
            {showScanButton && (
              <button
                onClick={() => setShowScanner(true)}
                className="rounded bg-[#0B2040] px-4 py-3 text-sm font-semibold text-white"
              >
                Scan
              </button>
            )}
          </div>
          {decodeStatus === "decoding" && (
            <p className="mt-1 text-sm text-slate-500">Decoding VIN…</p>
          )}
          {decodeStatus === "success" && decodeMessage && (
            <p className="mt-1 text-sm text-green-600">{decodeMessage}</p>
          )}
        </div>
        <div className="mt-3">
          <Field label="License Tag" value={vehicle.licenseTag} onChange={(v) => setVehicle({ ...vehicle, licenseTag: v })} placeholder="Optional" />
        </div>
      </Section>

      <Section title="Odometer In">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={odometerIn}
          onChange={(e) => setOdometerIn(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Current mileage"
          className="w-full rounded border border-slate-300 px-3 py-3 text-base"
        />
        <div className="mt-1 text-xs text-slate-500">Required. Numeric only.</div>
      </Section>

      <Section title="Customer Concern / Reason for Service">
        <textarea
          value={customerComplaint}
          onChange={(e) => setCustomerComplaint(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder="Optional. What did the customer say is wrong, or why are they getting service today?"
          className="w-full rounded border border-slate-300 px-3 py-3 text-base"
        />
        <div className="mt-1 text-right text-xs text-slate-400">{customerComplaint.length} / 1000</div>
      </Section>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3 shadow-lg">
        <div className="mx-auto max-w-2xl">
          {saveError && (
            <div className="mb-2 rounded bg-red-50 p-2 text-sm text-red-700">{saveError}</div>
          )}
          <button
            onClick={handleStartJob}
            disabled={saving}
            className="w-full min-h-[48px] rounded-lg bg-[#E07B2D] px-4 py-4 text-base font-semibold text-white shadow disabled:opacity-50"
          >
            {saving ? "Starting…" : "Start Job"}
          </button>
        </div>
      </div>

      {showScanner && (
        <VinScanner
          onScan={(vin) => {
            setVehicle((prev) => ({ ...prev, vin }));
            setShowScanner(false);
          }}
          onCancel={() => setShowScanner(false)}
          onManualEntry={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-slate-300 px-3 py-3 text-base"
      />
    </div>
  );
}

function formatBookingTime(b: Booking): string {
  const date = b.confirmedDate || b.preferredDate;
  const window = b.confirmedArrivalWindow || b.timeWindow;
  if (!date) return "Time TBD";
  const d = new Date(String(date) + "T12:00:00");
  if (isNaN(d.getTime())) return window || "Time TBD";
  const ds = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return window ? `${ds} · ${window}` : ds;
}
