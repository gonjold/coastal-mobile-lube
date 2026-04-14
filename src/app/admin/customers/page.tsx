"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import ToastContainer, { type ToastItem } from "../Toast";
import {
  type Booking,
  type Customer,
  formatPhone,
  buildCustomerList,
} from "../shared";
import AdminTopBar from "@/components/admin/AdminTopBar";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableRow,
  type AdminColumn,
} from "@/components/admin/AdminTable";
import AdminCSVExport from "@/components/admin/AdminCSVExport";
import AdminBadge from "@/components/admin/AdminBadge";
import CustomerProfilePanel, {
  type PanelInvoice,
} from "@/components/admin/CustomerProfilePanel";

/* ── Types ── */

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  total: number;
  status: string;
  invoiceDate: string;
  createdAt?: { toDate: () => Date };
}

interface EnrichedCustomer extends Customer {
  type: string;
  customerStatus: string;
  totalSpent: number;
  jobCount: number;
  lastVisit: string;
  customerSince: string;
  primaryVehicle: string;
  matchedInvoices: PanelInvoice[];
}

/* ── Helpers ── */

function getVehicleName(b: Booking): string {
  return (
    [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") ||
    [b.vesselYear, b.vesselMake, b.vesselModel].filter(Boolean).join(" ") ||
    ""
  );
}

function getPrimaryVehicle(bookings: Booking[]): string {
  const counts = new Map<string, number>();
  bookings.forEach((b) => {
    const v = getVehicleName(b);
    if (v) counts.set(v, (counts.get(v) || 0) + 1);
  });
  let best = "";
  let bestCount = 0;
  counts.forEach((count, name) => {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  });
  return best;
}

function deriveCustomerStatus(bookings: Booking[]): "Active" | "Lead" | "Inactive" {
  const latest = bookings[0];
  if (!latest) return "Inactive";
  if (latest.status === "pending" || latest.status === "new-lead") return "Lead";
  if (
    latest.status === "confirmed" ||
    latest.status === "in-progress" ||
    latest.status === "completed" ||
    latest.status === "invoiced"
  )
    return "Active";
  if (latest.status === "cancelled") {
    return bookings.some((b) => b.status !== "cancelled") ? "Active" : "Inactive";
  }
  return "Inactive";
}

function getCustomerTotalSpent(invoices: PanelInvoice[], bookings: Booking[]): number {
  if (invoices.length > 0) {
    return invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + (i.total || 0), 0);
  }
  return bookings
    .filter((b) => b.status === "completed" || b.status === "invoiced")
    .reduce(
      (sum, b) =>
        sum + (b.selectedServices?.reduce((s, svc) => s + (svc.price || 0), 0) || 0),
      0,
    );
}

function getLastVisit(bookings: Booking[]): string {
  const completed = bookings.find(
    (b) => b.status === "completed" || b.status === "invoiced",
  );
  if (completed?.createdAt?.toDate) {
    return completed.createdAt
      .toDate()
      .toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return "Not yet";
}

function getCustomerSince(bookings: Booking[]): string {
  const oldest = bookings[bookings.length - 1];
  if (oldest?.createdAt?.toDate) {
    return oldest.createdAt
      .toDate()
      .toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return "—";
}

function matchInvoicesToCustomer(
  customer: Customer,
  allInvoices: Invoice[],
): PanelInvoice[] {
  const phone = customer.phone?.replace(/\D/g, "");
  const email = customer.email?.toLowerCase();
  const name = customer.name?.toLowerCase();

  return allInvoices
    .filter((inv) => {
      if (phone && inv.customerPhone?.replace(/\D/g, "") === phone) return true;
      if (email && inv.customerEmail?.toLowerCase() === email) return true;
      if (name && name !== "-" && name !== "—" && inv.customerName?.toLowerCase() === name)
        return true;
      return false;
    })
    .map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      total: inv.total,
      status: inv.status,
      invoiceDate: inv.invoiceDate,
      createdAt: inv.createdAt,
    }));
}

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

