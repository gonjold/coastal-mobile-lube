'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@coastal/shared-ui';
import { db } from '@/lib/firebase';
import { useAdminModal } from '@/lib/AdminModalContext';
import { useServices, type Service } from '@/hooks/useServices';
import { nextInvoiceNumberFromList } from '@/lib/invoiceNumber';
import { formatCurrency } from '@/lib/formatCurrency';
import { listAssetsForCustomer, type Asset, type VehicleAsset } from '@/lib/assets';

/* ── A3c canonicalization candidates ──────────────────────────
   Minimal local Invoice/LineItem/Customer shapes used only by
   this modal. Canonicalize alongside the Asset and Booking moves
   in A3c.
   ──────────────────────────────────────────────────────────── */

interface LineItem {
  serviceId?: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxable: boolean;
}

interface CustomerLite {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface FormState {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  assetId: string;
  vehicle: string;
  lineItems: LineItem[];
  notes: string;
  invoiceDate: string;
  dueDate: string;
}

const FL_SALES_TAX_RATE = 0.075;

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function emptyLineItem(): LineItem {
  return {
    serviceName: '',
    quantity: 1,
    unitPrice: 0,
    lineTotal: 0,
    taxable: true,
  };
}

function recalc(items: LineItem[]) {
  const subtotal = items.reduce((s, li) => s + (li.lineTotal || 0), 0);
  const taxableSubtotal = items
    .filter((li) => li.taxable)
    .reduce((s, li) => s + (li.lineTotal || 0), 0);
  const taxAmount = Math.round(taxableSubtotal * FL_SALES_TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal, taxAmount, total };
}

function assetLabel(a: Asset): string {
  if (a.nickname) return a.nickname;
  const v = a as VehicleAsset;
  return [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Asset';
}

export function NewInvoiceModal() {
  const { activeModal, prefill, closeModal } = useAdminModal();
  const router = useRouter();
  const open = activeModal === 'invoice';

  const { services } = useServices({ activeOnly: true });

  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  const [existingInvoiceNumbers, setExistingInvoiceNumbers] = useState<{ invoiceNumber: string }[]>([]);

  const [form, setForm] = useState<FormState>(() => ({
    invoiceNumber: '',
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    assetId: '',
    vehicle: '',
    lineItems: [emptyLineItem()],
    notes: '',
    invoiceDate: todayIso(),
    dueDate: '',
  }));
  const [saving, setSaving] = useState(false);

  /* Reset on open */
  useEffect(() => {
    if (!open) return;
    setForm({
      invoiceNumber: '',
      customerId: prefill?.customer ? '' : '',
      customerName: prefill?.customer?.name ?? '',
      customerPhone: prefill?.customer?.phone ?? '',
      customerEmail: prefill?.customer?.email ?? '',
      customerAddress: prefill?.customer?.address ?? '',
      assetId: '',
      vehicle: '',
      lineItems: [emptyLineItem()],
      notes: '',
      invoiceDate: todayIso(),
      dueDate: '',
    });
    setCustomerQuery(prefill?.customer?.name ?? '');
  }, [open, prefill]);

  /* Subscribe to customers */
  useEffect(() => {
    if (!open) return;
    const unsub = onSnapshot(query(collection(db, 'customers')), (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CustomerLite, 'id'>),
      }));
      rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setCustomers(rows);
    });
    return () => unsub();
  }, [open]);

  /* Load invoice numbers once on open for next-number generation */
  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const snap = await getDocs(collection(db, 'invoices'));
        const nums = snap.docs
          .map((d) => (d.data() as { invoiceNumber?: string }).invoiceNumber)
          .filter((n): n is string => !!n)
          .map((n) => ({ invoiceNumber: n }));
        setExistingInvoiceNumbers(nums);
        setForm((f) =>
          f.invoiceNumber ? f : { ...f, invoiceNumber: nextInvoiceNumberFromList(nums) },
        );
      } catch {
        /* silent */
      }
    })();
  }, [open]);

  /* Load assets when customer is picked */
  useEffect(() => {
    if (!form.customerId) {
      setAssets([]);
      return;
    }
    let cancelled = false;
    setAssetsLoading(true);
    listAssetsForCustomer(form.customerId)
      .then((rows) => { if (!cancelled) setAssets(rows); })
      .catch(() => { if (!cancelled) setAssets([]); })
      .finally(() => { if (!cancelled) setAssetsLoading(false); });
    return () => { cancelled = true; };
  }, [form.customerId]);

  /* Close customer dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const customerMatches = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.phone || '').includes(q) ||
          (c.email || '').toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [customerQuery, customers]);

  const totals = useMemo(() => recalc(form.lineItems), [form.lineItems]);

  function pickCustomer(c: CustomerLite) {
    setForm((f) => ({
      ...f,
      customerId: c.id,
      customerName: c.name ?? '',
      customerPhone: c.phone ?? '',
      customerEmail: c.email ?? '',
      customerAddress: c.address ?? '',
      assetId: '',
      vehicle: '',
    }));
    setCustomerQuery(c.name ?? '');
    setShowCustomerDropdown(false);
  }

  function pickAsset(assetId: string) {
    const a = assets.find((x) => x.id === assetId);
    if (!a) {
      setForm((f) => ({ ...f, assetId: '', vehicle: '' }));
      return;
    }
    setForm((f) => ({ ...f, assetId, vehicle: assetLabel(a) }));
  }

  function updateLine(idx: number, patch: Partial<LineItem>) {
    setForm((f) => {
      const items = [...f.lineItems];
      const cur = items[idx];
      const next = { ...cur, ...patch };
      if (patch.quantity != null || patch.unitPrice != null) {
        next.lineTotal =
          Math.round((next.quantity || 0) * (next.unitPrice || 0) * 100) / 100;
      }
      items[idx] = next;
      return { ...f, lineItems: items };
    });
  }

  function setLineFromService(idx: number, svc: Service) {
    setForm((f) => {
      const items = [...f.lineItems];
      items[idx] = {
        serviceId: svc.id,
        serviceName: svc.name,
        quantity: 1,
        unitPrice: svc.price ?? 0,
        lineTotal: svc.price ?? 0,
        taxable: true,
      };
      return { ...f, lineItems: items };
    });
  }

  function addLine() {
    setForm((f) => ({ ...f, lineItems: [...f.lineItems, emptyLineItem()] }));
  }

  function removeLine(idx: number) {
    setForm((f) => {
      const items = f.lineItems.filter((_, i) => i !== idx);
      if (items.length === 0) items.push(emptyLineItem());
      return { ...f, lineItems: items };
    });
  }

  const isValid =
    !!form.customerName.trim() &&
    form.lineItems.some((li) => li.serviceName.trim() && (li.lineTotal || 0) > 0);

  async function handleSave() {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      const filteredItems = form.lineItems.filter(
        (li) => li.serviceName.trim() && (li.lineTotal || 0) > 0,
      );
      const { subtotal, taxAmount, total } = recalc(filteredItems);
      const docData = {
        invoiceNumber: form.invoiceNumber || nextInvoiceNumberFromList(existingInvoiceNumbers),
        customerId: form.customerId || null,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone || null,
        customerEmail: form.customerEmail || null,
        customerAddress: form.customerAddress || null,
        assetId: form.assetId || null,
        vehicle: form.vehicle || null,
        lineItems: filteredItems,
        subtotal,
        taxAmount,
        total,
        // A2A3-U3: manual create always lands in draft. Owner reviews and
        // sends from /invoices/[id]; never bypass the review window.
        status: 'draft' as const,
        notes: form.notes || null,
        invoiceDate: form.invoiceDate || null,
        dueDate: form.dueDate || null,
        source: 'ops-admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const newRef = await addDoc(collection(db, 'invoices'), docData);
      toast.success(`Draft ${docData.invoiceNumber} created`, {
        description: 'Review and send from the invoice page.',
      });
      closeModal();
      router.push(`/invoices/${newRef.id}`);
    } catch (err) {
      toast.error('Save failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeModal(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invoice number + date */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Invoice number">
              <Input
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                placeholder="CMLT-YYYY-NNN"
              />
            </Field>
            <Field label="Invoice date">
              <Input
                type="date"
                value={form.invoiceDate}
                onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
              />
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
          </div>

          {/* Customer selector */}
          <div>
            <label className="text-xs text-muted-foreground">Customer *</label>
            <div ref={customerRef} className="relative">
              <Input
                value={customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value);
                  setShowCustomerDropdown(true);
                  setForm((f) => ({ ...f, customerId: '', customerName: e.target.value }));
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Search by name, phone, or email…"
              />
              {showCustomerDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg z-20 max-h-[240px] overflow-y-auto">
                  {customerMatches.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
                  ) : (
                    customerMatches.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCustomer(c)}
                        className="block w-full text-left px-3 py-2 hover:bg-muted text-sm border-b border-border last:border-b-0"
                      >
                        <div className="font-medium">{c.name || '(no name)'}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.phone || '—'} {c.email ? `· ${c.email}` : ''}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Input
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="Phone"
              />
              <Input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                placeholder="Email"
              />
            </div>
          </div>

          {/* Vehicle / asset selector */}
          {form.customerId && (
            <div>
              <label className="text-xs text-muted-foreground">
                Vehicle {assetsLoading && <span className="ml-1 text-[10px]">(loading…)</span>}
              </label>
              <select
                value={form.assetId}
                onChange={(e) => pickAsset(e.target.value)}
                className="h-10 px-2 border border-border rounded-md bg-background text-sm w-full"
              >
                <option value="">— No vehicle —</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>{assetLabel(a)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">Line items *</label>
              <Button size="sm" variant="outline" onClick={addLine} type="button">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add line
              </Button>
            </div>
            <div className="space-y-2">
              {form.lineItems.map((li, i) => (
                <div key={i} className="rounded-md border border-border p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={li.serviceId ?? ''}
                      onChange={(e) => {
                        const svc = services.find((s) => s.id === e.target.value);
                        if (svc) setLineFromService(i, svc);
                      }}
                      className="h-10 px-2 border border-border rounded-md bg-background text-sm flex-1"
                    >
                      <option value="">— Pick a service —</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.price ? `($${s.price})` : ''}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => removeLine(i)}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-5 gap-2 items-center">
                    <Input
                      value={li.serviceName}
                      onChange={(e) => updateLine(i, { serviceName: e.target.value })}
                      placeholder="Description"
                      className="col-span-2"
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={li.quantity}
                      onChange={(e) => updateLine(i, { quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="Qty"
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={li.unitPrice}
                      onChange={(e) => updateLine(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                      placeholder="Unit price"
                    />
                    <div className="text-sm text-right font-medium">
                      {formatCurrency(li.lineTotal)}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={li.taxable}
                      onChange={(e) => updateLine(i, { taxable: e.target.checked })}
                    />
                    Taxable
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-md bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (7.5%)</span>
              <span>{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-1 border-t border-border">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              QuickBooks is source of truth on send; this preview is for review only.
            </p>
          </div>

          {/* Notes */}
          <Field label="Notes (optional)">
            <textarea
              className="w-full text-sm border border-border rounded-md p-2 min-h-[60px] bg-background"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid || saving}>
            {saving ? 'Creating…' : 'Create draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
