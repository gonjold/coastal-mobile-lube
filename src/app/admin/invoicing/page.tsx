"use client";

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import ToastContainer, { type ToastItem } from "../Toast";
import { type Booking, buildCustomerList, formatPhone, toISODate, getServiceLabel } from "../shared";
import { useServices, type Service } from "@/hooks/useServices";
import AdminTopBar from "@/components/admin/AdminTopBar";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableRow,
  type AdminColumn,
} from "@/components/admin/AdminTable";
import AdminCSVExport from "@/components/admin/AdminCSVExport";
import AdminBadge from "@/components/admin/AdminBadge";
import InvoiceDetailPanel, { type InvoiceForPanel } from "@/components/admin/InvoiceDetailPanel";
import { BRAND_LOGOS } from "@/lib/brand/logos";
import NeedsInvoiceBanner, { type CompletedJob } from "@/components/admin/NeedsInvoiceBanner";
import { useAdminModal } from "@/contexts/AdminModalContext";
import { formatCurrency } from "@/lib/formatCurrency";

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
  paidDate?: string;
  paidAmount?: number;
  division?: string;
  jobReference?: string;
  vehicle?: string;
  qbInvoiceId?: string;
  qbPaymentLink?: string;
  createdAt?: { toDate: () => Date };
  updatedAt?: { toDate: () => Date };
}

type InvoiceFormData = Omit<Invoice, "id" | "createdAt" | "updatedAt">;

/* ─── Helpers ─────────────────────────────────────────────── */

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

