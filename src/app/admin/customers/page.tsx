"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import ToastContainer, { type ToastItem } from "../Toast";
import {
  type Booking,
  type Customer,
  formatPhone,
  formatTimestamp,
  getStatusStyle,
  getSourceLabel,
  buildCustomerList,
  exportCustomersCsv,
} from "../shared";

export default function CustomersPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  /* Toasts */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  function addToast(message: string, type: "success" | "info" = "success") {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }
  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  /* ── Firestore real-time listener ── */
  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const customers = buildCustomerList(bookings);

  /* ── Stats ── */
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = customers.filter((c) => {
    const earliest = c.bookings[c.bookings.length - 1];
    const t = earliest?.createdAt?.toDate?.()?.getTime();
    return t && t >= monthStart.getTime();
  }).length;
  const repeatCustomers = customers.filter((c) => c.totalBookings > 1).length;

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
        <Link href="/admin" className="hover:text-[#1A5FAC] transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-[#0B2040] font-semibold">Customers</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-[#0B2040]">Customers</h1>
        <button
          onClick={() => exportCustomersCsv(bookings)}
          className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold border border-[#e8e8e8] rounded-lg text-[#444] bg-white hover:bg-[#f5f5f5] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* ═══ Customer Stats ═══ */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Customers", value: customers.length, icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A5FAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )},
          { label: "New This Month", value: newThisMonth, icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          )},
          { label: "Repeat Customers", value: repeatCustomers, icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E07B2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          )},
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#e8e8e8] rounded-[12px] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#f5f7fa] flex items-center justify-center shrink-0">
              {s.icon}
            </div>
            <div>
              <p className="text-[24px] font-bold text-[#0B2040] leading-none">{s.value}</p>
              <p className="text-[12px] text-[#888] mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <CustomersView customers={customers} bookings={bookings} addToast={addToast} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

/* ─── Customers View ─────────────────────────────────────── */

