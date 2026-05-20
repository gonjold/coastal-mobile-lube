'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Badge, Button, EditableCell, Input, statusBadgeVariant } from '@coastal/shared-ui';
import {
  formatBookingService,
  formatBookingVehicle,
  getBookingCustomerName,
} from '@coastal/shared-types';
import { db } from '@/lib/firebase';
import { formatPhone } from '@/lib/format';
import type { BookingDoc } from '@/lib/queries/bookings';
import { JobCard } from '@/components/cards/JobCard';
import { Segmented } from '@/components/ui/Segmented';

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

// A3e: status badges use the canonical statusBadgeVariant from shared-ui.
// Maps booking statuses (in-progress, confirmed, completed, cancelled, pending,
// dead, new-lead) to the matching color-coded chip variant.

export default function JobsPage() {
  const router = useRouter();
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

  const filterCounts: Record<Filter, number> = useMemo(() => {
    const counts = { active: 0, completed: 0, cancelled: 0, all: bookings.length };
    for (const b of bookings) {
      const s = typeof b.status === 'string' ? b.status : '';
      if (ACTIVE_STATUSES.has(s)) counts.active += 1;
      else if (COMPLETED_STATUSES.has(s)) counts.completed += 1;
      else if (CANCELLED_STATUSES.has(s)) counts.cancelled += 1;
    }
    return counts;
  }, [bookings]);

  async function patch(id: string, p: Record<string, unknown>) {
    await updateDoc(doc(db, 'bookings', id), { ...p, updatedAt: serverTimestamp() });
    toast.success('Saved');
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px]">
      {/* A3f Phase 6A polish: header stacks below lg so search + new
          don't crash at 375px. New booking button hides below lg (TopBar
          'New' covers md..lg; FAB covers <md). Search goes full-width
          below lg. */}
      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <h1 className="text-[20px] lg:text-2xl font-semibold tracking-tight text-[#0B2040]">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} job{filtered.length !== 1 ? 's' : ''} · click date, time, or status to edit
          </p>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 flex-1 lg:flex-none lg:w-[260px]"
          />
          <Button disabled title="New booking modal lands in STEP 13" className="hidden lg:inline-flex">
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
            New booking
          </Button>
        </div>
      </header>

      {/* A3f Polish Round 3 Unit 3: migrated to the unified Segmented
          primitive so Jobs and Today share one look. Counts inline,
          flex 1 0 auto so labels never truncate. */}
      <div className="mb-4">
        <Segmented<Filter>
          ariaLabel="Jobs status filter"
          items={[
            { key: 'active', label: 'Active', count: filterCounts.active },
            { key: 'completed', label: 'Completed', count: filterCounts.completed },
            { key: 'cancelled', label: 'Cancelled', count: filterCounts.cancelled },
            { key: 'all', label: 'All', count: filterCounts.all },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {/* A3f Phase 6A.2: card/table swap at lg. <lg renders cards; lg+ renders
          the table. Loading + empty states are shared above both branches so
          they only appear once regardless of viewport. */}
      {loading ? (
        <div className="rounded-lg border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-12">
          <div className="flex flex-col items-center text-center">
            <CalendarCheck className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
            <h3 className="mt-3 text-base font-semibold">No jobs in this view</h3>
            <p className="mt-1 text-sm text-muted-foreground">Adjust filters above or create a new booking.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-2.5">
            {filtered.map(b => <JobCard key={b.id} booking={b} />)}
          </div>
          <div className="hidden lg:block rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[16%]" />
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Vehicle</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Service</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                  const customerName = getBookingCustomerName(b) || '(no name)';
                  const stop = (e: React.MouseEvent) => e.stopPropagation();
                  return (
                    <tr
                      key={b.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open job for ${customerName}`}
                      onClick={() => router.push(`/jobs/${b.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/jobs/${b.id}`);
                        }
                      }}
                      className="border-t border-border cursor-pointer hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="font-semibold truncate">{customerName}</div>
                        <div className="text-xs text-muted-foreground truncate">{formatPhone(b.phone || b.customerPhone) || b.email || b.customerEmail || ''}</div>
                      </td>
                      <td className="px-4 py-3 align-middle text-muted-foreground truncate">
                        {formatBookingVehicle(b) || '—'}
                      </td>
                      <td className="px-4 py-3 align-middle text-muted-foreground truncate">
                        {formatBookingService(b)}
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap" onClick={stop}>
                        <EditableCell
                          type="date"
                          value={b.confirmedDate || b.preferredDate || ''}
                          onSave={next => patch(b.id, { confirmedDate: next })}
                          placeholder="set date"
                        />
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap" onClick={stop}>
                        <EditableCell
                          type="text"
                          value={b.timeWindow || ''}
                          onSave={next => patch(b.id, { timeWindow: next })}
                          placeholder="set window"
                        />
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap" onClick={stop}>
                        <EditableCell
                          type="select"
                          value={b.status || 'pending'}
                          options={STATUS_OPTIONS}
                          onSave={next => patch(b.id, { status: next })}
                          display={
                            <Badge variant={statusBadgeVariant(b.status)} className="font-normal capitalize">
                              {b.status || 'pending'}
                            </Badge>
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
