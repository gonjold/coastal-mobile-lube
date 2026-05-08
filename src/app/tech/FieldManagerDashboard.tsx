'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  type Booking,
  type AppUser,
  getServiceLabel,
} from '@/app/admin/shared';
import {
  fmtMoney,
  fmtRelativeTime,
  getLongDateLabel,
  getTodayESTISO,
  getWeekBoundsESTISO,
  bookingStartHour,
  formatBookingTimeLabel,
  dateToESTISO,
} from '@/lib/dashboard-helpers';

/* ─── Types ─────────────────────────────────────────────── */

interface Invoice {
  id: string;
  invoiceNumber?: string;
  customerName?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  source?: 'tech_completion' | 'manual' | null;
  total?: number;
  qbTotalAmount?: number;
  invoiceDate?: string;
  paidDate?: string;
  createdAt?: { toDate: () => Date };
  isTest?: boolean;
  deleted?: boolean;
}

/* ─── Component ─────────────────────────────────────────── */

export default function FieldManagerDashboard({
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [techs, setTechs] = useState<Record<string, AppUser>>({});
  const [bookingsErr, setBookingsErr] = useState<string | null>(null);
  const [invoicesErr, setInvoicesErr] = useState<string | null>(null);

  /* ── Bookings listener ─ */
  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
        setBookingsErr(null);
      },
      (err) => {
        console.error('FM bookings listener failed:', err);
        setBookingsErr(err.message || 'Failed to load bookings');
      },
    );
  }, []);

  /* ── Invoices listener ─ */
  useEffect(() => {
    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice));
        setInvoicesErr(null);
      },
      (err) => {
        console.error('FM invoices listener failed:', err);
        setInvoicesErr(err.message || 'Failed to load invoices');
      },
    );
  }, []);

  /* ── Tech roster (for grouping schedule by name) ─ */
  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      const map: Record<string, AppUser> = {};
      snap.forEach((d) => {
        map[d.id] = { uid: d.id, ...(d.data() as Omit<AppUser, 'uid'>) };
      });
      setTechs(map);
    });
  }, []);

  /* ── Filters & derived data ─ */
  const todayISO = getTodayESTISO();
  const { weekStartISO, weekEndISO } = getWeekBoundsESTISO();

  const liveBookings = useMemo(
    () => (bookings ?? []).filter((b) => !b.isTest && b.status !== 'dead'),
    [bookings],
  );
  const liveInvoices = useMemo(
    () => (invoices ?? []).filter((i) => !i.isTest && !i.deleted),
    [invoices],
  );

  const todayStats = useMemo(() => {
    const billedToday = liveInvoices.filter(
      (i) =>
        (i.status === 'sent' || i.status === 'paid' || i.status === 'overdue') &&
        i.invoiceDate === todayISO,
    );
    const revenue = billedToday.reduce(
      (sum, i) => sum + (i.qbTotalAmount ?? i.total ?? 0),
      0,
    );
    const inProgress = liveBookings.filter((b) => b.status === 'in-progress').length;
    const completed = liveBookings.filter((b) => {
      if (b.status !== 'completed') return false;
      const completedAt = b.jobCompletedAt?.toDate?.();
      if (completedAt) return dateToESTISO(completedAt) === todayISO;
      // Legacy bookings without jobCompletedAt — fall back to scheduled-day match
      return (b.confirmedDate || b.preferredDate) === todayISO;
    }).length;
    return { revenue, inProgress, completed };
  }, [liveBookings, liveInvoices, todayISO]);

  const weekStats = useMemo(() => {
    const billedThisWeek = liveInvoices.filter(
      (i) =>
        (i.status === 'sent' || i.status === 'paid' || i.status === 'overdue') &&
        i.invoiceDate &&
        i.invoiceDate >= weekStartISO &&
        i.invoiceDate <= weekEndISO,
    );
    const revenue = billedThisWeek.reduce(
      (sum, i) => sum + (i.qbTotalAmount ?? i.total ?? 0),
      0,
    );
    const jobsThisWeek = liveBookings.filter((b) => {
      const dateStr = b.confirmedDate || b.preferredDate;
      return !!dateStr && dateStr >= weekStartISO && dateStr <= weekEndISO;
    }).length;
    const paidThisWeek = liveInvoices.filter(
      (i) =>
        i.status === 'paid' &&
        i.paidDate &&
        i.paidDate >= weekStartISO &&
        i.paidDate <= weekEndISO,
    ).length;
    const draftCount = liveInvoices.filter((i) => i.status === 'draft').length;
    return { revenue, jobsThisWeek, paidThisWeek, draftCount };
  }, [liveBookings, liveInvoices, weekStartISO, weekEndISO]);

  const todaysBookings = useMemo(() => {
    return liveBookings
      .filter((b) => {
        const dateStr = b.confirmedDate || b.preferredDate;
        if (dateStr !== todayISO) return false;
        // Don't show cancelled / pending leads in the schedule view
        return (
          b.status === 'confirmed' ||
          b.status === 'in-progress' ||
          b.status === 'completed'
        );
      })
      .sort((a, b) => bookingStartHour(a) - bookingStartHour(b));
  }, [liveBookings, todayISO]);

  const groupedSchedule = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    const order: string[] = [];
    for (const b of todaysBookings) {
      const key = b.assignedTechId || '__unassigned__';
      if (!(key in groups)) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(b);
    }
    // Move unassigned to top if present
    order.sort((a, b) => {
      if (a === '__unassigned__') return -1;
      if (b === '__unassigned__') return 1;
      return 0;
    });
    return order.map((k) => ({
      key: k,
      label:
        k === '__unassigned__'
          ? 'Unassigned'
          : techs[k]?.displayName || 'Tech',
      bookings: groups[k],
    }));
  }, [todaysBookings, techs]);

  const pendingDrafts = useMemo(() => {
    return liveInvoices
      .filter((i) => i.status === 'draft' && i.source === 'tech_completion')
      .sort((a, b) => {
        const at = a.createdAt?.toDate?.()?.getTime() ?? 0;
        const bt = b.createdAt?.toDate?.()?.getTime() ?? 0;
        return bt - at;
      });
  }, [liveInvoices]);

  const unassignedCount = useMemo(() => {
    return liveBookings.filter(
      (b) =>
        !b.assignedTechId &&
        (b.status === 'pending' ||
          b.status === 'confirmed' ||
          b.status === 'in-progress'),
    ).length;
  }, [liveBookings]);

  const bookingsLoading = bookings === null;
  const invoicesLoading = invoices === null;

  return (
    <div className="space-y-4 -mx-4 px-4 py-2 sm:mx-0 sm:px-0">
      <DashboardHeader name={userName} />

      <TodayCard
        loading={invoicesLoading || bookingsLoading}
        error={bookingsErr || invoicesErr}
        revenue={todayStats.revenue}
        inProgress={todayStats.inProgress}
        completed={todayStats.completed}
      />

      <ThisWeekCard
        loading={invoicesLoading || bookingsLoading}
        error={bookingsErr || invoicesErr}
        revenue={weekStats.revenue}
        jobs={weekStats.jobsThisWeek}
        paid={weekStats.paidThisWeek}
        drafts={weekStats.draftCount}
      />

      <TodayScheduleSection
        loading={bookingsLoading}
        error={bookingsErr}
        groups={groupedSchedule}
      />

      <PendingReviewSection
        loading={invoicesLoading}
        error={invoicesErr}
        invoices={pendingDrafts}
      />

      {unassignedCount > 0 && (
        <UnassignedTriageLink count={unassignedCount} />
      )}

      <DashboardFooter />
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────── */

function DashboardHeader({ name }: { name: string }) {
  const greet = greetingFor(new Date());
  const firstName = (name || '').trim().split(/\s+/)[0] || 'there';
  return (
    <div className="px-1 pt-1">
      <div className="text-base font-semibold text-[#0B2040]">
        {greet}, {firstName}.
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{getLongDateLabel()}</div>
    </div>
  );
}

function greetingFor(d: Date): string {
  const hourFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    hour12: false,
  });
  const h = parseInt(hourFmt.format(d), 10);
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white shadow-sm p-4">
      <h2 className="text-[11px] uppercase tracking-[0.06em] font-bold text-[#0B2040] mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[28px] leading-none font-extrabold text-[#0B2040] truncate">
        {value}
      </div>
      <div className="mt-1 text-[12px] text-slate-500">{label}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

