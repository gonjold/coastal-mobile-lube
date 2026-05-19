'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Send, X, Edit3, ExternalLink } from 'lucide-react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Badge, Button, Card, Input } from '@coastal/shared-ui';
import { db } from '@/lib/firebase';
import { openSmsForInvoice } from '@/lib/payNow';
import type { Invoice } from '@coastal/shared-types';
import SendInvoiceModal from '@/components/invoices/SendInvoiceModal';

interface FormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  invoiceDate: string;
  dueDate: string;
  paidDate: string;
  notes: string;
  status: Invoice['status'];
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusVariant(s: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'paid') return 'default';
  if (s === 'overdue') return 'destructive';
  if (s === 'sent') return 'secondary';
  return 'outline';
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [invoice, setInvoice] = useState<(Invoice & { id: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'invoices', id));
        if (cancelled) return;
        if (!snap.exists()) {
          setError('Invoice not found');
          return;
        }
        const inv = { id: snap.id, ...snap.data() } as Invoice & { id: string };
        setInvoice(inv);
        setForm({
          customerName: inv.customerName ?? '',
          customerPhone: inv.customerPhone ?? '',
          customerEmail: inv.customerEmail ?? '',
          invoiceDate: inv.invoiceDate ?? '',
          dueDate: inv.dueDate ?? '',
          paidDate: inv.paidDate ?? '',
          notes: inv.notes ?? '',
          status: inv.status,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load invoice');
      }
    })();
    return () => { cancelled = true; };
  }, [id, refreshKey]);

  if (error) return <div className="px-6 py-8 text-red-700">{error}</div>;
  if (!invoice || !form) return <div className="px-6 py-8 text-muted-foreground">Loading…</div>;

  const total = typeof invoice.qbTotalAmount === 'number' ? invoice.qbTotalAmount : invoice.total;
  const subtotal = typeof invoice.qbSubtotal === 'number' ? invoice.qbSubtotal : invoice.subtotal;
  const tax = typeof invoice.qbTaxAmount === 'number' ? invoice.qbTaxAmount : invoice.taxAmount;

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'invoices', id), {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        paidDate: form.paidDate,
        notes: form.notes,
        status: form.status,
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
    if (invoice) {
      setForm({
        customerName: invoice.customerName ?? '',
        customerPhone: invoice.customerPhone ?? '',
        customerEmail: invoice.customerEmail ?? '',
        invoiceDate: invoice.invoiceDate ?? '',
        dueDate: invoice.dueDate ?? '',
        paidDate: invoice.paidDate ?? '',
        notes: invoice.notes ?? '',
        status: invoice.status,
      });
    }
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1100px] mx-auto">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/invoices" className="text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            {invoice.invoiceNumber || `Invoice ${id.slice(0, 8)}`}
          </h1>
          <Badge variant={statusVariant(form.status)} className="capitalize">{form.status}</Badge>
          <span className="text-base font-semibold">{formatCurrency(total)}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancel} disabled={saving}><X className="h-4 w-4 mr-1" /> Cancel</Button>
              <Button size="sm" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" /> {saving ? 'Saving…' : 'Save'}</Button>
            </>
          ) : (
            <>
              {invoice.status !== 'paid' && (
                <Button
                  size="sm"
                  onClick={() => setShowSendModal(true)}
                  disabled={!invoice.customerEmail}
                  title={invoice.customerEmail ? 'Send invoice email to customer' : 'Add a customer email to enable Send'}
                >
                  <Send className="h-4 w-4 mr-1" />
                  {invoice.status === 'sent' ? 'Resend' : 'Send'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit3 className="h-4 w-4 mr-1" /> Edit</Button>
            </>
          )}
        </div>
      </header>

      {showSendModal && (
        <SendInvoiceModal
          invoice={invoice}
          onClose={() => setShowSendModal(false)}
          onSent={(sentDateISO) => {
            setInvoice((prev) => prev ? { ...prev, status: 'sent', sentDate: sentDateISO } as typeof prev : prev);
            setForm((prev) => prev ? { ...prev, status: 'sent' } : prev);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Bill to</h2>
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Customer"><Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></Field>
                <Field label="Phone"><Input value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} /></Field>
                <Field label="Email"><Input type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} /></Field>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Read label="Name" value={form.customerName} />
                <Read label="Phone" value={form.customerPhone} />
                <Read label="Email" value={form.customerEmail} />
              </div>
            )}
          </Card>

          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Services & parts</h2>
            {invoice.lineItems && invoice.lineItems.length > 0 ? (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right w-16">Qty</th>
                    <th className="py-2 text-right w-24">Rate</th>
                    <th className="py-2 text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((li, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2">{li.serviceName}</td>
                      <td className="py-2 text-right">{li.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(li.unitPrice)}</td>
                      <td className="py-2 text-right">{formatCurrency(li.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-muted-foreground">No line items.</div>
            )}
          </Card>

          <Card className="p-5 gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Totals</h2>
            <dl className="text-sm space-y-1">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCurrency(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Tax</dt><dd>{formatCurrency(tax)}</dd></div>
              <div className="flex justify-between font-semibold border-t border-border pt-1"><dt>Total</dt><dd>{formatCurrency(total)}</dd></div>
              {invoice.paidAmount != null && invoice.paidAmount > 0 && (
                <div className="flex justify-between text-emerald-700"><dt>Paid</dt><dd>{formatCurrency(invoice.paidAmount)}</dd></div>
              )}
            </dl>
          </Card>

          <Card className="p-5 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h2>
            {editing ? (
              <textarea
                className="w-full text-sm border border-border rounded-md p-2 min-h-[80px] bg-background"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            ) : (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{form.notes || 'No notes.'}</div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Schedule</h2>
            {editing ? (
              <div className="space-y-3">
                <Field label="Issue date"><Input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} /></Field>
                <Field label="Due date"><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></Field>
                <Field label="Paid date"><Input type="date" value={form.paidDate} onChange={e => setForm({ ...form, paidDate: e.target.value })} /></Field>
                <Field label="Status">
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Invoice['status'] })} className="h-9 px-2 border border-border rounded-md bg-background text-sm">
                    {(['draft', 'sent', 'paid', 'overdue'] as const).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            ) : (
              <dl className="text-sm space-y-1">
                <Read label="Issued" value={form.invoiceDate} />
                <Read label="Due" value={form.dueDate} />
                <Read label="Paid" value={form.paidDate} />
              </dl>
            )}
          </Card>

          {invoice.bookingId && (
            <Card className="p-5 gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Related booking</h2>
              <Link href={`/jobs/${invoice.bookingId}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                Open booking <ExternalLink className="h-3 w-3" />
              </Link>
            </Card>
          )}

          <Card className="p-5 gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">QuickBooks</h2>
            <dl className="text-sm space-y-1">
              <Read label="QB doc #" value={invoice.qbDocNumber ?? '—'} />
              <Read label="Finalize" value={invoice.qboFinalizeStatus ?? '—'} />
              {invoice.qbPaymentLink && (
                <a href={invoice.qbPaymentLink} target="_blank" rel="noopener" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  Payment link <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </dl>
            {invoice.qbPaymentLink && !invoice.paidDate && invoice.customerPhone && (
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={() => openSmsForInvoice(
                  { invoiceNumber: invoice.invoiceNumber, qbPaymentLink: invoice.qbPaymentLink as string },
                  { name: invoice.customerName ?? '', phone: invoice.customerPhone ?? '' },
                )}
              >
                Pay Now (send SMS)
              </Button>
            )}
            {invoice.qbPaymentLink && !invoice.paidDate && !invoice.customerPhone && (
              <div className="mt-2 text-xs text-muted-foreground">
                Add a customer phone to enable Pay Now SMS.
              </div>
            )}
            {invoice.qboFinalizeStatus === 'error' && (
              <Button variant="outline" size="sm" disabled title="Fix-invoice dialog lands in STEP 13">
                Retry QB
              </Button>
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
    <div className="flex justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || '—'}</dd>
    </div>
  );
}
