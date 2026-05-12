'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X, Edit3 } from 'lucide-react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Button, Card, Input } from '@coastal/shared-ui';
import { formatBookingService } from '@coastal/shared-types';
import { db } from '@/lib/firebase';
import { fetchCustomerDetail } from '@/lib/queries/customers';
import { VehiclesEditor } from '@/components/customers/VehiclesEditor';

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

function formatPhone(p: string): string {
  const d = (p || '').replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchCustomerDetail>>>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchCustomerDetail(id)
      .then(result => {
        if (cancelled) return;
        setData(result);
        if (result?.customer) {
          setForm({
            name: result.customer.name ?? '',
            phone: result.customer.phone ?? '',
            email: result.customer.email ?? '',
            address: result.customer.address ?? '',
            notes: (result.customer as { notes?: string }).notes ?? '',
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load customer');
      });
    return () => { cancelled = true; };
  }, [id, refreshKey]);

  if (error) return <div className="px-6 py-8 text-red-700">{error}</div>;
  if (!data) return <div className="px-6 py-8 text-muted-foreground">Loading…</div>;

  const { customer, bookings, totalSpent } = data;

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      if (customer?.id) {
        await updateDoc(doc(db, 'customers', customer.id), {
          name: form.name,
          phone: form.phone,
          phoneNormalized: form.phone.replace(/\D/g, ''),
          email: form.email,
          address: form.address,
          notes: form.notes,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'customers'), {
          name: form.name,
          phone: form.phone,
          phoneNormalized: form.phone.replace(/\D/g, ''),
          email: form.email,
          address: form.address,
          notes: form.notes,
          source: 'admin-derived-on-edit',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
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
    if (data?.customer) {
      setForm({
        name: data.customer.name ?? '',
        phone: data.customer.phone ?? '',
        email: data.customer.email ?? '',
        address: data.customer.address ?? '',
        notes: (data.customer as { notes?: string }).notes ?? '',
      });
    }
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1100px] mx-auto">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/customers"
            className="text-muted-foreground hover:text-foreground inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            {form?.name || customer?.name || '(no name)'}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit3 className="h-4 w-4 mr-1" /> Edit
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact</h2>
            {editing && form ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Address"><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Field>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Read label="Phone" value={formatPhone(form?.phone ?? '')} />
                <Read label="Email" value={form?.email} />
                <Read label="Address" value={form?.address} className="col-span-2" />
              </dl>
            )}
          </Card>

          <VehiclesEditor customerId={id} />

          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent bookings ({bookings.length})
            </h2>
            {bookings.length === 0 ? (
              <div className="text-sm text-muted-foreground">No bookings yet.</div>
            ) : (
              <ul className="text-sm divide-y divide-border">
                {bookings.slice(0, 10).map(b => (
                  <li key={b.id} className="py-2 flex items-center justify-between gap-3">
                    <Link href={`/jobs/${b.id}`} className="hover:underline truncate">
                      {formatBookingService(b)}
                    </Link>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {b.createdAt?.toDate().toISOString().slice(0, 10) ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lifetime</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-2">
              <Read label="Bookings" value={String(bookings.length)} />
              <Read label="Total spent" value={formatCurrency(totalSpent)} />
              <Read
                label="Customer since"
                value={
                  bookings.length > 0
                    ? bookings[bookings.length - 1].createdAt?.toDate().toISOString().slice(0, 10) ?? '—'
                    : '—'
                }
                className="col-span-2"
              />
            </dl>
          </Card>

          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Internal notes</h2>
            {editing && form ? (
              <textarea
                className="w-full text-sm border border-border rounded-md p-2 min-h-[100px] bg-background"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes about this customer…"
              />
            ) : (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {form?.notes || 'No notes yet.'}
              </div>
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

function Read({ label, value, className }: { label: string; value?: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || '—'}</dd>
    </div>
  );
}