function TodayCard({
  loading,
  error,
  revenue,
  inProgress,
  completed,
}: {
  loading: boolean;
  error: string | null;
  revenue: number;
  inProgress: number;
  completed: number;
}) {
  if (error) return <ErrorCard title="Today" />;
  return (
    <Card title="Today">
      {loading ? (
        <SkeletonRow />
      ) : (
        <div className="flex items-start gap-4">
          <StatBlock
            label="Billed"
            value={revenue > 0 ? fmtMoney(revenue) : '$0'}
            hint={revenue === 0 ? 'No revenue yet' : undefined}
          />
          <Divider />
          <StatBlock label="In progress" value={inProgress} />
          <Divider />
          <StatBlock label="Completed" value={completed} />
        </div>
      )}
    </Card>
  );
}

function ThisWeekCard({
  loading,
  error,
  revenue,
  jobs,
  paid,
  drafts,
}: {
  loading: boolean;
  error: string | null;
  revenue: number;
  jobs: number;
  paid: number;
  drafts: number;
}) {
  if (error) return <ErrorCard title="This Week" />;
  return (
    <Card title="This Week">
      {loading ? (
        <SkeletonRow />
      ) : (
        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
          <StatBlock label="Billed" value={fmtMoney(revenue)} />
          <StatBlock label="Jobs" value={jobs} />
          <StatBlock label="Paid invoices" value={paid} />
          <StatBlock label="Drafts" value={drafts} />
        </div>
      )}
    </Card>
  );
}

