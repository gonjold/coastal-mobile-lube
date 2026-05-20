'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Plus } from 'lucide-react';
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
import { db } from '@/lib/firebase';
import { formatPhone } from '@/lib/format';
import { fetchPendingBilling } from '@/lib/queries/bookings';
import type { BookingDoc } from '@/lib/queries/bookings';
import type { Invoice } from '@coastal/shared-types';
import { InvoiceCard } from '@/components/cards/InvoiceCard';
import { JobCard } from '@/components/cards/JobCard';

type Filter = 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'pending-billing';

const FILTERS: Filter[] = ['all', 'draft', 'sent', 'paid', 'overdue', 'pending-billing'];

function filterLabel(f: Filter): string {
  if (f === 'pending-billing') return 'Pending billing';
  return f;
}

// A3e: statusBadgeVariant imported from @coastal/shared-ui (canonical mapping).

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<(Invoice & { id: string })[]>([]);
  const [pendingBilling, setPendingBilling] = useState<BookingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      snap => {
        setInvoices(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Invoice & { id: string }))
            .filter(i => !i.deleted && !i.isTest),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  // A3d STEP 5: Pending Billing tab loads on first selection and refreshes
  // each time the user reselects the tab. Uses one-shot getDocs rather than
  // onSnapshot - the list is admin-facing, not high-frequency.
  useEffect(() => {
    if (filter !== 'pending-billing') return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchPendingBilling();
        if (!cancelled) setPendingBilling(rows);
      } catch {
        if (!cancelled) setPendingBilling([]);
      }
    })();
    return () => { cancelled = true; };
  }, [filter]);

  const filtered = useMemo(() => {
    if (filter === 'pending-billing') return [];
    let rows = invoices;
    if (filter !== 'all') rows = rows.filter(i => i.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(i => [i.invoiceNumber, i.customerName, i.status].filter(Boolean).join(' ').toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => (b.dueDate ?? '').localeCompare(a.dueDate ?? ''));
  }, [invoices, filter, search]);

  const filteredPending = useMemo(() => {
    if (filter !== 'pending-billing') return [];
    const q = search.trim().toLowerCase();
    let rows = pendingBilling;
    if (q) {
      rows = rows.filter(b => [
        b.customerName,
        (b as { name?: string }).name,
        b.customerPhone,
      ].filter(Boolean).join(' ').toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      const at = (a as { jobCompletedAt?: { toDate: () => Date } }).jobCompletedAt?.toDate?.().getTime() ?? 0;
      const bt = (b as { jobCompletedAt?: { toDate: () => Date } }).jobCompletedAt?.toDate?.().getTime() ?? 0;
      return bt - at;
    });
  }, [pendingBilling, filter, search]);

  const rowCount = filter === 'pending-billing' ? filteredPending.length : filtered.length;

  async function patch(id: string, p: Record<string, unknown>) {
    await updateDoc(doc(db, 'invoices', id), { ...p, updatedAt: serverTimestamp() });
    toast.success('Saved');
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      {/* A3f Phase 6A polish: header stacks below lg so search + new
          don't crash at 375px. New invoice button hides below lg (TopBar
          'New' covers md..lg; FAB covers <md). Search goes full-width
          below lg. */}
      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filter === 'pending-billing'
              ? `${rowCount} completed job${rowCount !== 1 ? 's' : ''} awaiting invoice draft`
              : `${rowCount} invoice${rowCount !== 1 ? 's' : ''} · click due-date cell to edit`}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 flex-1 lg:flex-none lg:w-[260px]"
          />
          <Button disabled title="New invoice form lands in STEP 13" className="hidden lg:inline-flex">
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
            New invoice
          </Button>
        </div>
      </header>

      {/* A3f Phase 6A.7: 6-segment segmented control <lg (2x3 grid, no
          horizontal scroll), pill row lg+. */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-1 rounded-lg border border-border bg-card p-1 text-xs lg:flex lg:items-center lg:gap-2 lg:border-0 lg:bg-transparent lg:p-0">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-9 rounded-md capitalize text-xs font-medium truncate transition-colors lg:h-auto lg:px-3 lg:py-1 lg:rounded-full lg:border ${
              filter === f
                ? 'bg-primary text-primary-foreground lg:border-primary'
                : 'text-muted-foreground hover:bg-muted lg:bg-card lg:border-border'
            }`}
          >
            {filterLabel(f)}
          </button>
        ))}
      </div>

      {/* A3f Phase 6A.3: card/table swap at lg. Pending Billing rows
          navigate to /jobs/[bookingId] so they re-use JobCard; invoice
          rows use InvoiceCard. Loading/empty states hoisted above the
          swap so they render once per filter. */}
      {filter === 'pending-billing' ? (
        filteredPending.length === 0 ? (
          <div className="rounded-lg border border-border bg-card py-12">
            <div className="flex flex-col items-center text-center">
              <Receipt className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
              <h3 className="mt-3 text-base font-semibold">No completed jobs awaiting an invoice</h3>
              <p className="mt-1 text-sm text-muted-foreground">Mark Complete on tech jobs creates the invoice draft automatically.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="lg:hidden space-y-2.5">
              {filteredPending.map(b => <JobCard key={b.id} booking={b} />)}
            </div>
            <div className="hidden lg:block rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] table-fixed">
                  <colgroup>
                    <col className="w-[42%]" />
                    <col className="w-[23%]" />
                    <col className="w-[35%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Customer</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPending.map(b => {
                      const name = b.customerName || (b as { name?: string }).name || 'Customer';
                      const phone = b.customerPhone || b.phone || '';
                      const completedAt = (b as { jobCompletedAt?: { toDate: () => Date } }).jobCompletedAt?.toDate?.();
                      const completedLabel = completedAt ? completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                      return (
                        <tr
                          key={b.id}
                          role="link"
                          tabIndex={0}
                          aria-label={`Open job for ${name}`}
                          onClick={() => router.push(`/jobs/${b.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              router.push(`/jobs/${b.id}`);
                            }
                          }}
                          className="border-t border-border cursor-pointer hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset transition-colors"
                        >
                          <td className="px-4 py-3 align-middle font-semibold truncate">{name}</td>
                          <td className="px-4 py-3 align-middle whitespace-nowrap">{formatPhone(phone, '—')}</td>
                          <td className="px-4 py-3 align-middle whitespace-nowrap">{completedLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      ) : loading ? (
        <div className="rounded-lg border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-12">
          <div className="flex flex-col items-center text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
            <h3 className="mt-3 text-base font-semibold">No invoices in this view</h3>
            <p className="mt-1 text-sm text-muted-foreground">Adjust filters above or create a new invoice.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-2.5">
            {filtered.map(inv => <InvoiceCard key={inv.id} invoice={inv} />)}
          </div>
          <div className="hidden lg:block rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] table-fixed">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[26%]" />
                  <col className="w-[12%]" />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Invoice</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Customer</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Total</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Due</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">QB</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => {
                    const total = typeof inv.qbTotalAmount === 'number' ? inv.qbTotalAmount : inv.total;
                    const invoiceLabel = inv.invoiceNumber || inv.id.slice(0, 8);
                    const stop = (e: React.MouseEvent) => e.stopPropagation();
                    return (
                      <tr
                        key={inv.id}
                        role="link"
                        tabIndex={0}
                        aria-label={`Open invoice ${invoiceLabel}`}
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/invoices/${inv.id}`);
                          }
                        }}
                        className="border-t border-border cursor-pointer hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset transition-colors"
                      >
                        <td className="px-4 py-3 align-middle font-semibold tabular-nums truncate">{invoiceLabel}</td>
                        <td className="px-4 py-3 align-middle truncate">{inv.customerName}</td>
                        <td className="px-4 py-3 align-middle text-right tabular-nums whitespace-nowrap">{formatCurrency(total)}</td>
                        <td className="px-4 py-3 align-middle whitespace-nowrap" onClick={stop}>
                          <EditableCell
                            type="date"
                            value={inv.dueDate || ''}
                            onSave={next => patch(inv.id, { dueDate: next })}
                            placeholder="set due"
                          />
                        </td>
                        <td className="px-4 py-3 align-middle whitespace-nowrap">
                          <Badge variant={statusBadgeVariant(inv.status)} className="font-normal capitalize">{inv.status}</Badge>
                        </td>
                        <td className="px-4 py-3 align-middle text-xs text-muted-foreground truncate">
                          {inv.qboFinalizeStatus === 'error' ? <span className="text-red-700">error</span> : inv.qbDocNumber ?? '—'}
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
