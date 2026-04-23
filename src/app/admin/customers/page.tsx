"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  writeBatch,
  doc,
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
import { useAdminModal } from "@/contexts/AdminModalContext";
import { findDuplicates, type DuplicateGroup } from "@/lib/customerDedup";
import CustomerMergeModal from "@/components/admin/CustomerMergeModal";
import { formatCurrency } from "@/lib/formatCurrency";

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
  isTest?: boolean;
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
  isTestCustomer: boolean;
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
  { key: "actions", label: "", align: "center", sortable: false },
];

const GRID = "2fr 1.5fr 1fr 1fr 1fr 100px 40px";

/* ── DNC Badge ── */

function DNCBadge({ bookings }: { bookings: Booking[] }) {
  if (!bookings[0]) return null;
  const prefs = (bookings[0] as unknown as Record<string, unknown>).communicationPreferences as { doNotCall?: boolean; doNotText?: boolean; doNotEmail?: boolean } | undefined;
  if (!prefs?.doNotCall && !prefs?.doNotText && !prefs?.doNotEmail) return null;
  return <span className="text-[10px] font-bold text-red-500">DNC</span>;
}

/* ── Page ── */

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showTest = searchParams.get("showTest") === "1";
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
  const [initialEditMode, setInitialEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedCustomer | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
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

  /* Action menu */
  const { openModal } = useAdminModal();
  const [actionMenuKey, setActionMenuKey] = useState<string | null>(null);

  /* Close action menu on outside click */
  useEffect(() => {
    if (!actionMenuKey) return;
    function handleClick() { setActionMenuKey(null); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [actionMenuKey]);

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

  /* ── Build enriched customers (filter out deleted, respect test visibility) ── */
  const enrichedCustomers = useMemo(() => {
    const nonDeletedBookings = bookings.filter(
      (b) => !(b as unknown as Record<string, unknown>).customerDeleted,
    );
    const scopedBookings = showTest
      ? nonDeletedBookings
      : nonDeletedBookings.filter((b) => b.isTest !== true);
    const scopedInvoices = showTest
      ? invoices
      : invoices.filter((i) => i.isTest !== true);
    const baseCustomers = buildCustomerList(scopedBookings);
    return baseCustomers.map((c) => {
      const matched = matchInvoicesToCustomer(c, scopedInvoices);
      // TODO: Add "type" field (Residential/Commercial) to customer documents
      const type = "Residential";
      const customerStatus = deriveCustomerStatus(c.bookings);
      const totalSpent = getCustomerTotalSpent(matched, c.bookings);
      const jobCount = c.totalBookings;
      const lastVisit = getLastVisit(c.bookings);
      const customerSince = getCustomerSince(c.bookings);
      const primaryVehicle = getPrimaryVehicle(c.bookings);
      const isTestCustomer =
        c.bookings.length > 0 && c.bookings.every((b) => b.isTest === true);

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
        isTestCustomer,
      } as EnrichedCustomer;
    });
  }, [bookings, invoices, showTest]);

  /* ── Test data count (for toggle label) ── */
  const testCustomerCount = useMemo(() => {
    const nonDeleted = bookings.filter(
      (b) => !(b as unknown as Record<string, unknown>).customerDeleted,
    );
    const testOnly = nonDeleted.filter((b) => b.isTest === true);
    const derived = buildCustomerList(testOnly);
    return derived.length;
  }, [bookings]);

  /* ── Duplicate detection ── */
  const duplicateGroups = useMemo(
    () => findDuplicates(enrichedCustomers),
    [enrichedCustomers],
  );
  const [dupExpanded, setDupExpanded] = useState(false);
  const [mergeGroup, setMergeGroup] = useState<DuplicateGroup | null>(null);

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
    if (!newCustomer.firstName.trim() || !newCustomer.lastName.trim()) return;
    setSavingNewCustomer(true);
    const fullName = `${newCustomer.firstName.trim()} ${newCustomer.lastName.trim()}`;
    try {
      await addDoc(collection(db, "bookings"), {
        name: fullName,
        firstName: newCustomer.firstName.trim(),
        lastName: newCustomer.lastName.trim(),
        fullName,
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
      addToast(`Customer "${fullName}" added`);
      setNewCustomer({
        firstName: "",
        lastName: "",
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
        "Total Spent": formatCurrency(c.totalSpent),
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
        onSearchChange={setSearch}
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
          {testCustomerCount > 0 && (
            <button
              onClick={() => {
                const p = new URLSearchParams(searchParams.toString());
                if (showTest) p.delete("showTest"); else p.set("showTest", "1");
                const qs = p.toString();
                router.replace(qs ? `/admin/customers?${qs}` : "/admin/customers", { scroll: false });
              }}
              className="text-xs text-gray-500 hover:text-[#0B2040] cursor-pointer underline-offset-2 hover:underline"
            >
              {showTest ? `Hide test data (${testCustomerCount})` : `Show test data (${testCustomerCount})`}
            </button>
          )}
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

      {/* ═══ Possible Duplicates Banner ═══ */}
      {duplicateGroups.length > 0 && (
        <div className="px-8 pt-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <button
              onClick={() => setDupExpanded(!dupExpanded)}
              className="w-full bg-blue-50 px-5 py-3.5 flex justify-between items-center cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span className="text-sm font-semibold text-blue-800">
                  {duplicateGroups.length} possible duplicate customer{duplicateGroups.length !== 1 ? "s" : ""} found
                </span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-blue-600 transition-transform duration-200 ${dupExpanded ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dupExpanded && (
              <div>
                {duplicateGroups.map((group, gi) => (
                  <div key={gi}>
                    <div className="px-5 py-2 bg-gray-50 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        Matched by {group.matchType}: {group.matchValue}
                      </span>
                    </div>
                    {group.customers.map((c) => {
                      const initials = getInitials(c.name);
                      return (
                        <div
                          key={c.key}
                          className="flex items-center gap-3 px-5 py-3 border-b border-gray-200"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 bg-[#0B2040]">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-[#0B2040] truncate">{c.name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {c.phone ? formatPhone(c.phone) : "—"} &middot; {c.email || "—"}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 text-right shrink-0">
                            <div>{formatCurrency((c as EnrichedCustomer).totalSpent ?? 0)}</div>
                            <div>{c.totalBookings} job{c.totalBookings !== 1 ? "s" : ""}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="px-5 py-2.5 flex justify-end border-b border-gray-200 last:border-b-0">
                      <button
                        onClick={() => setMergeGroup(group)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-blue-700 transition"
                      >
                        Merge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                      <div className="text-sm font-semibold text-[#0B2040] truncate flex items-center gap-1.5">
                        {c.name}
                        <DNCBadge bookings={c.bookings} />
                        {c.isTestCustomer && (
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide rounded-sm bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5">
                            TEST
                          </span>
                        )}
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
                    {formatCurrency(c.totalSpent)}
                  </div>

                  {/* Jobs */}
                  <div className="text-center text-sm text-[#0B2040]">{c.jobCount}</div>

                  {/* Status */}
                  <div className="text-center">
                    <AdminBadge label={c.customerStatus} variant={statusVariant} />
                  </div>

                  {/* Actions */}
                  <div className="relative flex justify-center" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActionMenuKey(actionMenuKey === c.key ? null : c.key); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition"
                    >
                      <span className="text-lg text-gray-400 leading-none">&#8942;</span>
                    </button>
                    {actionMenuKey === c.key && (
                      <div className="absolute right-full top-0 mr-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-[50]" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setInitialEditMode(false);
                            setSelectedCustomer(c);
                            setActionMenuKey(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                        >
                          View Profile
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setInitialEditMode(true);
                            setSelectedCustomer(c);
                            setActionMenuKey(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                        >
                          Edit Customer
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            openModal("booking", { customer: { name: c.name, phone: c.phone, email: c.email, address: c.address } });
                            setActionMenuKey(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                        >
                          New Booking
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            openModal("invoice", { customer: { name: c.name, phone: c.phone, email: c.email, address: c.address } });
                            setActionMenuKey(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                        >
                          New Invoice
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setDeleteTarget(c);
                            setShowDeleteConfirm(true);
                            setActionMenuKey(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-gray-50 transition"
                        >
                          Delete Customer
                        </button>
                      </div>
                    )}
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
            communicationPreferences: (selectedCustomer.bookings[0] as unknown as Record<string, unknown>)?.communicationPreferences as { doNotCall: boolean; doNotText: boolean; doNotEmail: boolean; optOutDate?: string | null; optOutReason?: string | null } | undefined,
          }}
          bookings={selectedCustomer.bookings}
          invoices={selectedCustomer.matchedInvoices}
          onClose={() => { setSelectedCustomer(null); setInitialEditMode(false); }}
          onDelete={() => { setSelectedCustomer(null); setInitialEditMode(false); }}
          duplicateGroups={duplicateGroups}
          onMerge={(group) => { setSelectedCustomer(null); setMergeGroup(group); }}
          initialEditMode={initialEditMode}
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
                    firstName: "",
                    lastName: "",
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="First name"
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="Last name"
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors"
                  />
                </div>
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
                    firstName: "",
                    lastName: "",
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
                disabled={!newCustomer.firstName.trim() || !newCustomer.lastName.trim() || savingNewCustomer}
                className="px-5 py-2.5 bg-[#E07B2D] rounded-lg text-sm font-semibold text-white cursor-pointer hover:bg-[#CC6A1F] transition disabled:opacity-50"
              >
                {savingNewCustomer ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ═══ Delete Confirmation Modal ═══ */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black/30 z-[80] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-[400px] mx-4 p-6">
            <h3 className="text-lg font-bold text-[#0B2040]">Delete Customer</h3>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will
              permanently remove their profile. Bookings and invoices linked to this customer
              will NOT be deleted.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const batch = writeBatch(db);
                    deleteTarget.bookings.forEach((b) => {
                      batch.update(doc(db, "bookings", b.id), {
                        customerDeleted: true,
                        updatedAt: serverTimestamp(),
                      });
                    });
                    await batch.commit();
                    addToast(`"${deleteTarget.name}" deleted`);
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                    setSelectedCustomer(null);
                  } catch {
                    addToast("Failed to delete customer", "info");
                  }
                }}
                className="flex-1 bg-red-600 rounded-lg py-2.5 text-sm font-semibold text-white cursor-pointer hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Merge Modal ═══ */}
      {mergeGroup && (
        <CustomerMergeModal
          group={mergeGroup}
          allBookings={bookings}
          allInvoices={invoices}
          onClose={() => setMergeGroup(null)}
          onMerged={() => {
            setMergeGroup(null);
            addToast("Customers merged successfully");
          }}
        />
      )}
    </>
  );
}
