"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
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
    default: return "gray";
  }
}

export default function SchedulePage() {
  const router = useRouter();
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

  /* ── Client-side filtering ── */
  const filtered = bookings.filter((b) => {
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

  /* ── Status counts for filter badges ── */
  const statusCounts: Record<string, number> = { all: bookings.length };
  bookings.forEach((b) => {
    const s = b.type === "lead" ? "new-lead" : (b.status || "unknown");
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  /* ── Selected booking ── */
  const selectedBooking = selectedBookingId
    ? bookings.find((b) => b.id === selectedBookingId) || null
    : null;

  /* ── Status advancement ── */
  async function handleAdvance(bookingId: string, nextStatus: string) {
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
  ];
  const gridCols = "2fr 2fr 1.5fr 1fr 0.8fr 0.8fr";

  /* ── Status filter options ── */
  const statusOptions = [
    { key: "all", label: "All" },
    { key: "new-lead", label: "New Lead" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "in-progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
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

          {/* List / Calendar toggle */}
          <div className="flex items-center bg-[#F7F8FA] rounded-lg p-0.5 border border-gray-200 ml-auto">
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
                  >
                    {/* Customer */}
                    <span className="text-sm font-semibold text-[#0B2040] truncate">
                      {b.name || b.customerName || "—"}
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

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
