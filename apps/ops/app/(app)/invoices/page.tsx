'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
      <header className="mb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filter === 'pending-billing'
              ? `${rowCount} completed job${rowCount !== 1 ? 's' : ''} awaiting invoice draft`
              : `${rowCount} invoice${rowCount !== 1 ? 's' : ''} · click due-date cell to edit`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-[260px]"
          />
          <Button disabled title="New invoice form lands in STEP 13">
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
            New invoice
          </Button>
        </div>
      </header>

      <div className="mb-4 flex items-center gap-2 text-xs">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full border text-xs capitalize ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {filterLabel(f)}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          {filter === 'pending-billing' ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Phone</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Completed</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPending.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12">
                      <div className="flex flex-col items-center text-center">
                        <Receipt className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
                        <h3 className="mt-3 text-base font-semibold">No completed jobs awaiting an invoice</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Mark Complete on tech jobs creates the invoice draft automatically.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPending.map(b => {
                    const name = b.customerName || (b as { name?: string }).name || 'Customer';
                    const phone = b.customerPhone || b.phone || '';
                    const completedAt = (b as { jobCompletedAt?: { toDate: () => Date } }).jobCompletedAt?.toDate?.();
                    const completedLabel = completedAt ? completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                    return (
                      <tr key={b.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2 align-middle font-semibold">{name}</td>
                        <td className="px-4 py-2 align-middle">{formatPhone(phone, '—')}</td>
                        <td className="px-4 py-2 align-middle">{completedLabel}</td>
                        <td className="px-4 py-2 align-middle text-right">
                          <Link href={`/jobs/${b.id}`} className="text-xs font-semibold text-primary hover:underline">
                            Open job →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Invoice</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Total</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Due</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">QB</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12">
                      <div className="flex flex-col items-center text-center">
                        <Receipt className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
                        <h3 className="mt-3 text-base font-semibold">No invoices in this view</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Adjust filters above or create a new invoice.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(inv => {
                    const total = typeof inv.qbTotalAmount === 'number' ? inv.qbTotalAmount : inv.total;
                    return (
                      <tr key={inv.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2 align-middle font-semibold">{inv.invoiceNumber || inv.id.slice(0, 8)}</td>
                        <td className="px-4 py-2 align-middle">{inv.customerName}</td>
                        <td className="px-4 py-2 align-middle text-right">{formatCurrency(total)}</td>
                        <td className="px-4 py-2 align-middle w-[160px]">
                          <EditableCell
                            type="date"
                            value={inv.dueDate || ''}
                            onSave={next => patch(inv.id, { dueDate: next })}
                            placeholder="set due"
                          />
                        </td>
                        <td className="px-4 py-2 align-middle w-[120px]">
                          <Badge variant={statusBadgeVariant(inv.status)} className="font-normal capitalize">{inv.status}</Badge>
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-muted-foreground">
                          {inv.qboFinalizeStatus === 'error' ? <span className="text-red-700">error</span> : inv.qbDocNumber ?? '—'}
                        </td>
                        <td className="px-4 py-2 align-middle text-right">
                          <Link href={`/invoices/${inv.id}`} className="text-xs font-semibold text-primary hover:underline">
                            Open →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
