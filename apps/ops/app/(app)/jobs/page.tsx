'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Plus } from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { Badge, Button, EditableCell, Input } from '@coastal/shared-ui';
import {
  formatBookingService,
  formatBookingVehicle,
  getBookingCustomerName,
} from '@coastal/shared-types';
import { db } from '@/lib/firebase';
import { formatPhone } from '@/lib/format';
import type { BookingDoc } from '@/lib/queries/bookings';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'dead', label: 'Dead' },
  { value: 'new-lead', label: 'New lead' },
];

type Filter = 'active' | 'completed' | 'cancelled' | 'all';
const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'in-progress', 'new-lead']);
const COMPLETED_STATUSES = new Set(['completed', 'invoiced']);
const CANCELLED_STATUSES = new Set(['cancelled', 'dead']);

function statusVariant(s: string | undefined): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!s) return 'outline';
  if (COMPLETED_STATUSES.has(s)) return 'default';
  if (s === 'confirmed' || s === 'in-progress') return 'secondary';
  if (CANCELLED_STATUSES.has(s)) return 'destructive';
  return 'outline';
}

export default function JobsPage() {
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('active');

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      snap => {
        setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as BookingDoc)).filter(b => b.isTest !== true));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  const filtered = useMemo(() => {
    let rows = bookings;
    if (filter === 'active') rows = rows.filter(b => typeof b.status === 'string' && ACTIVE_STATUSES.has(b.status));
    else if (filter === 'completed') rows = rows.filter(b => typeof b.status === 'string' && COMPLETED_STATUSES.has(b.status));
    else if (filter === 'cancelled') rows = rows.filter(b => typeof b.status === 'string' && CANCELLED_STATUSES.has(b.status));

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(b => {
        const hay = [
          b.name, b.customerName, b.email, b.customerEmail, b.phone, b.customerPhone,
          b.confirmedDate, b.preferredDate, b.status, b.timeWindow, formatBookingService(b),
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    return [...rows].sort((a, b) => (a.confirmedDate || '').localeCompare(b.confirmedDate || ''));
  }, [bookings, filter, search]);

  async function patch(id: string, p: Record<string, unknown>) {
    await updateDoc(doc(db, 'bookings', id), { ...p, updatedAt: serverTimestamp() });
    toast.success('Saved');
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <header className="mb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} job{filtered.length !== 1 ? 's' : ''} · click date, time, or status to edit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-[260px]"
          />
          <Button disabled title="New booking modal lands in STEP 13">
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
            New booking
          </Button>
        </div>
      </header>

      <div className="mb-4 flex items-center gap-2 text-xs">
        {(['active', 'completed', 'cancelled', 'all'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full border text-xs capitalize ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Customer</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Vehicle</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Service</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Date</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Time</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Loading…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <div className="flex flex-col items-center text-center">
                      <CalendarCheck className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
                      <h3 className="mt-3 text-base font-semibold">No jobs in this view</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Adjust filters above or create a new booking.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(b => (
                  <tr key={b.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 align-middle">
                      <div className="font-semibold">{getBookingCustomerName(b) || '(no name)'}</div>
                      <div className="text-xs text-muted-foreground">{formatPhone(b.phone || b.customerPhone) || b.email || b.customerEmail || ''}</div>
                    </td>
                    <td className="px-4 py-2 align-middle text-muted-foreground truncate max-w-[200px]">
                      {formatBookingVehicle(b) || '—'}
                    </td>
                    <td className="px-4 py-2 align-middle text-muted-foreground truncate max-w-[260px]">
                      {formatBookingService(b)}
                    </td>
                    <td className="px-4 py-2 align-middle w-[160px]">
                      <EditableCell
                        type="date"
                        value={b.confirmedDate || b.preferredDate || ''}
                        onSave={next => patch(b.id, { confirmedDate: next })}
                        placeholder="set date"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle w-[160px]">
                      <EditableCell
                        type="text"
                        value={b.timeWindow || ''}
                        onSave={next => patch(b.id, { timeWindow: next })}
                        placeholder="set window"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle w-[160px]">
                      <EditableCell
                        type="select"
                        value={b.status || 'pending'}
                        options={STATUS_OPTIONS}
                        onSave={next => patch(b.id, { status: next })}
                        display={
                          <Badge variant={statusVariant(b.status)} className="font-normal">
                            {b.status || 'pending'}
                          </Badge>
                        }
                      />
                    </td>
                    <td className="px-4 py-2 align-middle w-[90px] text-right">
                      <Link href={`/jobs/${b.id}`} className="text-xs font-semibold text-primary hover:underline">
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
