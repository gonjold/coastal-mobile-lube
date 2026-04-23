"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminBadge from "@/components/admin/AdminBadge";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableRow,
} from "@/components/admin/AdminTable";
import ScheduleDetailPanel from "@/components/admin/ScheduleDetailPanel";
import ScheduleCalendar from "@/components/admin/ScheduleCalendar";
import ToastContainer, { type ToastItem } from "../Toast";
import {
  type Booking,
  toISODate,
  getBookingCalendarDate,
  getServiceLabel,
  generateGCalUrl,
} from "../shared";

/* ── Status colors for filter pills ── */
const STATUS_PILL_COLORS: Record<string, string> = {
  all: "#0B2040",
  "new-lead": "#7c3aed",
  pending: "#E07B2D",
  confirmed: "#1A5FAC",
  "in-progress": "#0D8A8F",
  completed: "#16A34A",
  cancelled: "#999",
  dead: "#6B7280",
};

/* ── Division text colors ── */
const DIVISION_COLORS: Record<string, string> = {
  auto: "text-gray-600",
  marine: "text-teal-600",
  fleet: "text-blue-600",
  rv: "text-purple-600",
};

function getDivision(b: Booking): string {
  if (b.division) return b.division.toLowerCase();
  if (b.serviceCategory === "marine" || b.vesselMake) return "marine";
  if (b.serviceCategory === "fleet" || b.fleetSize) return "fleet";
  if (b.serviceCategory === "rv" || b.rvType) return "rv";
  return "auto";
}

function getDivisionLabel(b: Booking): string {
  const d = getDivision(b);
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function getStatusBadgeVariant(status?: string): "green" | "red" | "amber" | "gray" | "blue" | "teal" {
  switch (status) {
    case "pending": return "amber";
    case "confirmed": return "blue";
    case "in-progress": return "teal";
    case "completed": return "green";
    case "cancelled": return "red";
    case "dead": return "gray";
    default: return "gray";
  }
}

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
        </div>
      }
    >
      <SchedulePageInner />
    </Suspense>
  );
}

function SchedulePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showTest = searchParams.get("showTest") === "1";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  /* View mode */
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  /* Filters */
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");

  /* Detail panel */
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  /* Calendar day */
  const [calendarDay, setCalendarDay] = useState(toISODate(new Date()));

  /* Search filter */
  const [searchFilter, setSearchFilter] = useState("");

  /* Action menu */
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [deadReasonMenuId, setDeadReasonMenuId] = useState<string | null>(null);

  /* Delete confirmation (hard delete, distinct from Cancel status change) */
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!actionMenuId) return;
    function handleClick() { setActionMenuId(null); setDeadReasonMenuId(null); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [actionMenuId]);

  /* Sort */
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  /* Toasts */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  function addToast(message: string, type: "success" | "info" = "success", action?: { label: string; url: string }) {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }
  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  /* ── Read URL filter param on mount ── */
  const [filterApplied, setFilterApplied] = useState(false);
  useEffect(() => {
    if (filterApplied) return;
    const filterParam = searchParams.get("filter");
    if (filterParam) {
      setStatusFilter(filterParam);
      setFilterApplied(true);
      router.replace("/admin/schedule", { scroll: false });
    }
  }, [searchParams, filterApplied, router]);

  /* ── Firestore real-time listener ── */
  useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setBookings(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking)
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  /* ── Time filter bounds ── */
  const now = new Date();
  const todayISO = toISODate(now);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  /* ── Visibility filter (test data) ── */
  const visibleBookings = showTest ? bookings : bookings.filter((b) => b.isTest !== true);

  /* ── Client-side filtering ── */
  const filtered = visibleBookings.filter((b) => {
    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "new-lead") {
        if (b.type !== "lead" && b.status !== "new-lead") return false;
      } else if (b.status !== statusFilter) return false;
    }

    // Time filter
    if (timeFilter !== "all") {
      const dateStr = b.confirmedDate || b.preferredDate;
      if (!dateStr) return false;
      const d = new Date(dateStr + "T12:00:00");
      if (timeFilter === "today" && dateStr !== todayISO) return false;
      if (timeFilter === "week" && (d < startOfWeek || d > endOfWeek)) return false;
      if (timeFilter === "month" && (d < startOfMonth || d > endOfMonth)) return false;
    }

    // Division filter
    if (divisionFilter !== "all") {
      if (getDivision(b) !== divisionFilter) return false;
    }

    // Text search filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      const name = (b.name || b.customerName || "").toLowerCase();
      const service = (getServiceLabel(b) || "").toLowerCase();
      const vehicle = [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ").toLowerCase();
      if (!name.includes(q) && !service.includes(q) && !vehicle.includes(q)) return false;
    }

    return true;
  });

  /* ── Sorting ── */
  const sorted = [...filtered].sort((a, b) => {
    let aVal = "";
    let bVal = "";
    if (sortKey === "customer") {
      aVal = a.name || a.customerName || "";
      bVal = b.name || b.customerName || "";
    } else if (sortKey === "service") {
      aVal = getServiceLabel(a);
      bVal = getServiceLabel(b);
    } else if (sortKey === "vehicle") {
      aVal = [a.vehicleYear, a.vehicleMake, a.vehicleModel].filter(Boolean).join(" ");
      bVal = [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ");
    } else if (sortKey === "date") {
      aVal = getBookingCalendarDate(a) || "";
      bVal = getBookingCalendarDate(b) || "";
    } else if (sortKey === "division") {
      aVal = getDivision(a);
      bVal = getDivision(b);
    } else if (sortKey === "status") {
      aVal = a.status || "";
      bVal = b.status || "";
    }
    const cmp = aVal.localeCompare(bVal);
    return sortDir === "asc" ? cmp : -cmp;
  });

  /* ── Status counts for filter badges (respect test visibility) ── */
  const statusCounts: Record<string, number> = { all: visibleBookings.length };
  visibleBookings.forEach((b) => {
    const s = b.type === "lead" ? "new-lead" : (b.status || "unknown");
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const testBookingCount = bookings.filter((b) => b.isTest === true).length;

  /* ── Selected booking ── */
  const selectedBooking = selectedBookingId
    ? bookings.find((b) => b.id === selectedBookingId) || null
    : null;

  /* ── Status advancement ── */
  async function handleAdvance(bookingId: string, nextStatus: string) {
    // Handle dead lead with reason
    if (nextStatus.startsWith("dead:")) {
      const reason = nextStatus.slice(5);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "dead" } : b))
      );
      try {
        await updateDoc(doc(db, "bookings", bookingId), {
          status: "dead",
          deadReason: reason,
          deadDate: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        });
        addToast("Lead marked as dead");
      } catch { /* onSnapshot will correct */ }
      return;
    }

    // Optimistic update
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
    );
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (nextStatus === "confirmed" && booking) {
        const entry = {
          id: crypto.randomUUID(),
          type: "note" as const,
          direction: "outbound" as const,
          summary: "Booking confirmed",
          createdAt: new Date().toISOString(),
          createdBy: "admin",
        };
        await updateDoc(doc(db, "bookings", bookingId), {
          status: nextStatus,
          commsLog: arrayUnion(entry),
          updatedAt: serverTimestamp(),
        });
        const calUrl = generateGCalUrl(booking);
        addToast("Booking confirmed!", "success", { label: "Add to Calendar", url: calUrl });
      } else if (nextStatus === "cancelled") {
        const entry = {
          id: crypto.randomUUID(),
          type: "note" as const,
          direction: "outbound" as const,
          summary: "Booking cancelled",
          createdAt: new Date().toISOString(),
          createdBy: "admin",
        };
        await updateDoc(doc(db, "bookings", bookingId), {
          status: "cancelled",
          cancelledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          commsLog: arrayUnion(entry),
        });
        addToast("Booking cancelled");
        // Fire-and-forget: send cancellation email to customer
        fetch("https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendCancellationEmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        }).catch((err) => console.error("Failed to send cancellation email:", err));
      } else {
        await updateDoc(doc(db, "bookings", bookingId), {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });
        addToast(`Status updated to ${nextStatus}`);
      }
    } catch {
      /* onSnapshot will correct */
    }
  }

  /* ── Hard delete (removes the booking doc entirely) ── */
  async function handleDelete(bookingId: string) {
    try {
      await deleteDoc(doc(db, "bookings", bookingId));
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      if (selectedBookingId === bookingId) setSelectedBookingId(null);
      addToast("Booking deleted");
    } catch {
      addToast("Failed to delete booking", "info");
    } finally {
      setDeleteConfirmId(null);
    }
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ── Table columns ── */
  const columns = [
    { key: "customer", label: "Customer", align: "left" as const, sortable: true },
    { key: "service", label: "Service", align: "left" as const, sortable: true },
    { key: "vehicle", label: "Vehicle", align: "left" as const, sortable: true },
    { key: "date", label: "Date", align: "center" as const, sortable: true },
    { key: "division", label: "Division", align: "center" as const, sortable: true },
    { key: "status", label: "Status", align: "center" as const, sortable: true },
    { key: "actions", label: "", align: "center" as const, sortable: false },
  ];
  const gridCols = "2fr 2fr 1.5fr 1fr 0.8fr 0.8fr 40px";

  const DEAD_REASONS = [
    "No response",
    "Not interested",
    "Chose competitor",
    "Wrong number",
    "Budget",
    "Out of service area",
    "Other",
  ];

  /* ── Status filter options ── */
  const statusOptions = [
    { key: "all", label: "All" },
    { key: "new-lead", label: "New Lead" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "in-progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
    { key: "dead", label: "Dead" },
  ];

  const timeOptions = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ];

  const divisionOptions = [
    { key: "all", label: "All" },
    { key: "auto", label: "Auto" },
    { key: "marine", label: "Marine" },
    { key: "fleet", label: "Fleet" },
    { key: "rv", label: "RV" },
  ];

  return (
    <div>
      <AdminTopBar title="Schedule" subtitle={`${filtered.length} booking${filtered.length !== 1 ? "s" : ""}`} />

      {/* ═══ Filter Row ═══ */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Status pills */}
          <div className="flex items-center gap-1.5">
            {statusOptions.map((opt) => {
              const isActive = statusFilter === opt.key;
              const count = statusCounts[opt.key] || 0;
              const color = STATUS_PILL_COLORS[opt.key] || "#0B2040";
              return (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                  style={
                    isActive
                      ? { backgroundColor: color, color: "#fff" }
                      : { backgroundColor: "transparent", color: "#6B7280" }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {opt.label}
                  {count > 0 && (
                    <span
                      className="text-[10px] font-bold rounded px-1.5 py-px"
                      style={
                        isActive
                          ? { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }
                          : { backgroundColor: "#F3F4F6", color: "#6B7280" }
                      }
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Time filter */}
          <div className="flex items-center gap-1">
            {timeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTimeFilter(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                  timeFilter === opt.key
                    ? "bg-[#F7F8FA] text-[#0B2040] font-semibold"
                    : "text-gray-500 font-medium hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Division filter */}
          <div className="flex items-center gap-1">
            {divisionOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDivisionFilter(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                  divisionFilter === opt.key
                    ? "bg-[#F7F8FA] text-[#0B2040] font-semibold"
                    : "text-gray-500 font-medium hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search filter */}
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter bookings..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-[200px] outline-none focus:border-[#1A5FAC] transition"
          />

          {/* Show/Hide test data toggle */}
          {testBookingCount > 0 && (
            <button
              onClick={() => {
                const p = new URLSearchParams(searchParams.toString());
                if (showTest) p.delete("showTest"); else p.set("showTest", "1");
                const qs = p.toString();
                router.replace(qs ? `/admin/schedule?${qs}` : "/admin/schedule", { scroll: false });
              }}
              className="ml-auto text-xs text-gray-500 hover:text-[#0B2040] cursor-pointer underline-offset-2 hover:underline"
            >
              {showTest ? `Hide test data (${testBookingCount})` : `Show test data (${testBookingCount})`}
            </button>
          )}

          {/* List / Calendar toggle */}
          <div className={`flex items-center bg-[#F7F8FA] rounded-lg p-0.5 border border-gray-200 ${testBookingCount > 0 ? "" : "ml-auto"}`}>
            {(["list", "calendar"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs cursor-pointer transition rounded-md ${
                  viewMode === mode
                    ? "bg-white text-[#0B2040] font-semibold shadow-sm"
                    : "bg-transparent text-gray-500 font-medium"
                }`}
              >
                {mode === "list" ? "List" : "Calendar"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Content Area ═══ */}
      <div className="px-8 py-6">
        {viewMode === "list" ? (
          /* ── List View ── */
          sorted.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0B2040] mb-2">No bookings found</h3>
              <p className="text-sm text-gray-500">Try changing your filters or check back later.</p>
            </div>
          ) : (
            <AdminTable>
              <AdminTableHeader
                columns={columns}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                gridTemplateColumns={gridCols}
              />
              {sorted.map((b) => {
                const vehicle = [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") ||
                  [b.vesselYear, b.vesselMake, b.vesselModel].filter(Boolean).join(" ") || "—";
                const calDate = getBookingCalendarDate(b);
                const dateDisplay = calDate
                  ? new Date(calDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—";
                const div = getDivision(b);
                const divLabel = getDivisionLabel(b);
                const divColor = DIVISION_COLORS[div] || "text-gray-600";

                return (
                  <AdminTableRow
                    key={b.id}
                    onClick={() => setSelectedBookingId(b.id)}
                    isSelected={selectedBookingId === b.id}
                    gridTemplateColumns={gridCols}
                    className={b.status === "dead" ? "opacity-50" : ""}
                  >
                    {/* Customer */}
                    <span className="text-sm font-semibold text-[#0B2040] truncate flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{b.name || b.customerName || "—"}</span>
                      {b.isTest === true && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide rounded-sm bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5">
                          TEST
                        </span>
                      )}
                    </span>
                    {/* Service */}
                    <span className="text-[13px] text-gray-600 truncate">
                      {getServiceLabel(b) || "—"}
                    </span>
                    {/* Vehicle */}
                    <span className="text-[13px] text-gray-600 truncate">{vehicle}</span>
                    {/* Date */}
                    <span className="text-[13px] text-gray-600 text-center">{dateDisplay}</span>
                    {/* Division */}
                    <span className={`text-[13px] font-medium text-center ${divColor}`}>{divLabel}</span>
                    {/* Status */}
                    <div className="text-center">
                      <AdminBadge
                        label={b.status || "—"}
                        variant={getStatusBadgeVariant(b.status)}
                      />
                    </div>

                    {/* Actions */}
                    <div className="relative flex justify-center" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === b.id ? null : b.id); setDeadReasonMenuId(null); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition"
                      >
                        <span className="text-lg text-gray-400 leading-none">&#8942;</span>
                      </button>
                      {actionMenuId === b.id && (
                        <div className="absolute right-full top-0 mr-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] z-[50]" onMouseDown={(e) => e.stopPropagation()}>
                          <button
                            onMouseDown={(e) => { e.preventDefault(); setSelectedBookingId(b.id); setActionMenuId(null); }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                          >
                            View Details
                          </button>
                          {(b.status === "pending" || b.status === "new-lead" || b.type === "lead") && (
                            <button
                              onMouseDown={(e) => { e.preventDefault(); handleAdvance(b.id, "confirmed"); setActionMenuId(null); }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                            >
                              Confirm
                            </button>
                          )}
                          <div className="relative">
                            <button
                              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDeadReasonMenuId(deadReasonMenuId === b.id ? null : b.id); }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                            >
                              Mark as Dead
                            </button>
                            {deadReasonMenuId === b.id && (
                              <div className="border-t border-gray-100 bg-gray-50 py-1">
                                {DEAD_REASONS.map((reason) => (
                                  <button
                                    key={reason}
                                    onMouseDown={(e) => { e.preventDefault(); handleAdvance(b.id, `dead:${reason}`); setActionMenuId(null); setDeadReasonMenuId(null); }}
                                    className="block w-full text-left px-6 py-1.5 text-xs text-gray-600 cursor-pointer hover:bg-gray-100 transition"
                                  >
                                    {reason}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {b.status !== "cancelled" && b.status !== "dead" && (
                            <>
                              <div className="h-px bg-gray-100 my-1" />
                              <button
                                onMouseDown={(e) => { e.preventDefault(); if (!confirm('Cancel this booking? This cannot be undone. The customer will need to rebook.')) return; handleAdvance(b.id, "cancelled"); setActionMenuId(null); }}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-gray-50 transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <div className="h-px bg-gray-100 my-1" />
                          <button
                            onMouseDown={(e) => { e.preventDefault(); setDeleteConfirmId(b.id); setActionMenuId(null); }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-gray-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </AdminTableRow>
                );
              })}
            </AdminTable>
          )
        ) : (
          /* ── Calendar View ── */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <ScheduleCalendar
              bookings={filtered}
              selectedId={selectedBookingId}
              onSelect={setSelectedBookingId}
              selectedDay={calendarDay}
              onDayChange={setCalendarDay}
            />
          </div>
        )}
      </div>

      {/* ═══ Detail Panel ═══ */}
      <ScheduleDetailPanel
        booking={selectedBooking}
        onClose={() => setSelectedBookingId(null)}
        onAdvance={handleAdvance}
      />

      {/* ── Delete confirmation modal ── */}
      {deleteConfirmId && (() => {
        const b = bookings.find((x) => x.id === deleteConfirmId);
        const customerName = b?.name || b?.customerName || "this customer";
        const date = b?.confirmedDate || b?.preferredDate || "—";
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[12px] p-6 max-w-[420px] w-full shadow-xl">
              <h3 className="text-[16px] font-bold text-[#0B2040] mb-2">Delete this booking?</h3>
              <p className="text-[14px] text-gray-500 mb-3">
                This will permanently remove the booking for{" "}
                <strong className="text-[#0B2040]">{customerName}</strong> on{" "}
                <strong className="text-[#0B2040]">{date}</strong> from your records.
              </p>
              <p className="text-[14px] text-gray-500 mb-3">
                If this booking has an associated invoice, the invoice will remain but its booking link will be broken.
              </p>
              <p className="text-[14px] text-gray-500 mb-5">This cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-[13px] font-medium text-gray-500 bg-gray-50 rounded-[8px] hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-4 py-2 text-[13px] font-medium text-white bg-[#dc2626] rounded-[8px] hover:bg-[#b91c1c] transition cursor-pointer"
                >
                  Delete booking
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