function CustomersView({
  customers,
  bookings,
  addToast,
}: {
  customers: Customer[];
  bookings: Booking[];
  addToast: (message: string, type?: "success" | "info") => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Record<string, { name: string; phone: string; email: string; address: string }>>({});
  const [savingCustomer, setSavingCustomer] = useState<string | null>(null);

  /* New Customer modal */
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", notes: "" });
  const [savingNewCustomer, setSavingNewCustomer] = useState(false);

  async function handleAddCustomer() {
    if (!newCustomer.name.trim()) return;
    setSavingNewCustomer(true);
    try {
      await addDoc(collection(db, "bookings"), {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.replace(/\D/g, "") || null,
        email: newCustomer.email.trim().toLowerCase() || null,
        notes: newCustomer.notes.trim() || null,
        source: "admin-manual",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addToast(`Customer "${newCustomer.name.trim()}" added`);
      setNewCustomer({ name: "", phone: "", email: "", notes: "" });
      setShowNewCustomer(false);
    } catch {
      addToast("Failed to add customer", "info");
    } finally {
      setSavingNewCustomer(false);
    }
  }

  const filtered = search.trim()
    ? customers.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.phone && formatPhone(c.phone).includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
        );
      })
    : customers;

  async function handleSaveCustomer(customer: Customer) {
    const edit = editingCustomer[customer.key];
    if (!edit) return;
    setSavingCustomer(customer.key);
    try {
      await Promise.all(
        customer.bookings.map((b) =>
          updateDoc(doc(db, "bookings", b.id), {
            name: edit.name.trim() || undefined,
            phone: edit.phone.replace(/\D/g, "") || undefined,
            email: edit.email.trim().toLowerCase() || undefined,
            address: edit.address.trim() || undefined,
            updatedAt: serverTimestamp(),
          })
        )
      );
      addToast(`Updated ${customer.bookings.length} booking(s) for ${edit.name || customer.name}`);
    } catch {
      addToast("Failed to update customer info", "info");
    } finally {
      setSavingCustomer(null);
    }
  }

  function getCombinedCommsLog(customer: Customer) {
    const all: Array<{ id: string; type: string; direction: string; summary: string; createdAt: string; createdBy: string; bookingService?: string }> = [];
    customer.bookings.forEach((b) => {
      (b.commsLog || []).forEach((entry) => {
        all.push({ ...entry, bookingService: b.service || b.name || b.id });
      });
    });
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    <>
    <div className="bg-white border border-[#e8e8e8] rounded-[12px] overflow-hidden">
      {/* Search + New Customer */}
      <div className="p-4 border-b border-[#eee] flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-[14px] rounded-[8px] px-4 py-2.5 border border-[#ddd] outline-none focus:border-[#1A5FAC] transition-colors"
        />
        <button
          onClick={() => setShowNewCustomer(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#E07B2D] rounded-lg hover:bg-[#CC6A1F] transition-colors whitespace-nowrap"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Customer
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#eee]">
              {["Name", "Phone", "Email", "Bookings", "Last Booking", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[14px] text-[#888]">
                  {search ? "No customers match your search" : "No customers yet"}
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const isExpanded = expandedCustomer === c.key;
                const status = getStatusStyle(c.lastBookingStatus);
                return (
                  <Fragment key={c.key}>
                    <tr
                      onClick={() => setExpandedCustomer(isExpanded ? null : c.key)}
                      className={`border-b border-[#f0f0f0] cursor-pointer transition-colors ${isExpanded ? "bg-[#FAFBFC]" : "hover:bg-[#FAFBFC]"}`}
                    >
                      <td className="px-4 py-3 text-[14px] font-semibold text-[#0B2040] whitespace-nowrap">{c.name}</td>
                      <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                        {c.phone ? (
                          <a href={`tel:${c.phone}`} className="text-[#1A5FAC] hover:underline" onClick={(e) => e.stopPropagation()}>
                            {formatPhone(c.phone)}
                          </a>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#444] whitespace-nowrap">{c.email || "-"}</td>
                      <td className="px-4 py-3 text-[14px] font-semibold text-[#0B2040]">{c.totalBookings}</td>
                      <td className="px-4 py-3 text-[13px] text-[#444] whitespace-nowrap">{c.lastBookingDate}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${status.cls}`}>{status.label}</span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <CustomerExpanded
                            customer={c}
                            editingCustomer={editingCustomer}
                            savingCustomer={savingCustomer}
                            onEditChange={(val) => setEditingCustomer((p) => ({ ...p, [c.key]: val }))}
                            onSave={() => handleSaveCustomer(c)}
                            commsLog={getCombinedCommsLog(c)}
                            onCreateInvoice={() => {
                              const params = new URLSearchParams({
                                from: "customer",
                                name: c.name === "\u2014" ? "" : c.name,
                                phone: c.phone || "",
                                email: c.email || "",
                              });
                              router.push(`/admin/invoicing?${params.toString()}`);
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* ═══ New Customer Modal ═══ */}
    {showNewCustomer && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-[14px] shadow-xl max-w-[440px] w-full mx-4 p-6">
          <h3 className="text-[18px] font-bold text-[#0B2040] mb-4">New Customer</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1">
                Name <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
                className="w-full text-[14px] rounded-[8px] px-3 py-2.5 border border-[#ddd] outline-none focus:border-[#1A5FAC] transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                placeholder="(813) 555-1234"
                className="w-full text-[14px] rounded-[8px] px-3 py-2.5 border border-[#ddd] outline-none focus:border-[#1A5FAC] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1">
                Email
              </label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                placeholder="customer@email.com"
                className="w-full text-[14px] rounded-[8px] px-3 py-2.5 border border-[#ddd] outline-none focus:border-[#1A5FAC] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1">
                Notes
              </label>
              <textarea
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Vehicle info, preferences, etc."
                rows={3}
                className="w-full text-[14px] rounded-[8px] px-3 py-2.5 border border-[#ddd] outline-none focus:border-[#1A5FAC] transition-colors resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-5">
            <button
              onClick={() => {
                setShowNewCustomer(false);
                setNewCustomer({ name: "", phone: "", email: "", notes: "" });
              }}
              className="px-4 py-2.5 text-[13px] font-semibold text-[#444] border border-[#ddd] rounded-md hover:bg-[#f5f5f5] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCustomer}
              disabled={!newCustomer.name.trim() || savingNewCustomer}
              className="px-4 py-2.5 text-[13px] font-semibold text-white bg-[#E07B2D] rounded-md hover:bg-[#CC6A1F] transition-colors disabled:opacity-50"
            >
              {savingNewCustomer ? "Adding..." : "Add Customer"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function CustomerExpanded({
  customer,
  editingCustomer,
  savingCustomer,
  onEditChange,
  onSave,
  commsLog,
  onCreateInvoice,
}: {
  customer: Customer;
  editingCustomer: Record<string, { name: string; phone: string; email: string; address: string }>;
  savingCustomer: string | null;
  onEditChange: (val: { name: string; phone: string; email: string; address: string }) => void;
  onSave: () => void;
  commsLog: Array<{ id: string; type: string; direction: string; summary: string; createdAt: string; bookingService?: string }>;
  onCreateInvoice: () => void;
}) {
  const edit = editingCustomer[customer.key] || {
    name: customer.name === "-" ? "" : customer.name,
    phone: customer.phone ? formatPhone(customer.phone) : "",
    email: customer.email || "",
    address: customer.address || "",
  };

  const typeLabels: Record<string, string> = { call: "Call", text: "Text", email: "Email", note: "Note" };
  const typeColors: Record<string, string> = { call: "bg-[#E07B2D]", text: "bg-[#16a34a]", email: "bg-[#1A5FAC]", note: "bg-[#888]" };

  return (
    <div className="bg-[#FAFBFC] border-t border-[#eee] px-6 py-5">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Editable Customer Info */}
        <div className="w-full md:w-1/3 shrink-0">
          <div className="bg-white border border-[#e8e8e8] rounded-[10px] p-4">
            <h4 className="text-[14px] font-bold text-[#0B2040] mb-3 pb-2 border-b border-[#eee]">Edit Customer</h4>
            {(["name", "phone", "email", "address"] as const).map((field) => (
              <div key={field} className="mb-3">
                <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1">
                  {field}
                </label>
                <input
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                  value={edit[field]}
                  onChange={(e) => onEditChange({ ...edit, [field]: e.target.value })}
                  className="w-full text-[13px] rounded-[6px] px-3 py-1.5 border border-[#ddd] outline-none focus:border-[#1A5FAC] transition-colors"
                />
              </div>
            ))}
            <button
              onClick={onSave}
              disabled={savingCustomer === customer.key}
              className="w-full mt-1 px-4 py-2 text-[13px] font-semibold text-white bg-[#0B2040] rounded-md hover:bg-[#132E54] transition-colors disabled:opacity-50"
            >
              {savingCustomer === customer.key ? "Saving..." : `Save (updates ${customer.totalBookings} booking${customer.totalBookings !== 1 ? "s" : ""})`}
            </button>
            <button
              onClick={onCreateInvoice}
              className="w-full mt-2 px-4 py-2 text-[13px] font-semibold text-white bg-[#1A5FAC] rounded-md hover:bg-[#174f94] transition-colors inline-flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Create Invoice
            </button>
          </div>
        </div>

        {/* Bookings + Comms Log */}
        <div className="w-full md:w-2/3">
          {/* All Bookings */}
          <h4 className="text-[14px] font-bold text-[#0B2040] mb-3">All Bookings</h4>
          <div className="flex flex-col gap-2 mb-6">
            {customer.bookings.map((b) => {
              const st = getStatusStyle(b.status);
              const src = getSourceLabel(b.source);
              return (
                <div key={b.id} className="flex items-center justify-between bg-white border border-[#e8e8e8] rounded-[8px] px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0B2040]">{b.service || "-"}</p>
                    <p className="text-[12px] text-[#888]">{formatTimestamp(b.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${src.color}`}>{src.label}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Combined Communication Log */}
          <h4 className="text-[14px] font-bold text-[#0B2040] mb-3">Communication History</h4>
          {commsLog.length === 0 ? (
            <p className="text-[13px] text-[#888] italic">No communication logged</p>
          ) : (
            <div className="flex flex-col gap-1">
              {commsLog.map((entry, i) => {
                const date = new Date(entry.createdAt);
                return (
                  <div key={`${entry.id}-${i}`} className="flex items-center gap-3 py-2 border-b border-[#f0f0f0] last:border-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${typeColors[entry.type] || "bg-[#888]"}`}>
                      {typeLabels[entry.type] || entry.type}
                    </span>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#444] bg-[#f0f0f0]">
                      {entry.direction.charAt(0).toUpperCase() + entry.direction.slice(1)}
                    </span>
                    <span className="text-[13px] text-[#444] flex-1">{entry.summary}</span>
                    <span className="text-[12px] text-[#888] whitespace-nowrap">
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })},{" "}
                      {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
