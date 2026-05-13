'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@coastal/shared-ui';
import { db } from '@/lib/firebase';
import { useAdminModal } from '@/lib/AdminModalContext';
import {
  buildCustomerList,
  formatPhone,
  type Booking,
  type Customer,
} from '@/lib/customerTypes';
import { findDuplicates, type DuplicateGroup } from '@/lib/customerDedup';

/* ── Local invoice shape for merge identification (subset of /invoices docs) ── */
interface MergeInvoice {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

function getVehicles(bookings: Booking[]): string[] {
  const set = new Set<string>();
  bookings.forEach((b) => {
    const v =
      [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(' ') ||
      [b.vesselYear, b.vesselMake, b.vesselModel].filter(Boolean).join(' ');
    if (v) set.add(v);
  });
  return Array.from(set);
}

/* ── Wrapper: AdminModalContext integration + duplicate picker ── */

export function CustomerMergeModal() {
  const { activeModal, closeModal } = useAdminModal();
  const open = activeModal === 'merge';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<MergeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);

  /* Subscribe to bookings + invoices when the modal opens */
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedGroup(null);

    const unsubB = onSnapshot(query(collection(db, 'bookings')), (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
      setLoading(false);
    });
    const unsubI = onSnapshot(query(collection(db, 'invoices')), (snap) => {
      setInvoices(
        snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            customerName: (data.customerName as string) || undefined,
            customerPhone: (data.customerPhone as string) || undefined,
            customerEmail: (data.customerEmail as string) || undefined,
          };
        }),
      );
    });

    return () => { unsubB(); unsubI(); };
  }, [open]);

  const customers = useMemo(() => buildCustomerList(bookings), [bookings]);
  const groups = useMemo(() => findDuplicates(customers), [customers]);

  function handleClose() {
    setSelectedGroup(null);
    closeModal();
  }

  /* Merge UI for a chosen group */
  if (selectedGroup) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <MergeWizard
            group={selectedGroup}
            allInvoices={invoices}
            onClose={handleClose}
            onBack={() => setSelectedGroup(null)}
            onMerged={() => {
              toast.success('Customers merged');
              handleClose();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  /* Picker UI: list detected duplicate groups */
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge customers</DialogTitle>
          <DialogDescription>
            Detected duplicates based on shared phone, email, or matching name.
            Choose a group to review and merge.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Scanning customers…</div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No duplicate candidates found.
          </div>
        ) : (
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
            {groups.map((g, i) => (
              <li
                key={`${g.matchType}-${g.matchValue}-${i}`}
                className="rounded-md border border-border p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Match by {g.matchType}: <span className="font-mono">{g.matchValue}</span>
                  </div>
                  <ul className="mt-1 text-sm">
                    {g.customers.map((c) => (
                      <li key={c.key} className="truncate">
                        <span className="font-medium">{c.name || '(no name)'}</span>
                        <span className="text-muted-foreground">
                          {' '}— {c.phone ? formatPhone(c.phone) : '—'}
                          {c.email ? ` · ${c.email}` : ''}
                          {' · '}
                          {c.totalBookings} booking{c.totalBookings === 1 ? '' : 's'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button size="sm" onClick={() => setSelectedGroup(g)}>
                  Merge
                </Button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Inner merge wizard (port of marketing's field-unification UI + writeBatch) ── */

function MergeWizard({
  group,
  allInvoices,
  onClose,
  onBack,
  onMerged,
}: {
  group: DuplicateGroup;
  allInvoices: MergeInvoice[];
  onClose: () => void;
  onBack: () => void;
  onMerged: () => void;
}) {
  const customers = group.customers;

  const defaultPrimary = customers.reduce(
    (best, c) => (c.totalBookings > best.totalBookings ? c : best),
    customers[0],
  );

  const [primaryKey, setPrimaryKey] = useState(defaultPrimary.key);
  const [fieldSelections, setFieldSelections] = useState<Record<string, string>>(() => {
    const pk = defaultPrimary.key;
    return { name: pk, phone: pk, email: pk, address: pk, type: pk };
  });

  const allVehicles = useMemo(() => {
    const vMap = new Map<string, string>();
    customers.forEach((c) => {
      getVehicles(c.bookings).forEach((v) => {
        if (!vMap.has(v)) vMap.set(v, c.key);
      });
    });
    return Array.from(vMap.entries());
  }, [customers]);

  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(
    () => new Set(allVehicles.map(([v]) => v)),
  );

  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerStats = useMemo(() => {
    const stats = new Map<string, { bookings: number; invoices: number }>();
    customers.forEach((c) => {
      const phone = c.phone ? normalizePhone(c.phone) : '';
      const email = c.email?.toLowerCase() || '';
      const name = c.name.toLowerCase();

      let invCount = 0;
      allInvoices.forEach((inv) => {
        if (phone && inv.customerPhone && normalizePhone(inv.customerPhone) === phone) { invCount++; return; }
        if (email && inv.customerEmail?.toLowerCase() === email) { invCount++; return; }
        if (name && name !== '-' && inv.customerName?.toLowerCase() === name) { invCount++; }
      });

      stats.set(c.key, { bookings: c.totalBookings, invoices: invCount });
    });
    return stats;
  }, [customers, allInvoices]);

  const totalBookings = Array.from(customerStats.values()).reduce((s, v) => s + v.bookings, 0);
  const totalInvoices = Array.from(customerStats.values()).reduce((s, v) => s + v.invoices, 0);

  function getField(c: Customer, field: string): string {
    switch (field) {
      case 'name': return c.name || '—';
      case 'phone': return c.phone ? formatPhone(c.phone) : '—';
      case 'email': return c.email || '—';
      case 'address': return c.address || '—';
      case 'type': return 'Residential';
      default: return '—';
    }
  }

  function getRawField(c: Customer, field: string): string | undefined {
    switch (field) {
      case 'name': return c.name;
      case 'phone': return c.phone;
      case 'email': return c.email;
      case 'address': return c.address;
      case 'type': return 'Residential';
      default: return undefined;
    }
  }

  const fields = ['name', 'phone', 'email', 'address', 'type'];
  const fieldLabels: Record<string, string> = {
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    type: 'Type',
  };

  /* Field unification: 1:1 from marketing's handleMerge ─────────
     - writeBatch across primary's bookings (merged values)
     - writeBatch across secondaries' bookings (re-key + merged values)
     - writeBatch across invoices matched by secondary identifiers
     - writeBatch delete of secondary customer docs (queried by phone/email)
     All sequenced into a single commit. */
  async function handleMerge() {
    setMerging(true);
    setError(null);
    try {
      const primary = customers.find((c) => c.key === primaryKey)!;
      const secondaries = customers.filter((c) => c.key !== primaryKey);

      const mergedName =
        getRawField(customers.find((c) => c.key === fieldSelections.name)!, 'name') || primary.name;
      const mergedPhone = getRawField(customers.find((c) => c.key === fieldSelections.phone)!, 'phone');
      const mergedEmail = getRawField(customers.find((c) => c.key === fieldSelections.email)!, 'email');
      const mergedAddress = getRawField(customers.find((c) => c.key === fieldSelections.address)!, 'address');

      const batch = writeBatch(db);

      // 1. Update primary's bookings with merged field values
      for (const b of primary.bookings) {
        batch.update(doc(db, 'bookings', b.id), {
          name: mergedName,
          phone: mergedPhone || null,
          email: mergedEmail || null,
          address: mergedAddress || null,
          updatedAt: serverTimestamp(),
        });
      }

      // 2. Transfer secondaries' bookings to primary
      for (const sec of secondaries) {
        for (const b of sec.bookings) {
          batch.update(doc(db, 'bookings', b.id), {
            name: mergedName,
            phone: mergedPhone || null,
            email: mergedEmail || null,
            address: mergedAddress || null,
            customerDeleted: false,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // 3. Transfer invoices matched by secondary identifiers
      for (const sec of secondaries) {
        const secPhone = sec.phone ? normalizePhone(sec.phone) : '';
        const secEmail = sec.email?.toLowerCase() || '';
        const secName = sec.name.toLowerCase();

        const matching = new Set<string>();
        allInvoices.forEach((inv) => {
          if (secPhone && inv.customerPhone && normalizePhone(inv.customerPhone) === secPhone) {
            matching.add(inv.id); return;
          }
          if (secEmail && inv.customerEmail?.toLowerCase() === secEmail) {
            matching.add(inv.id); return;
          }
          if (secName && secName !== '-' && inv.customerName?.toLowerCase() === secName) {
            matching.add(inv.id);
          }
        });

        for (const invId of matching) {
          batch.update(doc(db, 'invoices', invId), {
            customerName: mergedName,
            customerPhone: mergedPhone || '',
            customerEmail: mergedEmail || '',
            updatedAt: serverTimestamp(),
          });
        }

        // 4. Delete secondary customer doc(s) from the customers collection
        if (sec.phone) {
          const cs = await getDocs(query(collection(db, 'customers'), where('phone', '==', sec.phone)));
          cs.docs.forEach((d) => batch.delete(d.ref));
        }
        if (sec.email) {
          const cs = await getDocs(query(collection(db, 'customers'), where('email', '==', sec.email.toLowerCase())));
          cs.docs.forEach((d) => batch.delete(d.ref));
        }
      }

      await batch.commit();
      onMerged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed. No changes were made.');
    } finally {
      setMerging(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Merge customers</DialogTitle>
        <DialogDescription>
          Choose the primary record and which values to keep. All bookings, invoices, and
          history from the other record will be moved to the primary.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Primary selection */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Primary record</p>
          <div className="flex gap-2">
            {customers.map((c) => (
              <button
                key={c.key}
                onClick={() => setPrimaryKey(c.key)}
                className={`flex-1 px-3 py-2.5 rounded-md text-sm font-semibold border transition ${
                  primaryKey === c.key
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Field comparison */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Choose values to keep</p>
          <div className="flex flex-col gap-1">
            {fields.map((field) => (
              <div key={field} className="flex items-center gap-2 py-1">
                <span className="text-xs font-semibold text-muted-foreground w-16 shrink-0">
                  {fieldLabels[field]}
                </span>
                <div className="flex-1 flex gap-2">
                  {customers.map((c) => {
                    const val = getField(c, field);
                    const isSelected = fieldSelections[field] === c.key;
                    return (
                      <button
                        key={c.key}
                        onClick={() =>
                          setFieldSelections((p) => ({ ...p, [field]: c.key }))
                        }
                        className={`flex-1 px-3 py-2 rounded-md text-[13px] text-left border transition ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-foreground font-medium'
                            : 'bg-card border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {allVehicles.length > 0 && (
              <div className="flex items-start gap-2 py-1">
                <span className="text-xs font-semibold text-muted-foreground w-16 shrink-0 pt-2">
                  Vehicles
                </span>
                <div className="flex-1 flex flex-col gap-1.5">
                  {allVehicles.map(([v]) => (
                    <label
                      key={v}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border transition cursor-pointer ${
                        selectedVehicles.has(v)
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card border-border'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedVehicles.has(v)}
                        onChange={(e) => {
                          setSelectedVehicles((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(v); else next.delete(v);
                            return next;
                          });
                        }}
                      />
                      <span className="text-[13px]">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Linked records */}
        <div className="rounded-md bg-muted/40 p-3 text-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Linked records</p>
          {customers.map((c) => {
            const stats = customerStats.get(c.key);
            return (
              <p key={c.key} className="text-muted-foreground">
                <strong className="text-foreground">{c.name}</strong> has{' '}
                {stats?.bookings ?? 0} booking{(stats?.bookings ?? 0) !== 1 ? 's' : ''} and{' '}
                {stats?.invoices ?? 0} invoice{(stats?.invoices ?? 0) !== 1 ? 's' : ''}
              </p>
            );
          })}
          <p className="text-sm font-semibold pt-1 mt-2 border-t border-border">
            After merge: {totalBookings} booking{totalBookings !== 1 ? 's' : ''} and{' '}
            {totalInvoices} invoice{totalInvoices !== 1 ? 's' : ''} on the primary record
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onBack} disabled={merging}>← Back to picker</Button>
        <Button variant="outline" onClick={onClose} disabled={merging}>Cancel</Button>
        <Button onClick={handleMerge} disabled={merging}>
          {merging ? 'Merging…' : 'Merge customers'}
        </Button>
      </DialogFooter>
    </>
  );
}