/* ── Table config ── */

const COLUMNS: AdminColumn[] = [
  { key: "customer", label: "Customer", align: "left", sortable: true },
  { key: "contact", label: "Contact", align: "left", sortable: true },
  { key: "type", label: "Type", align: "center", sortable: true },
  { key: "totalSpent", label: "Total Spent", align: "center", sortable: true },
  { key: "jobs", label: "Jobs", align: "center", sortable: true },
  { key: "status", label: "Status", align: "center", sortable: true },
];

const GRID = "2fr 1.5fr 1fr 1fr 1fr 100px";

/* ── Page ── */

export default function CustomersPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filters & search */
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Residential" | "Commercial">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Lead" | "Inactive">(
    "All",
  );

  /* Sort */
  const [sortKey, setSortKey] = useState("customer");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  /* Panel & modal */
  const [selectedCustomer, setSelectedCustomer] = useState<EnrichedCustomer | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    type: "Residential",
    vehicle: "",
    notes: "",
  });
  const [savingNewCustomer, setSavingNewCustomer] = useState(false);

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

  /* ── Firestore real-time listeners ── */
  useEffect(() => {
    const qBookings = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsub1 = onSnapshot(
      qBookings,
      (snap) => {
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
        setLoading(false);
      },
      () => setLoading(false),
    );

    const qInvoices = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(qInvoices, (snap) => {
      setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  /* ── Build enriched customers (filter out deleted) ── */
  const enrichedCustomers = useMemo(() => {
    const nonDeletedBookings = bookings.filter(
      (b) => !(b as unknown as Record<string, unknown>).customerDeleted,
    );
    const baseCustomers = buildCustomerList(nonDeletedBookings);
    return baseCustomers.map((c) => {
      const matched = matchInvoicesToCustomer(c, invoices);
      // TODO: Add "type" field (Residential/Commercial) to customer documents
      const type = "Residential";
      const customerStatus = deriveCustomerStatus(c.bookings);
      const totalSpent = getCustomerTotalSpent(matched, c.bookings);
      const jobCount = c.totalBookings;
      const lastVisit = getLastVisit(c.bookings);
      const customerSince = getCustomerSince(c.bookings);
      const primaryVehicle = getPrimaryVehicle(c.bookings);

      return {
        ...c,
        type,
        customerStatus,
        totalSpent,
        jobCount,
        lastVisit,
        customerSince,
        primaryVehicle,
        matchedInvoices: matched,
      } as EnrichedCustomer;
    });
  }, [bookings, invoices]);

  /* ── Filter + search + sort ── */
  const filteredCustomers = useMemo(() => {
    let list = enrichedCustomers;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && formatPhone(c.phone).includes(q)) ||
          (c.phone && c.phone.includes(q)),
      );
    }

    if (typeFilter !== "All") {
      list = list.filter((c) => c.type === typeFilter);
    }
    if (statusFilter !== "All") {
      list = list.filter((c) => c.customerStatus === statusFilter);
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "customer":
          cmp = a.name.localeCompare(b.name);
          break;
        case "contact":
          cmp = (a.phone || "").localeCompare(b.phone || "");
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "totalSpent":
          cmp = a.totalSpent - b.totalSpent;
          break;
        case "jobs":
          cmp = a.jobCount - b.jobCount;
          break;
        case "status":
          cmp = a.customerStatus.localeCompare(b.customerStatus);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [enrichedCustomers, search, typeFilter, statusFilter, sortKey, sortDir]);

  /* ── Counts for badge pills ── */
  const typeCounts = useMemo(
    () => ({
      All: enrichedCustomers.length,
      Residential: enrichedCustomers.filter((c) => c.type === "Residential").length,
      Commercial: enrichedCustomers.filter((c) => c.type === "Commercial").length,
    }),
    [enrichedCustomers],
  );

  const statusCounts = useMemo(
    () => ({
      Active: enrichedCustomers.filter((c) => c.customerStatus === "Active").length,
      Lead: enrichedCustomers.filter((c) => c.customerStatus === "Lead").length,
      Inactive: enrichedCustomers.filter((c) => c.customerStatus === "Inactive").length,
    }),
    [enrichedCustomers],
  );

  /* ── Sort handler ── */
  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  /* ── Add customer ── */
  async function handleAddCustomer() {
    if (!newCustomer.name.trim()) return;
    setSavingNewCustomer(true);
    try {
      await addDoc(collection(db, "bookings"), {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.replace(/\D/g, "") || null,
        email: newCustomer.email.trim().toLowerCase() || null,
        address: newCustomer.address.trim() || null,
        vehicleMake: newCustomer.vehicle.trim() || null,
        notes: newCustomer.notes.trim() || null,
        source: "admin-manual",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addToast(`Customer "${newCustomer.name.trim()}" added`);
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        address: "",
        type: "Residential",
        vehicle: "",
        notes: "",
      });
      setShowNewCustomer(false);
    } catch {
      addToast("Failed to add customer", "info");
    } finally {
      setSavingNewCustomer(false);
    }
  }

  /* ── CSV data ── */
  const csvData = useMemo(
    () =>
      filteredCustomers.map((c) => ({
        Name: c.name,
        Phone: c.phone || "",
        Email: c.email || "",
        Type: c.type,
        "Total Spent": `$${c.totalSpent}`,
        Jobs: c.jobCount,
        Status: c.customerStatus,
      })),
    [filteredCustomers],
  );

  /* ── Loading state ── */
  if (loading) {
    return (
      <>
        <AdminTopBar title="Customers" />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Top bar with working search */}
      <AdminTopBar
        title="Customers"
        subtitle={`${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? "s" : ""}`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, phone, or email..."
      />

      {/* ═══ Filter bar ═══ */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center gap-4">
        {/* Type pills */}
        <div className="flex items-center gap-1">
          {(["All", "Residential", "Commercial"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md text-[13px] cursor-pointer transition flex items-center gap-1.5 ${
                typeFilter === t
                  ? "bg-[#0B2040] text-white font-semibold"
                  : "bg-transparent text-gray-500"
              }`}
            >
              {t}
              <span
                className={`text-[11px] px-1.5 py-px rounded ${
                  typeFilter === t ? "bg-white/20" : "bg-gray-100"
                }`}
              >
                {typeCounts[t]}
              </span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Status pills */}
        <div className="flex items-center gap-1">
          {(["Active", "Lead", "Inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}
              className={`px-3 py-1.5 rounded-md text-[13px] cursor-pointer transition ${
                statusFilter === s
                  ? "bg-gray-50 text-[#0B2040] font-semibold"
                  : "bg-transparent text-gray-500"
              }`}
            >
              {s}
              <span className="ml-1.5 text-[11px] px-1.5 py-px rounded bg-gray-100">
                {statusCounts[s]}
              </span>
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <AdminCSVExport
            data={csvData}
            filename={`customers-${new Date().toISOString().split("T")[0]}`}
          />
          <button
            onClick={() => setShowNewCustomer(true)}
            className="px-4.5 py-2 rounded-lg bg-[#E07B2D] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#CC6A1F] transition"
          >
            + Add Customer
          </button>
        </div>
      </div>

      {/* ═══ Customer table ═══ */}
      <div className="px-8 py-6">
        <AdminTable>
          <AdminTableHeader
            columns={COLUMNS}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            gridTemplateColumns={GRID}
          />

          {filteredCustomers.length === 0 ? (
            <div className="px-5 py-12 text-center text-[14px] text-gray-500">
              {search || typeFilter !== "All" || statusFilter !== "All"
                ? "No customers match your filters"
                : "No customers yet"}
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const initials = getInitials(c.name);
              const isCommercial = c.type === "Commercial";
              const avatarBg = isCommercial ? "bg-[#1A5FAC]" : "bg-[#0B2040]";
              const statusVariant: "green" | "amber" | "gray" =
                c.customerStatus === "Active"
                  ? "green"
                  : c.customerStatus === "Lead"
                    ? "amber"
                    : "gray";
              const typeVariant: "blue" | "gray" = isCommercial ? "blue" : "gray";

              return (
                <AdminTableRow
                  key={c.key}
                  onClick={() => setSelectedCustomer(c)}
                  isSelected={selectedCustomer?.key === c.key}
                  gridTemplateColumns={GRID}
                >
                  {/* Customer */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarBg}`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#0B2040] truncate">
                        {c.name}
                      </div>
                      {c.primaryVehicle && (
                        <div className="text-xs text-gray-500 truncate">
                          {c.primaryVehicle}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="min-w-0">
                    <div className="text-[13px] text-[#0B2040] truncate">
                      {c.phone ? formatPhone(c.phone) : "—"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{c.email || "—"}</div>
                  </div>

                  {/* Type */}
                  <div className="text-center">
                    <AdminBadge label={c.type} variant={typeVariant} />
                  </div>

                  {/* Total Spent */}
                  <div className="text-center text-sm font-semibold text-[#0B2040]">
                    ${c.totalSpent.toLocaleString()}
                  </div>

                  {/* Jobs */}
                  <div className="text-center text-sm text-[#0B2040]">{c.jobCount}</div>

                  {/* Status */}
                  <div className="text-center">
                    <AdminBadge label={c.customerStatus} variant={statusVariant} />
                  </div>
                </AdminTableRow>
              );
            })
          )}
        </AdminTable>
      </div>

      {/* ═══ Customer Profile Panel ═══ */}
      {selectedCustomer && (
        <CustomerProfilePanel
          customer={{
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
            email: selectedCustomer.email,
            address: selectedCustomer.address,
            type: selectedCustomer.type,
            status: selectedCustomer.customerStatus,
            totalSpent: selectedCustomer.totalSpent,
            jobCount: selectedCustomer.jobCount,
            lastVisit: selectedCustomer.lastVisit,
            customerSince: selectedCustomer.customerSince,
            notes:
              selectedCustomer.bookings[0]?.notes ||
              selectedCustomer.bookings[0]?.adminNotes,
          }}
          bookings={selectedCustomer.bookings}
          invoices={selectedCustomer.matchedInvoices}
          onClose={() => setSelectedCustomer(null)}
          onDelete={() => setSelectedCustomer(null)}
        />
      )}

      {/* ═══ New Customer Modal ═══ */}
      {showNewCustomer && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-[480px] max-h-[90vh] overflow-y-auto mx-4">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0B2040]">New Customer</h3>
              <button
                onClick={() => {
                  setShowNewCustomer(false);
                  setNewCustomer({
                    name: "",
                    phone: "",
                    email: "",
                    address: "",
                    type: "Residential",
                    vehicle: "",
                    notes: "",
                  });
                }}
                className="text-xl text-gray-500 cursor-pointer hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="(813) 555-1234"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="customer@email.com"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="Street address"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Type
                </label>
                <select
                  value={newCustomer.type}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, type: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors bg-white"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Vehicle
                </label>
                <input
                  type="text"
                  value={newCustomer.vehicle}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, vehicle: e.target.value }))
                  }
                  placeholder="Year Make Model"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Notes
                </label>
                <textarea
                  value={newCustomer.notes}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewCustomer(false);
                  setNewCustomer({
                    name: "",
                    phone: "",
                    email: "",
                    address: "",
                    type: "Residential",
                    vehicle: "",
                    notes: "",
                  });
                }}
                className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={!newCustomer.name.trim() || savingNewCustomer}
                className="px-5 py-2.5 bg-[#E07B2D] rounded-lg text-sm font-semibold text-white cursor-pointer hover:bg-[#CC6A1F] transition disabled:opacity-50"
              >
                {savingNewCustomer ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