function formatDateAbbr(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInvoiceBadgeVariant(status: string): "green" | "red" | "amber" | "gray" | "blue" {
  switch (status) {
    case "paid": return "green";
    case "overdue": return "red";
    case "sent": return "blue";
    case "draft": return "gray";
    default: return "gray";
  }
}

function isOverdue(inv: Invoice): boolean {
  if (inv.status === "overdue") return true;
  if (inv.status === "sent" && inv.dueDate) {
    return new Date(inv.dueDate + "T23:59:59") < new Date();
  }
  return false;
}

/* ─── Print HTML ──────────────────────────────────────────── */

const LOGO_URL = BRAND_LOGOS.primaryPng;

function generatePrintHtml(inv: Invoice): string {
  const rows = inv.lineItems
    .map(
      (li) =>
        `<tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0">${li.serviceName}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;text-align:center">${li.quantity}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;text-align:right">$${li.unitPrice.toFixed(2)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e0e0e0;text-align:right">$${li.lineTotal.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<title>Invoice ${inv.invoiceNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px;
    color: #0B2040;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .no-print { display: block; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none !important; }
    nav, aside, header, footer,
    button, [role="navigation"],
    .sidebar, .admin-sidebar { display: none !important; }
    a { text-decoration: none; color: inherit; }
  }
  @media screen {
    .no-print {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 100;
      display: flex;
      gap: 8px;
    }
    .no-print button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-print {
      background: #1A5FAC;
      color: #fff;
    }
    .btn-print:hover { background: #174f94; }
    .btn-pdf {
      background: #E07B2D;
      color: #fff;
    }
    .btn-pdf:hover { background: #c96a24; }
  }
</style>
</head>
<body>

<!-- Action buttons (hidden when printing) -->
<div class="no-print">
  <button class="btn-print" onclick="window.print()">Print Invoice</button>
  <button class="btn-pdf" onclick="window.print()">Download PDF</button>
</div>

<!-- Header with logo and INVOICE title -->
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #0B2040">
  <div style="display:flex;align-items:center;gap:16px">
    <img src="${LOGO_URL}" alt="Coastal Mobile Lube &amp; Tire" style="width:72px;height:72px;border-radius:50%;object-fit:cover" />
    <div>
      <h1 style="font-size:22px;font-weight:800;color:#0B2040;line-height:1.2">Coastal Mobile Lube &amp; Tire</h1>
      <p style="font-size:12px;color:#888;margin-top:2px">Mobile Auto &amp; Marine Services</p>
    </div>
  </div>
  <div style="text-align:right">
    <h2 style="font-size:32px;font-weight:800;color:#1A5FAC;letter-spacing:2px">INVOICE</h2>
  </div>
</div>

<!-- Invoice details and Bill To -->
<div style="display:flex;justify-content:space-between;margin-bottom:28px;font-size:14px">
  <div>
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:600;margin-bottom:6px">Bill To</p>
    <p style="font-size:16px;font-weight:700;color:#0B2040;margin-bottom:4px">${inv.customerName}</p>
    ${inv.customerPhone ? `<p style="color:#555;margin-bottom:2px">${inv.customerPhone}</p>` : ""}
    ${inv.customerEmail ? `<p style="color:#555">${inv.customerEmail}</p>` : ""}
  </div>
  <div style="text-align:right">
    <div style="margin-bottom:8px">
      <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:600">Invoice #</span><br/>
      <span style="font-size:15px;font-weight:700;color:#0B2040">${inv.invoiceNumber}</span>
    </div>
    <div style="margin-bottom:4px">
      <span style="color:#888;font-size:13px">Date:</span>
      <span style="color:#0B2040;font-weight:500;font-size:13px;margin-left:4px">${inv.invoiceDate}</span>
    </div>
    <div>
      <span style="color:#888;font-size:13px">Due:</span>
      <span style="color:#0B2040;font-weight:500;font-size:13px;margin-left:4px">${inv.dueDate}</span>
    </div>
  </div>
</div>

<!-- Line items table -->
<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
  <thead>
    <tr style="background:#0B2040">
      <th style="padding:10px 14px;text-align:left;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Service</th>
      <th style="padding:10px 14px;text-align:center;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Qty</th>
      <th style="padding:10px 14px;text-align:right;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Price</th>
      <th style="padding:10px 14px;text-align:right;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Total</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<!-- Totals -->
<div style="display:flex;justify-content:flex-end;margin-bottom:32px">
  <div style="width:260px;font-size:14px">
    <div style="display:flex;justify-content:space-between;padding:8px 0;color:#555">
      <span>Subtotal</span>
      <span style="font-weight:500">$${inv.subtotal.toFixed(2)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;color:#555;border-bottom:1px solid #ddd">
      <span>Tax (${inv.taxRate}%)</span>
      <span style="font-weight:500">$${inv.taxAmount.toFixed(2)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:800;font-size:18px;color:#0B2040">
      <span>Total</span>
      <span>$${inv.total.toFixed(2)}</span>
    </div>
  </div>
</div>

${inv.notes ? `<!-- Notes -->
<div style="margin-bottom:28px;padding:14px 16px;background:#f7f8fa;border-left:4px solid #1A5FAC;border-radius:4px;font-size:13px;color:#333">
  <strong style="color:#0B2040">Notes:</strong><br/>
  <span style="color:#555">${inv.notes.replace(/\n/g, "<br/>")}</span>
</div>` : ""}

<!-- Payment methods -->
<div style="margin-bottom:28px;padding:16px 20px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px">
  <p style="font-weight:700;color:#0B2040;margin-bottom:8px;font-size:14px">Payment Methods</p>
  <p style="color:#555;line-height:1.7">
    Zelle &nbsp;|&nbsp; Venmo &nbsp;|&nbsp; Cash &nbsp;|&nbsp; Check
  </p>
</div>

<!-- Footer -->
<div style="text-align:center;padding-top:20px;border-top:1px solid #e0e0e0">
  <p style="font-size:14px;font-weight:600;color:#0B2040;margin-bottom:4px">Thank you for choosing Coastal Mobile Lube & Tire</p>
  <p style="font-size:13px;color:#888">813-722-LUBE &nbsp;|&nbsp; coastalmobilelube.com</p>
</div>

</body>
</html>`;
}

/* ─── Table columns ──────────────────────────────────────── */

const INVOICE_COLUMNS: AdminColumn[] = [
  { key: "invoiceNumber", label: "Invoice", align: "left", sortable: true },
  { key: "customerName", label: "Customer", align: "left", sortable: true },
  { key: "service", label: "Service", align: "left", sortable: true },
  { key: "invoiceDate", label: "Date", align: "center", sortable: true },
  { key: "dueDate", label: "Due", align: "center", sortable: true },
  { key: "total", label: "Amount", align: "center", sortable: true },
  { key: "status", label: "Status", align: "center", sortable: true },
  { key: "actions", label: "", align: "center", sortable: false },
];

const GRID_TEMPLATE = "150px 1.2fr 1.2fr 90px 90px 110px 90px 40px";

/* ─── Status filter config ───────────────────────────────── */

const STATUS_FILTERS = [
  { key: "all", label: "All", color: "#0B2040" },
  { key: "draft", label: "Draft", color: "#6B7280" },
  { key: "sent", label: "Sent", color: "#1A5FAC" },
  { key: "paid", label: "Paid", color: "#16A34A" },
  { key: "overdue", label: "Overdue", color: "#DC2626" },
];

/* ─── Component ───────────────────────────────────────────── */

export default function InvoicingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
      </div>
    }>
      <InvoicingPageInner />
    </Suspense>
  );
}

function InvoicingPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  /* Catalog items for service dropdown - live from Firestore */
  const { services: catalogItems } = useServices();

  /* Modal state */
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceFormData>(() => defaultForm([]));
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* Pre-fill banner */
  const [prefillNote, setPrefillNote] = useState<string | null>(null);

  /* Customer search dropdown */
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  /* Inline new customer creation in invoice modal */
  const [creatingNewCustomer, setCreatingNewCustomer] = useState(false);
  const [newCustFirst, setNewCustFirst] = useState("");
  const [newCustLast, setNewCustLast] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");

  /* Filter & sort */
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>("invoiceDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  /* Detail panel */
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  /* Action menu */
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!actionMenuId) return;
    function handleClick() { setActionMenuId(null); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [actionMenuId]);

  /* Toasts */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  function addToast(message: string, type: "success" | "info" = "success") {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }

  /* ── Listen to AdminModalContext for "invoice" triggers ── */
  const { activeModal: globalActiveModal, prefillData: globalPrefillData, closeModal: globalCloseModal } = useAdminModal();
  useEffect(() => {
    if (globalActiveModal === "invoice") {
      if (globalPrefillData?.customer) {
        const c = globalPrefillData.customer;
        openCreateFromCustomer(c.name, c.phone || "", c.email || "");
      } else if (!showForm) {
        openCreate();
      }
      globalCloseModal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalActiveModal]);

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

  /* ── Filtered & sorted invoices ── */
  const filtered = useMemo(() => {
    let list = statusFilter === "all" ? invoices : invoices.filter((i) => i.status === statusFilter);

    // Text search filter
    if (invoiceSearch.trim()) {
      const q = invoiceSearch.toLowerCase().trim();
      list = list.filter((i) =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        (i.lineItems[0]?.serviceName || "").toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortKey) {
        case "invoiceNumber": aVal = a.invoiceNumber; bVal = b.invoiceNumber; break;
        case "customerName": aVal = a.customerName.toLowerCase(); bVal = b.customerName.toLowerCase(); break;
        case "service": aVal = a.lineItems[0]?.serviceName?.toLowerCase() || ""; bVal = b.lineItems[0]?.serviceName?.toLowerCase() || ""; break;
        case "invoiceDate": aVal = a.invoiceDate; bVal = b.invoiceDate; break;
        case "dueDate": aVal = a.dueDate; bVal = b.dueDate; break;
        case "total": aVal = a.total; bVal = b.total; break;
        case "status": aVal = a.status; bVal = b.status; break;
        default: aVal = a.invoiceDate; bVal = b.invoiceDate;
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [invoices, statusFilter, invoiceSearch, sortKey, sortDir]);

  /* ── Sort handler ── */
  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  /* ── Summary card stats ── */
  const stats = useMemo(() => {
    const sentInvoices = invoices.filter((i) => i.status === "sent");
    const overdueInvoices = invoices.filter((i) => i.status === "overdue" || (i.status === "sent" && isOverdue(i)));
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidThisMonth = invoices.filter((i) => {
      if (i.status !== "paid") return false;
      const paidDate = i.paidDate ? new Date(i.paidDate + "T12:00:00") : (i.updatedAt?.toDate?.() ?? null);
      return paidDate && paidDate >= monthStart;
    });

    const outstanding = sentInvoices.reduce((s, i) => s + i.total, 0);
    const collectedMTD = paidThisMonth.reduce((s, i) => s + i.total, 0);
    const overdueTotal = overdueInvoices.reduce((s, i) => s + i.total, 0);

    // Avg days to pay (from paid invoices in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentPaid = invoices.filter((i) => {
      if (i.status !== "paid") return false;
      const paidDate = i.paidDate ? new Date(i.paidDate + "T12:00:00") : (i.updatedAt?.toDate?.() ?? null);
      return paidDate && paidDate >= thirtyDaysAgo;
    });

    let avgDays = 0;
    if (recentPaid.length > 0) {
      const totalDays = recentPaid.reduce((sum, i) => {
        const invoiceDate = new Date(i.invoiceDate + "T12:00:00");
        const paidDate = i.paidDate ? new Date(i.paidDate + "T12:00:00") : (i.updatedAt?.toDate?.() ?? invoiceDate);
        return sum + Math.max(0, Math.round((paidDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)));
      }, 0);
      avgDays = Math.round(totalDays / recentPaid.length);
    }

    return {
      outstanding,
      outstandingCount: sentInvoices.length,
      collectedMTD,
      collectedCount: paidThisMonth.length,
      overdueTotal,
      overdueCount: overdueInvoices.length,
      avgDays,
    };
  }, [invoices]);

  /* ── Status filter counts ── */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: invoices.length };
    invoices.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return counts;
  }, [invoices]);

  /* ── Completed jobs needing invoicing ── */
  // TODO: Add proper invoiceId field on bookings for linking. Currently matching by customer name.
  const completedJobsNeedingInvoice = useMemo<CompletedJob[]>(() => {
    const completedBookings = bookings.filter((b) => b.status === "completed");
    const invoiceCustomerNames = new Set(invoices.map((i) => i.customerName.toLowerCase()));

    return completedBookings
      .filter((b) => {
        const name = (b.name || b.customerName || "").toLowerCase();
        // Check if there's already an invoice for this customer with a matching date
        const hasMatchingInvoice = invoices.some((inv) => {
          if (inv.customerName.toLowerCase() !== name) return false;
          // If invoice was created around the same time as the booking, consider it linked
          const bookingDate = b.confirmedDate || b.preferredDate || "";
          return inv.invoiceDate === bookingDate;
        });
        return !hasMatchingInvoice;
      })
      .map((b) => {
        // Estimate amount from selected services or catalog lookup
        let amount = 0;
        if (b.selectedServices?.length) {
          amount = b.selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
        } else if (b.service) {
          const match = catalogItems.find((s) => s.name.toLowerCase() === b.service!.toLowerCase());
          amount = match?.price ?? 0;
        }
        return { booking: b, estimatedAmount: amount };
      });
  }, [bookings, invoices, catalogItems]);

  /* ── Open modal pre-filled from a booking ── */
  const openCreateFromBooking = useCallback(
    async (bookingId: string) => {
      try {
        const snap = await getDoc(doc(db, "bookings", bookingId));
        if (!snap.exists()) {
          addToast("Booking not found", "info");
          return;
        }
        const b = { id: snap.id, ...snap.data() } as Booking;
        const f = defaultForm(invoices);

        f.customerName = b.name || "";
        f.customerPhone = b.phone || "";
        f.customerEmail = b.email || "";

        // Build line items from service field, looking up price from catalog
        const serviceName = b.service || "";
        if (serviceName) {
          const match = catalogItems.find(
            (s) => s.name.toLowerCase() === serviceName.toLowerCase()
          );
          f.lineItems = [
            {
              serviceName,
              quantity: 1,
              unitPrice: match?.price ?? 0,
              lineTotal: match?.price ?? 0,
            },
          ];
        }

        const filled = recalcTotals(f);
        setForm(filled);
        setEditingId(null);
        setCustomerQuery(filled.customerName);

        const bookingDate = b.preferredDate || b.confirmedDate || "";
        setPrefillNote(
          `Auto-filled from booking${bookingDate ? ` (${bookingDate})` : ""}. Review and adjust before creating.`
        );
        setShowForm(true);
      } catch {
        addToast("Failed to load booking", "info");
      }
    },
    [invoices, catalogItems]
  );

  /* ── Open modal pre-filled from a CompletedJob (NeedsInvoiceBanner) ── */
  function openCreateFromCompletedJob(job: CompletedJob) {
    const b = job.booking;
    const f = defaultForm(invoices);

    f.customerName = b.name || b.customerName || "";
    f.customerPhone = b.phone || b.customerPhone || "";
    f.customerEmail = b.email || b.customerEmail || "";

    // Build line items from the booking's services
    if (b.selectedServices?.length) {
      f.lineItems = b.selectedServices.map((s) => ({
        serviceName: s.name,
        quantity: 1,
        unitPrice: s.price || 0,
        lineTotal: s.price || 0,
      }));
    } else if (b.service) {
      const match = catalogItems.find((s) => s.name.toLowerCase() === b.service!.toLowerCase());
      f.lineItems = [
        {
          serviceName: b.service,
          quantity: 1,
          unitPrice: match?.price ?? 0,
          lineTotal: match?.price ?? 0,
        },
      ];
    }

    // Add convenience fee if not waived
    const fee = (b as unknown as Record<string, unknown>).convenienceFee as { amount: number; waived: boolean } | undefined;
    if (fee && !fee.waived && fee.amount > 0) {
      f.lineItems.push({
        serviceName: "Mobile Service Fee",
        quantity: 1,
        unitPrice: fee.amount,
        lineTotal: fee.amount,
      });
    }

    const filled = recalcTotals(f);
    setForm(filled);
    setEditingId(null);
    setCustomerQuery(filled.customerName);

    const bookingDate = b.confirmedDate || b.preferredDate || "";
    setPrefillNote(
      `Auto-filled from completed job${bookingDate ? ` (${bookingDate})` : ""}. Review and adjust before creating.`
    );
    setShowForm(true);
  }

  /* ── Open modal pre-filled from customer info only ── */
  function openCreateFromCustomer(name: string, phone: string, email: string) {
    const f = defaultForm(invoices);
    f.customerName = name;
    f.customerPhone = phone;
    f.customerEmail = email;
    setForm(f);
    setEditingId(null);
    setCustomerQuery(name);
    setPrefillNote(null);
    setShowForm(true);
  }

  /* ── Check URL params for booking pre-fill ── */
  const [prefillHandled, setPrefillHandled] = useState(false);
  useEffect(() => {
    if (prefillHandled) return;
    if (loading) return;
    const from = searchParams.get("from");
    const id = searchParams.get("id");
    if (from === "booking" && id) {
      setPrefillHandled(true);
      openCreateFromBooking(id);
      router.replace("/admin/invoicing", { scroll: false });
    } else if (from === "customer") {
      setPrefillHandled(true);
      const name = searchParams.get("name") || "";
      const phone = searchParams.get("phone") || "";
      const email = searchParams.get("email") || "";
      openCreateFromCustomer(name, phone, email);
      router.replace("/admin/invoicing", { scroll: false });
    } else if (from === "new") {
      setPrefillHandled(true);
      openCreate();
      router.replace("/admin/invoicing", { scroll: false });
    } else {
      // Check for filter param
      const filterParam = searchParams.get("filter");
      if (filterParam) {
        setPrefillHandled(true);
        setStatusFilter(filterParam);
        router.replace("/admin/invoicing", { scroll: false });
      }
    }
  }, [searchParams, loading, prefillHandled, openCreateFromBooking, router]);

  /* ── Form helpers ── */
  function openCreate() {
    const f = defaultForm(invoices);
    setForm(f);
    setEditingId(null);
    setCustomerQuery("");
    setPrefillNote(null);
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

  function selectService(idx: number, item: Service) {
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
  async function handleSave(statusOverride?: "draft" | "sent") {
    if (!form.customerName.trim()) return;
    if (form.lineItems.every((li) => !li.serviceName.trim())) return;

    setSaving(true);
    try {
      const data = {
        ...form,
        status: statusOverride || form.status,
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
        addToast(statusOverride === "sent" ? "Invoice created and marked as sent" : "Invoice saved as draft");
      }

      // Send invoice email when status is "sent" and customer has an email
      if (statusOverride === "sent" && form.customerEmail) {
        try {
          const idToken = await auth.currentUser?.getIdToken();

          // Check QB connection
          const qbDoc = await getDoc(doc(db, "settings", "quickbooks"));
          const qbConnected = qbDoc.exists() && qbDoc.data()?.accessToken;

          const endpoint = qbConnected
            ? "https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendInvoiceWithQBPayment"
            : "https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendInvoiceEmail";

          const filteredItems = form.lineItems.filter((li) => li.serviceName.trim());

          const body = qbConnected
            ? {
                invoiceId: editingId || "",
                invoiceNumber: form.invoiceNumber,
                customerName: form.customerName,
                customerEmail: form.customerEmail,
                customerPhone: form.customerPhone || "",
                customerAddress: "",
                customerId: "",
                lineItems: filteredItems,
                subtotal: form.subtotal,
                tax: form.taxAmount,
                convenienceFee: 0,
                total: form.total,
                vehicle: "",
                dueDate: form.dueDate || "",
              }
            : {
                customerEmail: form.customerEmail,
                customerName: form.customerName,
                customerPhone: form.customerPhone || "",
                invoiceNumber: form.invoiceNumber,
                lineItems: filteredItems,
                subtotal: form.subtotal,
                taxAmount: form.taxAmount,
                total: form.total,
                notes: form.notes,
                vehicle: "",
                invoiceDate: form.invoiceDate || "",
                dueDate: form.dueDate || "",
              };

          await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify(body),
          });
          addToast(`Invoice email sent to ${form.customerEmail}`, "success");
        } catch {
          addToast("Invoice saved but email failed to send", "info");
        }
      }

      setShowForm(false);
    } catch {
      addToast("Error saving invoice", "info");
    } finally {
      setSaving(false);
    }
  }

  /* ── Mark as paid ── */
  async function handleMarkPaid(invoiceId: string) {
    try {
      await updateDoc(doc(db, "invoices", invoiceId), {
        status: "paid",
        paidAmount: invoices.find((i) => i.id === invoiceId)?.total ?? 0,
        paidDate: toISODate(new Date()),
        updatedAt: serverTimestamp(),
      });
      setSelectedInvoice(null);
      addToast("Invoice marked as paid");
    } catch {
      addToast("Error updating invoice", "info");
    }
  }

  /* ── Revert to Sent ── */
  async function handleRevertToSent(invoiceId: string) {
    try {
      await updateDoc(doc(db, "invoices", invoiceId), {
        status: "sent",
        paidDate: null,
        paidAmount: null,
        updatedAt: serverTimestamp(),
      });
      setSelectedInvoice(null);
      addToast("Invoice reverted to sent");
    } catch {
      addToast("Error updating invoice", "info");
    }
  }

  /* ── Send / Resend invoice email ── */
  async function handleSendInvoice(inv: Invoice | InvoiceForPanel) {
    if (!inv.customerEmail) {
      addToast("No customer email on this invoice", "info");
      return;
    }

    // Update status to sent if currently draft
    if (inv.status === "draft") {
      await updateDoc(doc(db, "invoices", inv.id), { status: "sent", updatedAt: serverTimestamp() });
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();

      // Check QB connection
      const qbDoc = await getDoc(doc(db, "settings", "quickbooks"));
      const qbConnected = qbDoc.exists() && qbDoc.data()?.accessToken;

      const endpoint = qbConnected
        ? "https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendInvoiceWithQBPayment"
        : "https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendInvoiceEmail";

      const body = qbConnected
        ? {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName,
            customerEmail: inv.customerEmail,
            customerPhone: inv.customerPhone || "",
            customerAddress: "",
            customerId: "",
            lineItems: inv.lineItems,
            subtotal: inv.subtotal,
            tax: inv.taxAmount,
            convenienceFee: 0,
            total: inv.total,
            vehicle: inv.vehicle || "",
            dueDate: inv.dueDate || "",
          }
        : {
            customerEmail: inv.customerEmail,
            customerName: inv.customerName,
            customerPhone: inv.customerPhone || "",
            invoiceNumber: inv.invoiceNumber,
            lineItems: inv.lineItems,
            subtotal: inv.subtotal,
            taxAmount: inv.taxAmount,
            total: inv.total,
            notes: inv.notes,
            vehicle: inv.vehicle || "",
            invoiceDate: inv.invoiceDate || "",
            dueDate: inv.dueDate || "",
          };

      await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
      addToast(`Invoice email sent to ${inv.customerEmail}`, "success");
    } catch {
      addToast("Invoice saved but email failed to send", "info");
    }
  }

  /* ── Delete ── */
  async function handleDelete(id: string) {
    await deleteDoc(doc(db, "invoices", id));
    setDeleteConfirm(null);
    addToast("Invoice deleted");
  }

  /* ── Print ── */
  function handlePrint(inv: Invoice | InvoiceForPanel) {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(generatePrintHtml(inv as Invoice));
      w.document.close();
    }
  }

  /* ── CSV export data ── */
  const csvData = useMemo(() => {
    return filtered.map((inv) => ({
      "Invoice #": inv.invoiceNumber,
      Customer: inv.customerName,
      Email: inv.customerEmail,
      Phone: inv.customerPhone,
      Date: inv.invoiceDate,
      Due: inv.dueDate,
      Amount: inv.total.toFixed(2),
      Status: inv.status,
    }));
  }, [filtered]);

  /* ── Convert Invoice to InvoiceForPanel ── */
  function toPanel(inv: Invoice): InvoiceForPanel {
    const vehicle = inv.vehicle || "";
    const service = inv.lineItems[0]?.serviceName || "";
    return {
      ...inv,
      vehicle,
      jobReference: inv.jobReference || service,
    };
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
    <div>
      {/* AdminTopBar */}
      <AdminTopBar
        title="Invoicing"
        subtitle={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
      />

      {/* Summary cards */}
      <div className="px-8 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Outstanding */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 px-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#1A5FAC]" />
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] mb-2">
              Outstanding
            </div>
            <div className="text-[26px] font-bold text-[#1A5FAC]">
              {formatCurrency(stats.outstanding)}
            </div>
            <div className="text-xs text-gray-500">{stats.outstandingCount} invoices</div>
          </div>

          {/* Collected MTD */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 px-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#16A34A]" />
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] mb-2">
              Collected MTD
            </div>
            <div className="text-[26px] font-bold text-[#16A34A]">
              {formatCurrency(stats.collectedMTD)}
            </div>
            <div className="text-xs text-gray-500">{stats.collectedCount} paid</div>
          </div>

          {/* Overdue */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 px-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#DC2626]" />
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] mb-2">
              Overdue
            </div>
            <div className="text-[26px] font-bold text-[#DC2626]">
              {formatCurrency(stats.overdueTotal)}
            </div>
            <div className="text-xs text-gray-500">{stats.overdueCount} past due</div>
          </div>

          {/* Avg Days to Pay */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 px-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0B2040]" />
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] mb-2">
              Avg Days to Pay
            </div>
            <div className="text-[26px] font-bold text-[#0B2040]">
              {stats.avgDays}
            </div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </div>
        </div>
      </div>

      {/* Filter bar + actions */}
      <div className="px-8 mt-4 flex items-center gap-4">
        {/* Status pills */}
        <div className="flex gap-2">
          {STATUS_FILTERS.map((sf) => {
            const isActive = statusFilter === sf.key;
            const count = statusCounts[sf.key] || 0;
            return (
              <button
                key={sf.key}
                onClick={() => setStatusFilter(sf.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition cursor-pointer ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50"
                }`}
                style={isActive ? { backgroundColor: sf.color } : undefined}
              >
                {sf.label}
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search filter */}
        <input
          type="text"
          value={invoiceSearch}
          onChange={(e) => setInvoiceSearch(e.target.value)}
          placeholder="Filter invoices..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-[200px] outline-none focus:border-[#1A5FAC] transition"
        />

        {/* Right side actions */}
        <div className="ml-auto flex gap-3">
          <AdminCSVExport data={csvData} filename={`invoices-${toISODate(new Date())}`} />
          <button
            onClick={openCreate}
            className="px-4.5 py-2 rounded-lg bg-[#E07B2D] text-white text-[13px] font-semibold hover:bg-[#CC6A1F] transition cursor-pointer"
          >
            + New Invoice
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="px-8 py-4">
        {/* Needs Invoice Banner */}
        <NeedsInvoiceBanner
          jobs={completedJobsNeedingInvoice}
          onCreateInvoice={openCreateFromCompletedJob}
        />

        {/* Invoice table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="text-[14px] text-gray-500">No invoices found</p>
            <button
              onClick={openCreate}
              className="mt-3 text-[14px] text-[#1A5FAC] font-semibold hover:underline cursor-pointer"
            >
              Create your first invoice
            </button>
          </div>
        ) : (
          <AdminTable>
            <AdminTableHeader
              columns={INVOICE_COLUMNS}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              gridTemplateColumns={GRID_TEMPLATE}
            />
            {filtered.map((inv) => {
              const overdueFlag = isOverdue(inv);
              const statusLabel = inv.status.charAt(0).toUpperCase() + inv.status.slice(1);
              const service = inv.lineItems[0]?.serviceName || "—";
              const vehicle = inv.vehicle || "";

              return (
                <AdminTableRow
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  isSelected={selectedInvoice?.id === inv.id}
                  gridTemplateColumns={GRID_TEMPLATE}
                >
                  {/* Invoice ID */}
                  <span className="text-[13px] text-[#1A5FAC] font-semibold whitespace-nowrap">
                    {inv.invoiceNumber}
                  </span>

                  {/* Customer */}
                  <div>
                    <div className="text-[13px] font-medium text-[#0B2040]">{inv.customerName}</div>
                    {vehicle && (
                      <div className="text-[11px] text-gray-500 mt-0.5">{vehicle}</div>
                    )}
                  </div>

                  {/* Service */}
                  <span className="text-[13px] text-[#0B2040] truncate" title={service}>
                    {service}
                  </span>

                  {/* Date */}
                  <span className="text-[13px] text-[#0B2040] text-center">
                    {formatDateAbbr(inv.invoiceDate)}
                  </span>

                  {/* Due */}
                  <span className={`text-[13px] text-center ${overdueFlag ? "text-red-600 font-semibold" : "text-[#0B2040]"}`}>
                    {formatDateAbbr(inv.dueDate)}
                  </span>

                  {/* Amount */}
                  <span className="text-[13px] font-semibold text-[#0B2040] text-center">
                    {formatCurrency(inv.total)}
                  </span>

                  {/* Status */}
                  <div className="text-center">
                    <AdminBadge
                      label={statusLabel}
                      variant={getInvoiceBadgeVariant(inv.status)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="relative flex justify-center" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === inv.id ? null : inv.id); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition"
                    >
                      <span className="text-lg text-gray-400 leading-none">&#8942;</span>
                    </button>
                    {actionMenuId === inv.id && (
                      <div className="absolute right-full top-0 mr-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-[50]" onMouseDown={(e) => e.stopPropagation()}>
                        <button onMouseDown={(e) => { e.preventDefault(); setSelectedInvoice(inv); setActionMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition">View Details</button>
                        <button onMouseDown={(e) => { e.preventDefault(); openEdit(inv); setActionMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition">Edit Invoice</button>
                        {(inv.status === "sent" || inv.status === "overdue") && (
                          <button onMouseDown={(e) => { e.preventDefault(); handleMarkPaid(inv.id); setActionMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition">Mark as Paid</button>
                        )}
                        {inv.status === "paid" && (
                          <button onMouseDown={(e) => { e.preventDefault(); handleRevertToSent(inv.id); setActionMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition">Revert to Sent</button>
                        )}
                        {(inv.status === "sent" || inv.status === "overdue") && (
                          <button onMouseDown={(e) => { e.preventDefault(); handleSendInvoice(inv); setActionMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition">Resend</button>
                        )}
                        <button onMouseDown={(e) => { e.preventDefault(); handlePrint(inv); setActionMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition">Print / PDF</button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button onMouseDown={(e) => { e.preventDefault(); if (!confirm('Delete this invoice? This cannot be undone.')) return; handleDelete(inv.id); setActionMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-gray-50 transition">Delete Invoice</button>
                      </div>
                    )}
                  </div>
                </AdminTableRow>
              );
            })}
          </AdminTable>
        )}
      </div>

      {/* Invoice Detail Panel */}
      {selectedInvoice && (
        <InvoiceDetailPanel
          invoice={toPanel(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          onMarkPaid={handleMarkPaid}
          onPrint={handlePrint}
          onSendInvoice={handleSendInvoice}
        />
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] p-6 max-w-[380px] w-full shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0B2040] mb-2">Delete Invoice?</h3>
            <p className="text-[14px] text-gray-500 mb-5">
              Are you sure you want to delete invoice {invoices.find((i) => i.id === deleteConfirm)?.invoiceNumber || ""}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-[13px] font-medium text-gray-500 bg-gray-50 rounded-[8px] hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-[13px] font-medium text-white bg-[#dc2626] rounded-[8px] hover:bg-[#b91c1c] transition cursor-pointer"
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
          <div className="bg-white rounded-[12px] w-full max-w-[720px] shadow-xl my-4 flex flex-col" style={{ maxHeight: "90vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-[18px] font-bold text-[#0B2040]">
                {editingId ? "Edit Invoice" : "New Invoice"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[22px] text-gray-500 hover:text-gray-700 leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 flex-1 overflow-y-auto">
              {/* Pre-fill note */}
              {prefillNote && (
                <div className="flex items-start gap-2 px-4 py-3 bg-[#EBF4FF] border border-[#1A5FAC]/20 rounded-[8px] text-[13px] text-[#0B2040]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A5FAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  {prefillNote}
                </div>
              )}

              {/* Invoice number + dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">
                    Invoice #
                  </label>
                  <input
                    value={form.invoiceNumber}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 text-[14px] text-gray-500 border border-gray-200 rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={form.invoiceDate}
                    onChange={(e) => setForm((p) => ({ ...p, invoiceDate: e.target.value }))}
                    className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
                  />
                </div>
              </div>

              {/* Customer */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">
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
                    className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
                  />
                  {showCustomerDropdown && (customerMatches.length > 0 || customerQuery.trim()) && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-10 max-h-[200px] overflow-y-auto">
                      {customerMatches.map((c) => (
                        <button
                          key={c.key}
                          onClick={() => selectCustomer(c)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition text-[13px] cursor-pointer"
                        >
                          <span className="font-medium text-[#0B2040]">{c.name}</span>
                          {c.phone && (
                            <span className="text-gray-500 ml-2">{formatPhone(c.phone)}</span>
                          )}
                        </button>
                      ))}
                      {customerQuery.trim() && (
                        <button
                          onClick={() => {
                            const parts = customerQuery.trim().split(/\s+/);
                            setNewCustFirst(parts[0] || "");
                            setNewCustLast(parts.slice(1).join(" ") || "");
                            setNewCustPhone("");
                            setNewCustEmail("");
                            setCreatingNewCustomer(true);
                            setShowCustomerDropdown(false);
                            setForm((p) => ({ ...p, customerName: customerQuery.trim() }));
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 cursor-pointer border-t border-gray-100 text-[13px] font-medium text-[#1A5FAC]"
                        >
                          + Create &ldquo;{customerQuery.trim()}&rdquo; as new customer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Inline new customer fields */}
              {creatingNewCustomer && (
                <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-bold text-[#1A5FAC] uppercase">New Customer</span>
                    <button
                      onClick={() => { setCreatingNewCustomer(false); setNewCustFirst(""); setNewCustLast(""); setNewCustPhone(""); setNewCustEmail(""); }}
                      className="text-[12px] text-gray-500 cursor-pointer hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">First Name *</label>
                      <input type="text" value={newCustFirst} onChange={(e) => { setNewCustFirst(e.target.value); setForm((p) => ({ ...p, customerName: `${e.target.value} ${newCustLast}`.trim() })); }} placeholder="First name" className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]" />
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">Last Name *</label>
                      <input type="text" value={newCustLast} onChange={(e) => { setNewCustLast(e.target.value); setForm((p) => ({ ...p, customerName: `${newCustFirst} ${e.target.value}`.trim() })); }} placeholder="Last name" className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">Phone</label>
                      <input type="tel" value={newCustPhone} onChange={(e) => { setNewCustPhone(e.target.value); setForm((p) => ({ ...p, customerPhone: e.target.value })); }} placeholder="(813) 555-1234" className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]" />
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">Email</label>
                      <input type="email" value={newCustEmail} onChange={(e) => { setNewCustEmail(e.target.value); setForm((p) => ({ ...p, customerEmail: e.target.value })); }} placeholder="customer@email.com" className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]" />
                    </div>
                  </div>
                </div>
              )}

              {!creatingNewCustomer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    value={form.customerPhone}
                    onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
                    placeholder="(555) 555-5555"
                    className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">
                    Email
                  </label>
                  <input
                    value={form.customerEmail}
                    onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
                    placeholder="customer@email.com"
                    className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
                  />
                </div>
              </div>
              )}

              {/* Line items */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-2">
                  Line Items
                </label>
                {/* Column headers */}
                <div className="flex items-center gap-2 mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  <div className="flex-1 min-w-0">Service</div>
                  <div className="w-[60px] text-center">Qty</div>
                  <div className="w-[90px] text-right">Price</div>
                  <div className="w-[80px] text-right">Total</div>
                  <div className="w-[28px]" />
                </div>
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
                  className="mt-3 flex items-center justify-center gap-1.5 w-full px-4 py-2 text-[13px] text-[#1A5FAC] font-semibold border-2 border-dashed border-[#1A5FAC]/30 rounded-[8px] hover:bg-[#f0f4fa] hover:border-[#1A5FAC]/50 transition cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Line Item
                </button>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-[260px] space-y-2 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">{formatCurrency(form.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Tax</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={form.taxRate}
                        onChange={(e) => updateTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-[56px] px-2 py-1 text-[13px] text-right border border-gray-200 rounded-[6px] focus:outline-none focus:border-[#1A5FAC]"
                      />
                      <span className="text-[13px] text-gray-500">%</span>
                      <span className="ml-2 font-medium">{formatCurrency(form.taxAmount)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-[#0B2040]">
                    <span className="font-bold text-[16px] text-[#0B2040]">Total</span>
                    <span className="font-bold text-[24px] text-[#0B2040]">{formatCurrency(form.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={4}
                  placeholder="Payment instructions, special notes..."
                  className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC] resize-y min-h-[80px]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-[13px] font-medium text-gray-500 bg-gray-50 rounded-[8px] hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              {editingId ? (
                <button
                  onClick={() => handleSave()}
                  disabled={saving || !form.customerName.trim()}
                  className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#1A5FAC] rounded-[8px] hover:bg-[#174f94] transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : "Update Invoice"}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleSave("draft")}
                    disabled={saving || !form.customerName.trim()}
                    className="px-5 py-2.5 text-[13px] font-semibold text-[#1A5FAC] border border-[#1A5FAC] rounded-[8px] hover:bg-[#f0f4fa] transition disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "Saving..." : "Save as Draft"}
                  </button>
                  <button
                    onClick={() => handleSave("sent")}
                    disabled={saving || !form.customerName.trim()}
                    className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#E07B2D] rounded-[8px] hover:bg-[#c96a24] transition disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "Saving..." : "Create & Send"}
                  </button>
                </>
              )}
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
  catalogItems: Service[];
  onChange: (field: keyof LineItem, value: string | number) => void;
  onSelectService: (s: Service) => void;
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
          className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
        />
        {showDrop && matches.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-20 max-h-[180px] overflow-y-auto">
            {matches.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelectService(s);
                  setServiceQuery(s.name);
                  setShowDrop(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition text-[12px] cursor-pointer"
              >
                <span className="font-medium text-[#0B2040]">{s.name}</span>
                <span className="text-gray-500 ml-2">{s.category}</span>
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
        className="w-[60px] px-2 py-2 text-[13px] text-center border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
      />

      {/* Price */}
      <div className="relative w-[90px]">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-gray-500">$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => onChange("unitPrice", parseFloat(e.target.value) || 0)}
          className="w-full pl-5 pr-2 py-2 text-[13px] text-right border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#1A5FAC]"
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
        className="py-2 px-1.5 text-[14px] text-gray-400 hover:text-white hover:bg-[#dc2626] rounded-[6px] transition disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent cursor-pointer"
        title="Remove line item"
      >
        &times;
      </button>
    </div>
  );
}
