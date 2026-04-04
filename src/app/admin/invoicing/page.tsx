"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import ToastContainer, { type ToastItem } from "../Toast";
import { type Booking, buildCustomerList, formatPhone, toISODate } from "../shared";
import { getAllItems, type ServiceItem } from "@/data/pricingCatalog";

/* ─── Types ───────────────────────────────────────────────── */

interface LineItem {
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  notes: string;
  invoiceDate: string;
  dueDate: string;
  createdAt?: { toDate: () => Date };
  updatedAt?: { toDate: () => Date };
}

type InvoiceFormData = Omit<Invoice, "id" | "createdAt" | "updatedAt">;

/* ─── Helpers ─────────────────────────────────────────────── */

function statusBadge(status: string) {
  switch (status) {
    case "draft":
      return { label: "Draft", cls: "bg-[#e8e8e8] text-[#555]" };
    case "sent":
      return { label: "Sent", cls: "bg-[#1A5FAC] text-white" };
    case "paid":
      return { label: "Paid", cls: "bg-[#16a34a] text-white" };
    case "overdue":
      return { label: "Overdue", cls: "bg-[#dc2626] text-white" };
    default:
      return { label: status, cls: "bg-[#eee] text-[#444]" };
  }
}

function generateInvoiceNumber(existing: Invoice[]): string {
  const year = new Date().getFullYear();
  const prefix = `CMLT-${year}-`;
  let max = 0;
  existing.forEach((inv) => {
    if (inv.invoiceNumber.startsWith(prefix)) {
      const num = parseInt(inv.invoiceNumber.replace(prefix, ""), 10);
      if (num > max) max = num;
    }
  });
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function emptyLineItem(): LineItem {
  return { serviceName: "", quantity: 1, unitPrice: 0, lineTotal: 0 };
}

function defaultForm(invoices: Invoice[]): InvoiceFormData {
  const today = toISODate(new Date());
  const due = new Date();
  due.setDate(due.getDate() + 30);
  return {
    invoiceNumber: generateInvoiceNumber(invoices),
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    lineItems: [emptyLineItem()],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 0,
    status: "draft",
    notes: "",
    invoiceDate: today,
    dueDate: toISODate(due),
  };
}

function recalcTotals(form: InvoiceFormData): InvoiceFormData {
  const lineItems = form.lineItems.map((li) => ({
    ...li,
    lineTotal: Math.round(li.quantity * li.unitPrice * 100) / 100,
  }));
  const subtotal = Math.round(lineItems.reduce((s, li) => s + li.lineTotal, 0) * 100) / 100;
  const taxAmount = Math.round(subtotal * (form.taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return { ...form, lineItems, subtotal, taxAmount, total };
}

function formatCurrency(n: number): string {
  return "$" + n.toFixed(2);
}

/* ─── Print HTML ──────────────────────────────────────────── */

function generatePrintHtml(inv: Invoice): string {
  const rows = inv.lineItems
    .map(
      (li) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${li.serviceName}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${li.quantity}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">$${li.unitPrice.toFixed(2)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">$${li.lineTotal.toFixed(2)}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html><html><head><title>Invoice ${inv.invoiceNumber}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#0B2040}@media print{body{padding:20px}}</style></head><body>
<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:32px">
<div><h1 style="margin:0;font-size:24px;color:#0B2040">Coastal Mobile Lube</h1><p style="margin:4px 0 0;color:#888;font-size:13px">Mobile Auto & Marine Services</p></div>
<div style="text-align:right"><h2 style="margin:0;font-size:28px;color:#1A5FAC">INVOICE</h2><p style="margin:4px 0 0;font-size:14px;color:#555">${inv.invoiceNumber}</p></div>
</div>
<div style="display:flex;justify-content:space-between;margin-bottom:32px;font-size:14px">
<div><strong>Bill To:</strong><br/>${inv.customerName}${inv.customerPhone ? "<br/>" + inv.customerPhone : ""}${inv.customerEmail ? "<br/>" + inv.customerEmail : ""}</div>
<div style="text-align:right"><strong>Invoice Date:</strong> ${inv.invoiceDate}<br/><strong>Due Date:</strong> ${inv.dueDate}<br/><strong>Status:</strong> ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</div>
</div>
<table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="background:#f5f5f5"><th style="padding:10px 12px;text-align:left;border-bottom:2px solid #ddd">Service</th><th style="padding:10px 12px;text-align:center;border-bottom:2px solid #ddd">Qty</th><th style="padding:10px 12px;text-align:right;border-bottom:2px solid #ddd">Price</th><th style="padding:10px 12px;text-align:right;border-bottom:2px solid #ddd">Total</th></tr></thead><tbody>${rows}</tbody></table>
<div style="display:flex;justify-content:flex-end;margin-top:16px"><div style="width:240px;font-size:14px">
<div style="display:flex;justify-content:space-between;padding:6px 0"><span>Subtotal</span><span>$${inv.subtotal.toFixed(2)}</span></div>
<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #ddd"><span>Tax (${inv.taxRate}%)</span><span>$${inv.taxAmount.toFixed(2)}</span></div>
<div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:bold;font-size:16px"><span>Total</span><span>$${inv.total.toFixed(2)}</span></div>
</div></div>
${inv.notes ? `<div style="margin-top:32px;padding:16px;background:#f9f9f9;border-radius:8px;font-size:13px"><strong>Notes:</strong><br/>${inv.notes.replace(/\n/g, "<br/>")}</div>` : ""}
<div style="margin-top:48px;text-align:center;font-size:12px;color:#aaa">Thank you for choosing Coastal Mobile Lube!</div>
<script>window.print()</script></body></html>`;
}

/* ─── Component ───────────────────────────────────────────── */

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  /* Catalog items for service dropdown */
  const catalogItems = useMemo(() => getAllItems(), []);

  /* Modal state */
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceFormData>(() => defaultForm([]));
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* Customer search dropdown */
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  /* Filter */
  const [statusFilter, setStatusFilter] = useState<string>("all");

  /* Toasts */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  function addToast(message: string, type: "success" | "info" = "success") {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }

  /* ── Firestore listeners ── */
  useEffect(() => {
    const qInv = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const unsub1 = onSnapshot(
      qInv,
      (snap) => {
        setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice));
        setLoading(false);
      },
      () => setLoading(false)
    );

    const qBook = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(qBook, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const customers = useMemo(() => buildCustomerList(bookings), [bookings]);

  /* Click outside customer dropdown */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── Customer matches ── */
  const customerMatches = useMemo(() => {
    if (!customerQuery.trim()) return customers.slice(0, 8);
    const q = customerQuery.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [customerQuery, customers]);

  /* ── Filtered invoices ── */
  const filtered = statusFilter === "all" ? invoices : invoices.filter((i) => i.status === statusFilter);

  /* ── Stats ── */
  const totalDraft = invoices.filter((i) => i.status === "draft").length;
  const totalSent = invoices.filter((i) => i.status === "sent").length;
  const totalPaid = invoices.filter((i) => i.status === "paid").length;
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);

  /* ── Form helpers ── */
  function openCreate() {
    const f = defaultForm(invoices);
    setForm(f);
    setEditingId(null);
    setCustomerQuery("");
    setShowForm(true);
  }

  function openEdit(inv: Invoice) {
    setForm({
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      customerEmail: inv.customerEmail,
      lineItems: inv.lineItems.map((li) => ({ ...li })),
      subtotal: inv.subtotal,
      taxRate: inv.taxRate,
      taxAmount: inv.taxAmount,
      total: inv.total,
      status: inv.status,
      notes: inv.notes,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
    });
    setEditingId(inv.id);
    setCustomerQuery(inv.customerName);
    setShowForm(true);
  }

  function selectCustomer(c: { name: string; phone?: string; email?: string }) {
    setForm((prev) => ({
      ...prev,
      customerName: c.name,
      customerPhone: c.phone || "",
      customerEmail: c.email || "",
    }));
    setCustomerQuery(c.name);
    setShowCustomerDropdown(false);
  }

  function updateLineItem(idx: number, field: keyof LineItem, value: string | number) {
    setForm((prev) => {
      const items = [...prev.lineItems];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        items[idx].lineTotal = Math.round(items[idx].quantity * items[idx].unitPrice * 100) / 100;
      }
      return recalcTotals({ ...prev, lineItems: items });
    });
  }

  function selectService(idx: number, item: ServiceItem) {
    setForm((prev) => {
      const items = [...prev.lineItems];
      items[idx] = {
        serviceName: item.name,
        quantity: 1,
        unitPrice: item.price,
        lineTotal: item.price,
      };
      return recalcTotals({ ...prev, lineItems: items });
    });
  }

  function addLineItem() {
    setForm((prev) => ({ ...prev, lineItems: [...prev.lineItems, emptyLineItem()] }));
  }

  function removeLineItem(idx: number) {
    setForm((prev) => {
      const items = prev.lineItems.filter((_, i) => i !== idx);
      if (items.length === 0) items.push(emptyLineItem());
      return recalcTotals({ ...prev, lineItems: items });
    });
  }

  function updateTaxRate(rate: number) {
    setForm((prev) => recalcTotals({ ...prev, taxRate: rate }));
  }

  /* ── Save ── */
  async function handleSave() {
    if (!form.customerName.trim()) return;
    if (form.lineItems.every((li) => !li.serviceName.trim())) return;

    setSaving(true);
    try {
      const data = {
        ...form,
        lineItems: form.lineItems.filter((li) => li.serviceName.trim()),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "invoices", editingId), data);
        addToast("Invoice updated");
      } else {
        await addDoc(collection(db, "invoices"), {
          ...data,
          createdAt: serverTimestamp(),
        });
        addToast("Invoice created");
      }
      setShowForm(false);
    } catch {
      addToast("Error saving invoice", "info");
    } finally {
      setSaving(false);
    }
  }

  /* ── Status updates ── */
  async function markStatus(id: string, status: "sent" | "paid") {
    await updateDoc(doc(db, "invoices", id), { status, updatedAt: serverTimestamp() });
    addToast(status === "sent" ? "Invoice marked as sent" : "Invoice marked as paid");
  }

  async function handleDelete(id: string) {
    await deleteDoc(doc(db, "invoices", id));
    setDeleteConfirm(null);
    addToast("Invoice deleted");
  }

  function handlePrint(inv: Invoice) {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(generatePrintHtml(inv));
      w.document.close();
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[#888] mb-6">
        <Link href="/admin" className="hover:text-[#1A5FAC] transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-[#0B2040] font-semibold">Invoicing</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#0B2040]">Invoicing</h1>
          <p className="text-[13px] text-[#888] mt-1">Create and manage customer invoices</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1A5FAC] text-white text-[14px] font-semibold rounded-[8px] hover:bg-[#174f94] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Draft", value: totalDraft, color: "#888" },
          { label: "Sent", value: totalSent, color: "#1A5FAC" },
          { label: "Paid", value: totalPaid, color: "#16a34a" },
          { label: "Revenue", value: formatCurrency(totalRevenue), color: "#0B2040" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#e8e8e8] rounded-[12px] p-4">
            <p className="text-[12px] text-[#888] uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-[22px] font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["all", "draft", "sent", "paid", "overdue"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 text-[13px] font-medium rounded-full border transition-colors whitespace-nowrap ${
              statusFilter === s
                ? "bg-[#0B2040] text-white border-[#0B2040]"
                : "bg-white text-[#555] border-[#ddd] hover:border-[#0B2040]"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === "all" && ` (${invoices.length})`}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[#f5f5f5] flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p className="text-[14px] text-[#888]">No invoices yet</p>
          <button
            onClick={openCreate}
            className="mt-3 text-[14px] text-[#1A5FAC] font-semibold hover:underline"
          >
            Create your first invoice
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] overflow-hidden">
          {/* Table header - desktop */}
          <div className="hidden md:grid md:grid-cols-[1fr_1.2fr_100px_100px_90px_140px] gap-4 px-5 py-3 bg-[#f9f9f9] border-b border-[#e8e8e8] text-[12px] font-semibold text-[#888] uppercase tracking-wide">
            <span>Invoice #</span>
            <span>Customer</span>
            <span>Date</span>
            <span className="text-right">Amount</span>
            <span className="text-center">Status</span>
            <span className="text-right">Actions</span>
          </div>

          {filtered.map((inv) => {
            const badge = statusBadge(inv.status);
            return (
              <div
                key={inv.id}
                className="md:grid md:grid-cols-[1fr_1.2fr_100px_100px_90px_140px] gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-b-0 items-center hover:bg-[#fafbfc] transition-colors"
              >
                {/* Mobile: stacked layout */}
                <div>
                  <span className="text-[14px] font-semibold text-[#0B2040]">{inv.invoiceNumber}</span>
                </div>
                <div className="text-[14px] text-[#333] mt-1 md:mt-0">{inv.customerName}</div>
                <div className="text-[13px] text-[#888] mt-1 md:mt-0">{inv.invoiceDate}</div>
                <div className="text-[14px] font-semibold text-[#0B2040] text-right mt-1 md:mt-0">
                  {formatCurrency(inv.total)}
                </div>
                <div className="text-center mt-2 md:mt-0">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1 mt-2 md:mt-0">
                  {inv.status === "draft" && (
                    <button
                      onClick={() => openEdit(inv)}
                      className="px-2 py-1 text-[12px] text-[#1A5FAC] hover:bg-[#f0f4fa] rounded transition-colors"
                      title="Edit"
                    >
                      Edit
                    </button>
                  )}
                  {inv.status === "draft" && (
                    <button
                      onClick={() => markStatus(inv.id, "sent")}
                      className="px-2 py-1 text-[12px] text-[#1A5FAC] hover:bg-[#f0f4fa] rounded transition-colors"
                      title="Mark Sent"
                    >
                      Send
                    </button>
                  )}
                  {inv.status === "sent" && (
                    <button
                      onClick={() => markStatus(inv.id, "paid")}
                      className="px-2 py-1 text-[12px] text-[#16a34a] hover:bg-[#f0faf4] rounded transition-colors"
                      title="Mark Paid"
                    >
                      Paid
                    </button>
                  )}
                  <button
                    onClick={() => handlePrint(inv)}
                    className="px-2 py-1 text-[12px] text-[#888] hover:bg-[#f5f5f5] rounded transition-colors"
                    title="Print"
                  >
                    Print
                  </button>
                  {inv.status === "draft" && (
                    <button
                      onClick={() => setDeleteConfirm(inv.id)}
                      className="px-2 py-1 text-[12px] text-[#dc2626] hover:bg-[#fef2f2] rounded transition-colors"
                      title="Delete"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] p-6 max-w-[380px] w-full shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0B2040] mb-2">Delete Invoice?</h3>
            <p className="text-[14px] text-[#555] mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-[13px] font-medium text-[#555] bg-[#f5f5f5] rounded-[8px] hover:bg-[#eee] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-[13px] font-medium text-white bg-[#dc2626] rounded-[8px] hover:bg-[#b91c1c] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit invoice modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[12px] w-full max-w-[720px] shadow-xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
              <h2 className="text-[18px] font-bold text-[#0B2040]">
                {editingId ? "Edit Invoice" : "New Invoice"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[22px] text-[#888] hover:text-[#333] leading-none"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Invoice number + dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#888] uppercase mb-1">
                    Invoice #
                  </label>
                  <input
                    value={form.invoiceNumber}
                    readOnly
                    className="w-full px-3 py-2 bg-[#f5f5f5] text-[14px] text-[#555] border border-[#e8e8e8] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#888] uppercase mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={form.invoiceDate}
                    onChange={(e) => setForm((p) => ({ ...p, invoiceDate: e.target.value }))}
                    className="w-full px-3 py-2 text-[14px] border border-[#e8e8e8] rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#888] uppercase mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 text-[14px] border border-[#e8e8e8] rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
                  />
                </div>
              </div>

              {/* Customer */}
              <div>
                <label className="block text-[12px] font-semibold text-[#888] uppercase mb-1">
                  Customer
                </label>
                <div ref={customerRef} className="relative">
                  <input
                    value={customerQuery}
                    onChange={(e) => {
                      setCustomerQuery(e.target.value);
                      setForm((p) => ({ ...p, customerName: e.target.value }));
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Search existing or type new name..."
                    className="w-full px-3 py-2 text-[14px] border border-[#e8e8e8] rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
                  />
                  {showCustomerDropdown && customerMatches.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e8e8e8] rounded-[8px] shadow-lg z-10 max-h-[200px] overflow-y-auto">
                      {customerMatches.map((c) => (
                        <button
                          key={c.key}
                          onClick={() => selectCustomer(c)}
                          className="w-full text-left px-3 py-2 hover:bg-[#f5f5f5] transition-colors text-[13px]"
                        >
                          <span className="font-medium text-[#0B2040]">{c.name}</span>
                          {c.phone && (
                            <span className="text-[#888] ml-2">{formatPhone(c.phone)}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#888] uppercase mb-1">
                    Phone
                  </label>
                  <input
                    value={form.customerPhone}
                    onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
                    placeholder="(555) 555-5555"
                    className="w-full px-3 py-2 text-[14px] border border-[#e8e8e8] rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#888] uppercase mb-1">
                    Email
                  </label>
                  <input
                    value={form.customerEmail}
                    onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
                    placeholder="customer@email.com"
                    className="w-full px-3 py-2 text-[14px] border border-[#e8e8e8] rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
                  />
                </div>
              </div>

              {/* Line items */}
              <div>
                <label className="block text-[12px] font-semibold text-[#888] uppercase mb-2">
                  Line Items
                </label>
                <div className="space-y-2">
                  {form.lineItems.map((li, idx) => (
                    <LineItemRow
                      key={idx}
                      item={li}
                      catalogItems={catalogItems}
                      onChange={(field, val) => updateLineItem(idx, field, val)}
                      onSelectService={(s) => selectService(idx, s)}
                      onRemove={() => removeLineItem(idx)}
                      canRemove={form.lineItems.length > 1}
                    />
                  ))}
                </div>
                <button
                  onClick={addLineItem}
                  className="mt-2 flex items-center gap-1 text-[13px] text-[#1A5FAC] font-semibold hover:underline"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add line item
                </button>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-[260px] space-y-2 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-[#888]">Subtotal</span>
                    <span className="font-medium">{formatCurrency(form.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#888]">Tax</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={form.taxRate}
                        onChange={(e) => updateTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-[56px] px-2 py-1 text-[13px] text-right border border-[#e8e8e8] rounded-[6px] focus:outline-none focus:border-[#1A5FAC]"
                      />
                      <span className="text-[13px] text-[#888]">%</span>
                      <span className="ml-2 font-medium">{formatCurrency(form.taxAmount)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#e8e8e8]">
                    <span className="font-bold text-[#0B2040]">Total</span>
                    <span className="font-bold text-[18px] text-[#0B2040]">{formatCurrency(form.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[12px] font-semibold text-[#888] uppercase mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  placeholder="Payment instructions, special notes..."
                  className="w-full px-3 py-2 text-[14px] border border-[#e8e8e8] rounded-[8px] focus:outline-none focus:border-[#1A5FAC] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e8e8e8]">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-[13px] font-medium text-[#555] bg-[#f5f5f5] rounded-[8px] hover:bg-[#eee] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.customerName.trim()}
                className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#1A5FAC] rounded-[8px] hover:bg-[#174f94] transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Invoice" : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}

/* ─── Line Item Row Component ─────────────────────────────── */

function LineItemRow({
  item,
  catalogItems,
  onChange,
  onSelectService,
  onRemove,
  canRemove,
}: {
  item: LineItem;
  catalogItems: ServiceItem[];
  onChange: (field: keyof LineItem, value: string | number) => void;
  onSelectService: (s: ServiceItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [serviceQuery, setServiceQuery] = useState(item.serviceName);
  const [showDrop, setShowDrop] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setServiceQuery(item.serviceName);
  }, [item.serviceName]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDrop(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const matches = useMemo(() => {
    if (!serviceQuery.trim()) return catalogItems.slice(0, 12);
    const q = serviceQuery.toLowerCase();
    return catalogItems.filter((s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)).slice(0, 12);
  }, [serviceQuery, catalogItems]);

  return (
    <div className="flex items-start gap-2">
      {/* Service name */}
      <div ref={ref} className="relative flex-1 min-w-0">
        <input
          value={serviceQuery}
          onChange={(e) => {
            setServiceQuery(e.target.value);
            onChange("serviceName", e.target.value);
            setShowDrop(true);
          }}
          onFocus={() => setShowDrop(true)}
          placeholder="Service name..."
          className="w-full px-3 py-2 text-[13px] border border-[#e8e8e8] rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
        />
        {showDrop && matches.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e8e8e8] rounded-[8px] shadow-lg z-20 max-h-[180px] overflow-y-auto">
            {matches.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelectService(s);
                  setServiceQuery(s.name);
                  setShowDrop(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f5f5f5] transition-colors text-[12px]"
              >
                <span className="font-medium text-[#0B2040]">{s.name}</span>
                <span className="text-[#888] ml-2">{s.category}</span>
                <span className="text-[#1A5FAC] ml-2 font-semibold">${s.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Qty */}
      <input
        type="number"
        min="1"
        value={item.quantity}
        onChange={(e) => onChange("quantity", parseInt(e.target.value) || 1)}
        className="w-[60px] px-2 py-2 text-[13px] text-center border border-[#e8e8e8] rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
      />

      {/* Price */}
      <div className="relative w-[90px]">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-[#888]">$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => onChange("unitPrice", parseFloat(e.target.value) || 0)}
          className="w-full pl-5 pr-2 py-2 text-[13px] text-right border border-[#e8e8e8] rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
        />
      </div>

      {/* Line total */}
      <div className="w-[80px] py-2 text-[13px] font-semibold text-right text-[#0B2040]">
        {formatCurrency(item.lineTotal)}
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className="py-2 px-1 text-[16px] text-[#ccc] hover:text-[#dc2626] transition-colors disabled:opacity-30 disabled:hover:text-[#ccc]"
      >
        &times;
      </button>
    </div>
  );
}
