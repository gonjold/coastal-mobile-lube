'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X, Edit3 } from 'lucide-react';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { Badge, Button, Card, Input } from '@coastal/shared-ui';
import {
  formatBookingService,
  formatBookingVehicle,
  getBookingArrivalTime,
} from '@coastal/shared-types';
import { db } from '@/lib/firebase';
import type { BookingDoc } from '@/lib/queries/bookings';
import type { Invoice } from '@coastal/shared-types';

const STATUS_OPTIONS = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'dead', 'new-lead'];

interface FormState {
  confirmedDate: string;
  timeWindow: string;
  confirmedArrivalWindow: string;
  status: string;
  assignedTechId: string;
  notes: string;
  adminNotes: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
}

function bookingToForm(b: BookingDoc): FormState {
  return {
    confirmedDate: b.confirmedDate || (b as { preferredDate?: string }).preferredDate || '',
    timeWindow: b.timeWindow || '',
    confirmedArrivalWindow: b.confirmedArrivalWindow || '',
    status: b.status || 'pending',
    assignedTechId: b.assignedTechId || '',
    notes: (b as { notes?: string }).notes || '',
    adminNotes: (b as { adminNotes?: string }).adminNotes || '',
    vehicleYear: typeof b.vehicleYear === 'number' ? String(b.vehicleYear) : (b.vehicleYear || ''),
    vehicleMake: b.vehicleMake || '',
    vehicleModel: b.vehicleModel || '',
    vin: (b as { vin?: string }).vin || '',
  };
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [booking, setBooking] = useState<BookingDoc | null>(null);
  const [invoice, setInvoice] = useState<(Invoice & { id: string }) | null>(null);
  const [techOptions, setTechOptions] = useState<{ uid: string; displayName: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'bookings', id));
        if (cancelled) return;
        if (!snap.exists()) {
          setError('Booking not found');
          return;
        }
        const b = { id: snap.id, ...snap.data() } as BookingDoc;
        setBooking(b);
        setForm(bookingToForm(b));

        if (b.invoiceId) {
          const invSnap = await getDoc(doc(db, 'invoices', b.invoiceId));
          if (!cancelled && invSnap.exists()) {
            setInvoice({ id: invSnap.id, ...invSnap.data() } as Invoice & { id: string });
          }
        }

        const techSnap = await getDocs(query(collection(db, 'users'), where('role', 'in', ['tech', 'owner'])));
        if (cancelled) return;
        setTechOptions(
          techSnap.docs.map(d => {
            const data = d.data() as { uid?: string; displayName?: string };
            return { uid: data.uid ?? d.id, displayName: data.displayName ?? '' };
          }),
        );
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load booking');
      }
    })();
    return () => { cancelled = true; };
  }, [id, refreshKey]);

  if (error) return <div className="px-6 py-8 text-red-700">{error}</div>;
  if (!booking || !form) return <div className="px-6 py-8 text-muted-foreground">Loading…</div>;

  const customerId = (booking as { customerId?: string }).customerId;

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'bookings', id), {
        confirmedDate: form.confirmedDate,
        timeWindow: form.timeWindow,
        confirmedArrivalWindow: form.confirmedArrivalWindow,
        status: form.status,
        assignedTechId: form.assignedTechId || null,
        notes: form.notes,
        adminNotes: form.adminNotes,
        vehicleYear: form.vehicleYear,
        vehicleMake: form.vehicleMake,
        vehicleModel: form.vehicleModel,
        vin: form.vin,
        updatedAt: serverTimestamp(),
      });
      toast.success('Saved');
      setEditing(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      toast.error('Save failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditing(false);
    if (booking) setForm(bookingToForm(booking));
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1100px] mx-auto">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/jobs" className="text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            {(booking as { name?: string }).name || (booking as { customerName?: string }).customerName || 'Booking'}{' '}
            <span className="text-muted-foreground text-base font-normal">#{id.slice(0, 7)}</span>
          </h1>
          <Badge variant="outline" className="capitalize">{form.status}</Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancel} disabled={saving}><X className="h-4 w-4 mr-1" /> Cancel</Button>
              <Button size="sm" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" /> {saving ? 'Saving…' : 'Save'}</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit3 className="h-4 w-4 mr-1" /> Edit</Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Customer</h2>
            <div className="text-sm grid grid-cols-2 gap-2">
              <Read label="Name" value={(booking as { name?: string }).name || (booking as { customerName?: string }).customerName} />
              <Read label="Phone" value={booking.phone || booking.customerPhone} />
              <Read label="Email" value={booking.email || booking.customerEmail} />
              <Read label="Address" value={booking.address} />
            </div>
            {customerId && (
              <Link href={`/customers/${customerId}`} className="text-xs text-primary hover:underline">
                Open customer profile →
              </Link>
            )}
          </Card>

          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vehicle</h2>
            {editing ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Year"><Input value={form.vehicleYear} onChange={e => setForm({ ...form, vehicleYear: e.target.value })} /></Field>
                <Field label="Make"><Input value={form.vehicleMake} onChange={e => setForm({ ...form, vehicleMake: e.target.value })} /></Field>
                <Field label="Model"><Input value={form.vehicleModel} onChange={e => setForm({ ...form, vehicleModel: e.target.value })} /></Field>
                <Field label="VIN"><Input value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value })} /></Field>
              </div>
            ) : (
              <div className="text-sm">{formatBookingVehicle(booking) || '—'}</div>
            )}
          </Card>

          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Services</h2>
            {booking.selectedServices && booking.selectedServices.length > 0 ? (
              <ul className="text-sm divide-y divide-border">
                {booking.selectedServices.map((s, i) => (
                  <li key={i} className="py-2 flex justify-between gap-3">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground">
                      {typeof s.price === 'number' ? formatCurrency(s.price) : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm">{formatBookingService(booking)}</div>
            )}
          </Card>

          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Schedule</h2>
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Confirmed date"><Input type="date" value={form.confirmedDate} onChange={e => setForm({ ...form, confirmedDate: e.target.value })} /></Field>
                <Field label="Time window"><Input value={form.timeWindow} onChange={e => setForm({ ...form, timeWindow: e.target.value })} placeholder="morning / midday / …" /></Field>
                <Field label="Arrival window"><Input value={form.confirmedArrivalWindow} onChange={e => setForm({ ...form, confirmedArrivalWindow: e.target.value })} placeholder="8:00 - 9:00 AM" /></Field>
              </div>
            ) : (
              <div className="text-sm grid grid-cols-3 gap-3">
                <Read label="Confirmed date" value={form.confirmedDate} />
                <Read label="Time" value={form.timeWindow || getBookingArrivalTime(booking)} />
                <Read label="Division" value={(booking as { division?: string }).division} />
              </div>
            )}
          </Card>

          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status & Assignment</h2>
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Status">
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="h-9 px-2 border border-border rounded-md bg-background text-sm">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Assigned tech">
                  <select value={form.assignedTechId} onChange={e => setForm({ ...form, assignedTechId: e.target.value })} className="h-9 px-2 border border-border rounded-md bg-background text-sm">
                    <option value="">— Unassigned —</option>
                    {techOptions.map(t => <option key={t.uid} value={t.uid}>{t.displayName || t.uid}</option>)}
                  </select>
                </Field>
              </div>
            ) : (
              <div className="text-sm grid grid-cols-2 gap-3">
                <Read label="Status" value={form.status} />
                <Read label="Tech" value={techOptions.find(t => t.uid === form.assignedTechId)?.displayName || 'Unassigned'} />
              </div>
            )}
          </Card>

          {booking.estimateLocked && (
            <Card className="p-5 gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Estimate</h2>
              <div className="text-sm grid grid-cols-3 gap-3">
                <Read label="Total" value={typeof booking.estimateTotal === 'number' ? formatCurrency(booking.estimateTotal) : '—'} />
                <Read label="Signed" value={(booking as { customerEstimateSignedAt?: unknown }).customerEstimateSignedAt ? 'Yes' : 'No'} />
                <Read label="Sent" value={booking.customerEstimateSentAt?.toDate().toISOString().slice(0, 10) || '—'} />
              </div>
            </Card>
          )}

          {invoice && (
            <Card className="p-5 gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Related invoice</h2>
              <div className="text-sm flex justify-between gap-3 items-center">
                <Link href={`/invoices/${invoice.id}`} className="font-semibold hover:underline">
                  {invoice.invoiceNumber || invoice.id.slice(0, 8)}
                </Link>
                <Badge variant="outline" className="capitalize">{invoice.status}</Badge>
                <span className="font-semibold">{formatCurrency(typeof invoice.qbTotalAmount === 'number' ? invoice.qbTotalAmount : invoice.total)}</span>
              </div>
            </Card>
          )}

          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Internal notes</h2>
            {editing ? (
              <textarea
                className="w-full text-sm border border-border rounded-md p-2 min-h-[100px] bg-background"
                value={form.adminNotes}
                onChange={e => setForm({ ...form, adminNotes: e.target.value })}
                placeholder="Notes Jason can see; not customer-facing."
              />
            ) : (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{form.adminNotes || 'No notes yet.'}</div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Activity</h2>
            {Array.isArray((booking as { commsLog?: unknown[] }).commsLog) && ((booking as { commsLog?: unknown[] }).commsLog?.length ?? 0) > 0 ? (
              <ul className="text-xs space-y-2">
                {((booking as { commsLog?: Array<{ id: string; type: string; summary: string; createdAt: string }> }).commsLog ?? []).slice(0, 8).map(log => (
                  <li key={log.id}>
                    <div className="text-muted-foreground">{log.createdAt}</div>
                    <div>{log.type}: {log.summary}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-muted-foreground">No activity recorded.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Read({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || '—'}</dd>
    </div>
  );
}
