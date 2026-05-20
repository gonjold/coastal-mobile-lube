'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Plus, Users as UsersIcon } from 'lucide-react';
import { Button, EditableCell, Input } from '@coastal/shared-ui';
import { db } from '@/lib/firebase';
import { buildMergedCustomerList, type CustomerRow } from '@/lib/queries/customers';
import { formatPhone } from '@/lib/format';

export default function CustomersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    buildMergedCustomerList()
      .then(result => { if (!cancelled) setRows(result); })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load customers');
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      [r.name, r.email, r.phone, formatPhone(r.phone)].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [rows, search]);

  async function patchCustomer(row: CustomerRow, patch: Partial<{ name: string; phone: string; email: string }>) {
    let id = row.customerId;
    if (!id) {
      // Promote derived customer to customers/{id} doc on first edit.
      const created = await addDoc(collection(db, 'customers'), {
        name: row.name,
        phone: row.phone,
        phoneNormalized: row.phone.replace(/\D/g, ''),
        email: row.email,
        address: row.address,
        source: 'admin-derived-on-edit',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...patch,
      });
      id = created.id;
    } else {
      await updateDoc(doc(db, 'customers', id), {
        ...patch,
        ...(patch.phone ? { phoneNormalized: patch.phone.replace(/\D/g, '') } : {}),
        updatedAt: serverTimestamp(),
      });
    }
    setRefreshKey(k => k + 1);
    toast.success('Saved');
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {rows ? `${filtered.length} customer${filtered.length !== 1 ? 's' : ''}` : 'Loading…'}
            {rows && ' · click a name, phone, or email cell to edit'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-[260px]"
          />
          <Button disabled title="New customer modal lands in STEP 13">
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
            New customer
          </Button>
        </div>
      </header>

      {error && <div className="text-sm text-red-700 py-4">{error}</div>}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Jobs</th>
              </tr>
            </thead>
            <tbody>
              {!rows ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">Loading…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <UsersIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <div className="text-sm text-muted-foreground">No customers yet. Add your first customer to get started.</div>
                  </td>
                </tr>
              ) : (
                filtered.map(row => {
                  const customerId = row.customerId ?? row.key;
                  const stop = (e: React.MouseEvent) => e.stopPropagation();
                  return (
                    <tr
                      key={customerId}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open customer ${row.name || customerId}`}
                      onClick={() => router.push(`/customers/${customerId}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/customers/${customerId}`);
                        }
                      }}
                      className="border-t border-border align-middle cursor-pointer hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset transition-colors"
                    >
                      <td className="px-4 py-3" onClick={stop}>
                        <EditableCell
                          value={row.name}
                          onSave={next => patchCustomer(row, { name: next })}
                        />
                      </td>
                      <td className="px-4 py-3" onClick={stop}>
                        <EditableCell
                          type="tel"
                          value={row.phone}
                          display={row.phone ? formatPhone(row.phone) : undefined}
                          onSave={next => patchCustomer(row, { phone: next })}
                        />
                      </td>
                      <td className="px-4 py-3" onClick={stop}>
                        <EditableCell
                          type="email"
                          value={row.email}
                          onSave={next => patchCustomer(row, { email: next })}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{row.totalBookings}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
