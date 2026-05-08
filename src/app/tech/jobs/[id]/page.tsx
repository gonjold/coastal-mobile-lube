'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Booking, FirestoreTimestamp } from '@/app/admin/shared';
import { decodeVIN } from '@/lib/vehicleApi';

// Dynamically import VinScanner so the @zxing libraries don't bloat the initial page bundle.
const VinScanner = dynamic(() => import('@/components/tech/VinScanner'), { ssr: false });
const EstimateBuilder = dynamic(() => import('@/components/tech/EstimateBuilder'), { ssr: false });
const EstimateLocked = dynamic(() => import('@/components/tech/EstimateLocked'), { ssr: false });

interface VehicleForm {
  year: string;
  make: string;
  model: string;
  trim: string;
  vin: string;
  licenseTag: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vehicle, setVehicle] = useState<VehicleForm>({
    year: '', make: '', model: '', trim: '', vin: '', licenseTag: '',
  });
  const [odometerIn, setOdometerIn] = useState<string>('');
  const [customerComplaint, setCustomerComplaint] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [decodeStatus, setDecodeStatus] = useState<'idle' | 'decoding' | 'success' | 'failed'>('idle');
  const [decodeMessage, setDecodeMessage] = useState<string>('');

  useEffect(() => {
    if (!jobId) return;
    const unsub = onSnapshot(
      doc(db, 'bookings', jobId),
      (snap) => {
        if (!snap.exists()) {
          setError('Job not found.');
          setLoading(false);
          return;
        }
        const data = { id: snap.id, ...snap.data() } as Booking;
        setBooking(data);

        // Hydrate form fields once — don't overwrite tech's typing on subsequent snapshots.
        setHydrated((wasHydrated) => {
          if (!wasHydrated) {
            setVehicle({
              year: data.vehicleYear?.toString() || '',
              make: data.vehicleMake || '',
              model: data.vehicleModel || '',
              trim: data.vehicleTrim || '',
              vin: data.vin || data.vinOrHull || '',
              licenseTag: data.licenseTag || '',
            });
            setOdometerIn(data.odometerIn?.toString() || '');
            setCustomerComplaint(
              data.customerComplaint || data.notes || data.otherDescription || ''
            );
          }
          return true;
        });
        setLoading(false);
      },
      (err) => {
        setError('Failed to load job: ' + err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [jobId]);

  useEffect(() => {
    const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
    const vin = vehicle.vin;
    if (!vin || !VIN_REGEX.test(vin)) {
      setDecodeStatus('idle');
      setDecodeMessage('');
      return;
    }

    let cancelled = false;
    let dismissTimer: ReturnType<typeof setTimeout> | null = null;
    const t = setTimeout(async () => {
      setDecodeStatus('decoding');
      setDecodeMessage('Decoding VIN…');
      try {
        const result = await decodeVIN(vin);
        if (cancelled) return;
        if (!result || !result.vinDecoded) {
          console.warn('VIN decode returned no match:', vin);
          setDecodeStatus('failed');
          setDecodeMessage('');
          return;
        }
        setVehicle((prev) => {
          const next = { ...prev };
          if (result.year && result.year !== prev.year) next.year = result.year;
          if (result.make && result.make !== prev.make) next.make = result.make;
          if (result.model && result.model !== prev.model) next.model = result.model;
          if (result.trim && result.trim !== prev.trim) next.trim = result.trim;
          return next;
        });
        setDecodeStatus('success');
        setDecodeMessage(
          `Decoded: ${result.year} ${(result.make || '').toUpperCase()} ${result.model || ''}`.trim()
        );
        dismissTimer = setTimeout(() => {
          if (!cancelled) {
            setDecodeStatus('idle');
            setDecodeMessage('');
          }
        }, 2000);
      } catch (err) {
        if (cancelled) return;
        console.error('VIN decode failed:', err);
        setDecodeStatus('failed');
        setDecodeMessage('');
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(t);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [vehicle.vin]);

  if (loading) {
    return <div className="p-4 text-slate-500">Loading job…</div>;
  }

  if (error || !booking) {
    return (
      <div className="p-4">
        <Link href="/tech/jobs" className="text-sm text-slate-600 hover:underline">← Back to jobs</Link>
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || 'Job not found'}
        </div>
      </div>
    );
  }

  const isInProgress = booking.status === 'in-progress';
  const isCompleted = booking.status === 'completed';

  if (isInProgress) {
    return (
      <div className="pb-24">
        <Link href="/tech/jobs" className="text-sm text-slate-600 hover:underline">← Back to jobs</Link>
        {booking.estimateLocked ? (
          <EstimateLocked booking={booking} />
        ) : (
          <EstimateBuilder booking={booking} />
        )}
      </div>
    );
  }

  if (isCompleted) {
    return <JobInProgressView booking={booking} />;
  }

  async function handleStartJob() {
    setSaveError(null);

    if (!odometerIn.trim()) {
      setSaveError('Odometer In is required.');
      return;
    }
    const odoNum = parseInt(odometerIn.replace(/,/g, ''), 10);
    if (isNaN(odoNum) || odoNum < 0 || odoNum > 9999999) {
      setSaveError('Odometer must be a number between 0 and 9,999,999.');
      return;
    }

    const vinTrimmed = vehicle.vin.trim().toUpperCase();
    if (vinTrimmed && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vinTrimmed)) {
      const ok = confirm(
        "VIN doesn't match standard format (17 chars, no I/O/Q). Save anyway?"
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      const bookingSafe = booking!;
      const updatePayload: Record<string, unknown> = {
        vehicleInfo: {
          year: vehicle.year ? parseInt(vehicle.year, 10) : null,
          make: vehicle.make.trim() || null,
          model: vehicle.model.trim() || null,
          trim: vehicle.trim.trim() || null,
          vin: vinTrimmed || null,
          licenseTag: vehicle.licenseTag.trim() || null,
          odometerIn: odoNum,
          odometerOut: bookingSafe.vehicleInfo?.odometerOut ?? null,
        },
        odometerIn: odoNum,
        licenseTag: vehicle.licenseTag.trim() || null,
        customerComplaint: customerComplaint.trim() || null,
        techCheckInAt: serverTimestamp(),
        jobStartedAt: serverTimestamp(),
        status: 'in-progress',
        updatedAt: serverTimestamp(),
      };

      // Mirror tech edits onto flat vehicle fields so admin display stays consistent.
      if (vehicle.year) updatePayload.vehicleYear = vehicle.year;
      if (vehicle.make) updatePayload.vehicleMake = vehicle.make.trim();
      if (vehicle.model) updatePayload.vehicleModel = vehicle.model.trim();
      if (vehicle.trim) updatePayload.vehicleTrim = vehicle.trim.trim();
      if (vinTrimmed) updatePayload.vin = vinTrimmed;

      await updateDoc(doc(db, 'bookings', jobId), updatePayload);
      // onSnapshot listener flips booking.status to 'in-progress', which renders the in-progress view.
    } catch (e: unknown) {
      console.error('Failed to start job:', e);
      const msg = e instanceof Error ? e.message : 'unknown error';
      setSaveError('Failed to save: ' + msg);
    } finally {
      setSaving(false);
    }
  }

  const customerName = booking.customerName || booking.name || 'Customer';
  const showScanButton =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices;

  return (
    <div className="pb-24">
      <Link href="/tech/jobs" className="text-sm text-slate-600 hover:underline">← Back to jobs</Link>

      <header className="mb-4 mt-2">
        <h1 className="text-xl font-bold text-[#0B2040]">{customerName}</h1>
        <div className="text-sm text-slate-700">{booking.address}</div>
        <div className="mt-1 text-xs text-slate-500">
          {formatBookingTime(booking)} · {booking.service || ''}
        </div>
      </header>

      <Section title="Vehicle">
        <div className="grid grid-cols-2 gap-2">
          <Input label="Year" value={vehicle.year} onChange={(v) => setVehicle({ ...vehicle, year: v })} type="number" />
          <Input label="Make" value={vehicle.make} onChange={(v) => setVehicle({ ...vehicle, make: v })} />
          <Input label="Model" value={vehicle.model} onChange={(v) => setVehicle({ ...vehicle, model: v })} />
          <Input label="Trim" value={vehicle.trim} onChange={(v) => setVehicle({ ...vehicle, trim: v })} />
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
          {decodeStatus === 'decoding' && (
            <p className="mt-1 text-sm text-slate-500">Decoding VIN…</p>
          )}
          {decodeStatus === 'success' && decodeMessage && (
            <p className="mt-1 text-sm text-green-600">{decodeMessage}</p>
          )}
        </div>

        <div className="mt-3">
          <Input label="License Tag" value={vehicle.licenseTag} onChange={(v) => setVehicle({ ...vehicle, licenseTag: v })} placeholder="Optional" />
        </div>
      </Section>

      <Section title="Odometer In">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={odometerIn}
          onChange={(e) => setOdometerIn(e.target.value.replace(/[^0-9]/g, ''))}
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
            className="w-full rounded-lg bg-[#E07B2D] px-4 py-4 text-base font-semibold text-white shadow disabled:opacity-50"
          >
            {saving ? 'Starting…' : 'Start Job'}
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

function JobInProgressView({ booking }: { booking: Booking }) {
  const v = booking.vehicleInfo;
  const customerName = booking.customerName || booking.name || 'Customer';
  const fallbackVehicle = [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel, booking.vehicleTrim]
    .filter(Boolean).join(' ');
  const vehicleDisplay = [v?.year, v?.make, v?.model, v?.trim].filter(Boolean).join(' ') || fallbackVehicle || 'Vehicle pending';

  return (
    <div>
      <Link href="/tech/jobs" className="text-sm text-slate-600 hover:underline">← Back to jobs</Link>

      <header className="mb-4 mt-2">
        <div className="mb-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase text-amber-800">
          {booking.status === 'completed' ? 'Completed' : 'In Progress'}
        </div>
        <h1 className="text-xl font-bold text-[#0B2040]">{customerName}</h1>
        <div className="text-sm text-slate-700">{booking.address}</div>
      </header>

      <Section title="Vehicle">
        <div className="text-sm">
          <div>{vehicleDisplay}</div>
          {(v?.vin || booking.vin) && <div className="font-mono">VIN: {v?.vin || booking.vin}</div>}
          {(v?.licenseTag || booking.licenseTag) && <div>Tag: {v?.licenseTag || booking.licenseTag}</div>}
          {v?.odometerIn != null && (
            <div>Odometer In: {v.odometerIn.toLocaleString()} mi</div>
          )}
          {v?.odometerOut != null && (
            <div>Odometer Out: {v.odometerOut.toLocaleString()} mi</div>
          )}
        </div>
      </Section>

      {booking.customerComplaint && (
        <Section title="Customer Concern">
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm italic text-slate-700">
            {booking.customerComplaint}
          </div>
        </Section>
      )}

      <Section title="Job Lifecycle">
        <div className="text-sm">
          <div>Started: {formatTimestamp(booking.jobStartedAt)}</div>
          {booking.jobCompletedAt && (
            <div>Completed: {formatTimestamp(booking.jobCompletedAt)}</div>
          )}
        </div>
      </Section>

      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <div className="text-base font-semibold text-[#0B2040]">Work in progress</div>
        <div className="mt-1 text-sm text-slate-600">
          The work flow (line items, photos, odometer out, customer signature, complete job) ships in subsequent WOs.
        </div>
      </div>
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

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
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
  if (!date) return 'Time TBD';
  const d = new Date(String(date) + 'T12:00:00');
  if (isNaN(d.getTime())) return window || 'Time TBD';
  const ds = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return window ? `${ds} · ${window}` : ds;
}

function formatTimestamp(ts: FirestoreTimestamp | null | undefined): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts as unknown as string);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