function TodayScheduleSection({
  loading,
  error,
  groups,
}: {
  loading: boolean;
  error: string | null;
  groups: { key: string; label: string; bookings: Booking[] }[];
}) {
  if (error) return <ErrorCard title="Today's Schedule" />;
  return (
    <Card title="Today's Schedule">
      {loading ? (
        <SkeletonList rows={3} />
      ) : groups.length === 0 ? (
        <div className="text-sm text-slate-500 py-2">
          No bookings scheduled for today.
        </div>
      ) : (
        <div className="space-y-4 -mx-2">
          {groups.map((g) => (
            <div key={g.key}>
              <div
                className={`px-2 mb-1 text-[11px] font-semibold uppercase tracking-wide ${
                  g.key === '__unassigned__' ? 'text-[#E07B2D]' : 'text-slate-500'
                }`}
              >
                {g.label}
              </div>
              <div className="space-y-1">
                {g.bookings.map((b) => (
                  <BookingRow key={b.id} b={b} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function BookingRow({ b }: { b: Booking }) {
  const time = formatBookingTimeLabel(b);
  const customer = b.name || b.customerName || 'Customer';
  const service = getServiceLabel(b) || 'Service';
  return (
    <Link
      href={`/tech/jobs/${b.id}`}
      className="flex items-center gap-3 min-h-[56px] px-2 py-2 rounded-lg active:bg-slate-100 hover:bg-slate-50"
    >
      <div className="w-[64px] flex-shrink-0 text-[13px] font-semibold text-slate-700">
        {time}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#0B2040] truncate">
          {customer}
        </div>
        <div className="text-xs text-slate-500 truncate">{service}</div>
      </div>
      <StatusPill status={b.status} kind="booking" />
    </Link>
  );
}

function PendingReviewSection({
  loading,
  error,
  invoices,
}: {
  loading: boolean;
  error: string | null;
  invoices: Invoice[];
}) {
  if (error) return <ErrorCard title="Pending Review" />;
  return (
    <Card title="Pending Review">
      {loading ? (
        <SkeletonList rows={2} />
      ) : invoices.length === 0 ? (
        <div className="text-sm text-slate-500 py-2">
          No drafts awaiting review — great job!
        </div>
      ) : (
        <div className="space-y-1 -mx-2">
          {invoices.map((inv) => (
            <InvoiceRow key={inv.id} inv={inv} />
          ))}
        </div>
      )}
    </Card>
  );
}

function InvoiceRow({ inv }: { inv: Invoice }) {
  const total = inv.qbTotalAmount ?? inv.total ?? 0;
  return (
    <Link
      href={`/admin/invoicing?openId=${inv.id}`}
      className="flex items-center gap-3 min-h-[56px] px-2 py-2 rounded-lg active:bg-slate-100 hover:bg-slate-50"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#0B2040] truncate">
          {inv.customerName || 'Customer'}
        </div>
        <div className="text-xs text-slate-500 truncate">
          {inv.invoiceNumber || 'Draft'} · {fmtRelativeTime(inv.createdAt?.toDate?.())}
        </div>
      </div>
      <div className="text-sm font-bold text-[#0B2040] tabular-nums">
        {fmtMoney(total)}
      </div>
      <StatusPill status={inv.status} kind="invoice" />
    </Link>
  );
}

function UnassignedTriageLink({ count }: { count: number }) {
  return (
    <Link
      href="/tech/unassigned"
      className="flex items-center justify-between min-h-[56px] rounded-xl bg-[#E07B2D] text-white px-4 py-3 active:opacity-90"
    >
      <div>
        <div className="text-sm font-semibold">
          {count} unassigned booking{count === 1 ? '' : 's'}
        </div>
        <div className="text-[11px] opacity-90">Tap to triage</div>
      </div>
      <div className="text-lg font-bold">→</div>
    </Link>
  );
}

function DashboardFooter() {
  return (
    <div className="text-center text-[11px] text-slate-400 pt-4 pb-6">
      Field Manager v1.0
    </div>
  );
}

/* ─── Status pill ───────────────────────────────────────── */

function StatusPill({
  status,
  kind,
}: {
  status?: string;
  kind: 'booking' | 'invoice';
}) {
  const cls = pillClass(status, kind);
  const label = pillLabel(status);
  return (
    <span
      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

function pillClass(status: string | undefined, kind: 'booking' | 'invoice'): string {
  if (kind === 'invoice') {
    switch (status) {
      case 'draft':
        return 'bg-[#FFE7D2] text-[#9A4A0F]';
      case 'sent':
        return 'bg-[#DBEAFE] text-[#1E3A8A]';
      case 'paid':
        return 'bg-[#DCFCE7] text-[#166534]';
      case 'overdue':
        return 'bg-[#FEE2E2] text-[#991B1B]';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }
  switch (status) {
    case 'confirmed':
    case 'pending':
      return 'bg-[#DBEAFE] text-[#1E3A8A]';
    case 'in-progress':
      return 'bg-[#E07B2D] text-white';
    case 'completed':
      return 'bg-[#DCFCE7] text-[#166534]';
    case 'cancelled':
      return 'bg-slate-200 text-slate-600';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function pillLabel(status: string | undefined): string {
  if (!status) return '—';
  return status.replace('-', ' ').replace('_', ' ');
}

/* ─── Skeletons & error ─────────────────────────────────── */

function Divider() {
  return <div className="w-px self-stretch bg-slate-100" />;
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 animate-pulse">
      <div className="flex-1">
        <div className="h-7 w-20 bg-slate-100 rounded mb-2" />
        <div className="h-3 w-12 bg-slate-100 rounded" />
      </div>
      <div className="flex-1">
        <div className="h-7 w-12 bg-slate-100 rounded mb-2" />
        <div className="h-3 w-10 bg-slate-100 rounded" />
      </div>
      <div className="flex-1">
        <div className="h-7 w-12 bg-slate-100 rounded mb-2" />
        <div className="h-3 w-14 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

function SkeletonList({ rows }: { rows: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 bg-slate-100 rounded"
          style={{ opacity: 1 - i * 0.2 }}
        />
      ))}
    </div>
  );
}

function ErrorCard({ title }: { title: string }) {
  return (
    <Card title={title}>
      <div className="text-sm text-red-700 py-2">
        Couldn&apos;t load. Pull to refresh or check connection.
      </div>
    </Card>
  );
}
