"use client";

import { useState, useEffect, Fragment } from "react";
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
import ToastContainer, { type ToastItem } from "./Toast";
import CommsLog from "./CommsLog";
import NotificationButtons from "./NotificationButtons";

/* ─── Types ──────────────────────────────────────────────── */

interface Booking {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  contactPreference?: string;
  service?: string;
  serviceCategory?: string;
  source?: string;
  status?: string;
  address?: string;
  preferredDate?: string;
  datesFlexible?: boolean;
  timeWindow?: string;
  zip?: string;
  notes?: string;
  fleetSize?: string;
  engineType?: string;
  engineCount?: string;
  adminNotes?: string;
  commsLog?: Array<{ id: string; type: "call" | "text" | "email" | "note"; direction: "outbound" | "inbound"; summary: string; createdAt: string; createdBy: string }>;
  confirmedDate?: string;
  confirmedArrivalWindow?: string;
  estimatedDuration?: string;
  confirmedAt?: FirestoreTimestamp;
  returningCustomer?: boolean;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  lastViewedAt?: FirestoreTimestamp;
}

interface FirestoreTimestamp {
  toDate: () => Date;
}

/* ─── Helpers ────────────────────────────────────────────── */

function formatPhone(phone?: string): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length === 10)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function formatTimestamp(ts?: FirestoreTimestamp): string {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts as unknown as string);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getBookingCalendarDate(b: Booking): string | null {
  if ((b.status === "confirmed" || b.status === "completed") && b.confirmedDate) return b.confirmedDate;
  if (b.preferredDate) return b.preferredDate;
  if (b.createdAt?.toDate) return toISODate(b.createdAt.toDate());
  return null;
}

function getSourceLabel(source?: string): { label: string; color: string } {
  switch (source) {
    case "homepage-widget":
      return { label: "Homepage", color: "bg-[#1A5FAC]" };
    case "website":
      return { label: "Book Page", color: "bg-[#1A5FAC]" };
    case "fleet-page":
      return { label: "Fleet", color: "bg-[#16a34a]" };
    case "marine-page":
      return { label: "Marine", color: "bg-[#7c3aed]" };
    default:
      return { label: source || "—", color: "bg-[#888]" };
  }
}

function getStatusStyle(status?: string) {
  switch (status) {
    case "pending":
      return { label: "Pending", cls: "bg-[#E07B2D] text-white" };
    case "confirmed":
      return { label: "Confirmed", cls: "bg-[#1A5FAC] text-white" };
    case "completed":
      return { label: "Completed", cls: "bg-[#16a34a] text-white" };
    default:
      return { label: status || "—", cls: "bg-[#eee] text-[#444]" };
  }
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function isNewBooking(b: Booking): boolean {
  if (b.status !== "pending") return false;
  if (!b.createdAt?.toDate) return false;
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  return b.createdAt.toDate().getTime() > twoHoursAgo;
}

function parseArrivalWindowHours(window: string): { start: number; end: number } {
  const hourMap: Record<string, { start: number; end: number }> = {
    "7:00 - 8:00 AM": { start: 7, end: 8 },
    "8:00 - 9:00 AM": { start: 8, end: 9 },
    "9:00 - 10:00 AM": { start: 9, end: 10 },
    "10:00 - 11:00 AM": { start: 10, end: 11 },
    "11:00 AM - 12:00 PM": { start: 11, end: 12 },
    "12:00 - 1:00 PM": { start: 12, end: 13 },
    "1:00 - 2:00 PM": { start: 13, end: 14 },
    "2:00 - 3:00 PM": { start: 14, end: 15 },
    "3:00 - 4:00 PM": { start: 15, end: 16 },
    "4:00 - 5:00 PM": { start: 16, end: 17 },
  };
  return hourMap[window] || { start: 9, end: 10 };
}

function generateGCalUrl(booking: Booking): string {
  const title = encodeURIComponent(`Coastal Mobile - ${booking.service || "Service"} - ${booking.name || "Customer"}`);
  const dateStr = booking.confirmedDate || booking.preferredDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];
  let startHour = 9;
  let endHour = 10;
  if (booking.confirmedArrivalWindow) {
    const parsed = parseArrivalWindowHours(booking.confirmedArrivalWindow);
    startHour = parsed.start;
    endHour = parsed.end;
  } else {
    if (booking.timeWindow === "midday") { startHour = 11; endHour = 12; }
    if (booking.timeWindow === "afternoon") { startHour = 14; endHour = 15; }
  }
  const startDate = dateStr.replace(/-/g, "") + "T" + String(startHour).padStart(2, "0") + "0000";
  const endDate = dateStr.replace(/-/g, "") + "T" + String(endHour).padStart(2, "0") + "0000";
  const details = encodeURIComponent(
    `Service: ${booking.service || "TBD"}\nCustomer: ${booking.name || "N/A"}\nPhone: ${booking.phone || "N/A"}\nEmail: ${booking.email || "N/A"}\nContact Pref: ${booking.contactPreference || "N/A"}\nSource: ${booking.source || "N/A"}\nArrival: ${booking.confirmedArrivalWindow || "TBD"}\nNotes: ${booking.notes || "None"}\nAdmin: https://coastal-mobile-lube.netlify.app/admin`
  );
  const location = encodeURIComponent(booking.address || booking.zip || "Tampa, FL");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}

/* ─── Component ──────────────────────────────────────────── */

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISODate(d);
  });
  const [dateTo, setDateTo] = useState(() => toISODate(new Date()));

  /* View */
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Set Appointment */
  const [settingAppointmentId, setSettingAppointmentId] = useState<string | null>(null);

  /* Calendar */
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  /* Admin notes */
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});

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

  /* ── Client-side filtering ── */
  const filtered = bookings.filter((b) => {
    if (sourceFilter !== "all") {
      if (sourceFilter === "automotive") {
        if (b.serviceCategory !== "automotive" && b.source !== "website")
          return false;
      } else if (sourceFilter === "fleet") {
        if (b.serviceCategory !== "fleet") return false;
      } else if (sourceFilter === "marine") {
        if (b.serviceCategory !== "marine") return false;
      }
    }
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (b.createdAt?.toDate) {
      const created = b.createdAt.toDate();
      if (created < new Date(dateFrom + "T00:00:00")) return false;
      if (created > new Date(dateTo + "T23:59:59")) return false;
    }
    return true;
  });

  /* ── Sort: NEW pending → pending → confirmed → completed ── */
  filtered.sort((a, b) => {
    const priority = (bk: Booking) => {
      if (isNewBooking(bk)) return 0;
      if (bk.status === "pending") return 1;
      if (bk.status === "confirmed") return 2;
      return 3;
    };
    const diff = priority(a) - priority(b);
    if (diff !== 0) return diff;
    const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
    const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
    return bTime - aTime;
  });

  /* ── Stats (unfiltered) ── */
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  /* ── Status update (optimistic) ── */
  async function updateStatus(id: string, newStatus: string, booking?: Booking) {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
    try {
      if (newStatus === "confirmed" && booking) {
        const entry = {
          id: crypto.randomUUID(),
          type: "note" as const,
          direction: "outbound" as const,
          summary: "Booking confirmed",
          createdAt: new Date().toISOString(),
          createdBy: "admin",
        };
        await updateDoc(doc(db, "bookings", id), {
          status: newStatus,
          commsLog: arrayUnion(entry),
          updatedAt: serverTimestamp(),
        });
        const calUrl = generateGCalUrl(booking);
        addToast("Booking confirmed!", "success", { label: "Add to Calendar", url: calUrl });
      } else {
        await updateDoc(doc(db, "bookings", id), {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      /* onSnapshot will correct */
    }
  }

  /* ── Confirm appointment (Set Appointment flow) ── */
  async function confirmAppointment(
    id: string,
    booking: Booking,
    confirmedDate: string,
    confirmedArrivalWindow: string,
    estimatedDuration: string
  ) {
    const entry = {
      id: crypto.randomUUID(),
      type: "note" as const,
      direction: "outbound" as const,
      summary: `Appointment confirmed for ${confirmedDate} ${confirmedArrivalWindow}`,
      createdAt: new Date().toISOString(),
      createdBy: "admin",
    };
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, status: "confirmed", confirmedDate, confirmedArrivalWindow, estimatedDuration }
          : b
      )
    );
    try {
      await updateDoc(doc(db, "bookings", id), {
        status: "confirmed",
        confirmedDate,
        confirmedArrivalWindow,
        estimatedDuration,
        confirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        commsLog: arrayUnion(entry),
      });
      const updatedBooking = { ...booking, confirmedDate, confirmedArrivalWindow, estimatedDuration };
      const calUrl = generateGCalUrl(updatedBooking);
      addToast(`Appointment set for ${confirmedDate} at ${confirmedArrivalWindow}`, "success", { label: "Add to Calendar", url: calUrl });
      // Auto-send confirmation email (B5)
      if (booking.email) {
        try {
          await fetch("https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendConfirmationEmail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking: updatedBooking, bookingId: id }),
          });
          addToast(`Confirmation email sent to ${booking.email}`, "success");
        } catch {
          /* email send failed silently */
        }
      } else {
        addToast("Appointment confirmed. No email on file - contact customer manually.", "info");
      }
    } catch {
      /* onSnapshot will correct */
    }
    setSettingAppointmentId(null);
  }

  /* ── Save admin notes ── */
  async function saveAdminNotes(id: string) {
    setSavingNotes((p) => ({ ...p, [id]: true }));
    try {
      await updateDoc(doc(db, "bookings", id), {
        adminNotes: editingNotes[id] ?? "",
        updatedAt: serverTimestamp(),
      });
      addToast("Notes saved");
    } catch {
      /* silent */
    } finally {
      setSavingNotes((p) => ({ ...p, [id]: false }));
    }
  }

  /* ── Calendar data ── */
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const calDays = getCalendarDays(calYear, calMonth);
  const monthLabel = calendarDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const bookingsByDate: Record<string, Booking[]> = {};
  filtered.forEach((b) => {
    const d = getBookingCalendarDate(b);
    if (d) {
      if (!bookingsByDate[d]) bookingsByDate[d] = [];
      bookingsByDate[d].push(b);
    }
  });

  const todayISO = toISODate(new Date());

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {(
          [
            { label: "Total Bookings", value: stats.total, color: "text-[#0B2040]" },
            { label: "Pending", value: stats.pending, color: "text-[#E07B2D]" },
            { label: "Confirmed", value: stats.confirmed, color: "text-[#1A5FAC]" },
            { label: "Completed", value: stats.completed, color: "text-[#16a34a]" },
          ] as const
        ).map((s) => (
          <div
            key={s.label}
            className="bg-white border border-[#e8e8e8] rounded-[12px] p-5"
          >
            <p className={`text-[32px] font-[800] ${s.color}`}>{s.value}</p>
            <p className="text-[13px] text-[#888] font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ═══ Filters ═══ */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        {/* Source */}
        <div>
          <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
            Source
          </label>
          <div className="flex rounded-lg overflow-hidden border border-[#e8e8e8]">
            {["all", "automotive", "fleet", "marine"].map((v) => (
              <button
                key={v}
                onClick={() => setSourceFilter(v)}
                className={`px-3 py-2 text-[13px] font-semibold transition-colors ${
                  sourceFilter === v
                    ? "bg-[#0B2040] text-white"
                    : "bg-white text-[#444] hover:bg-[#f5f5f5]"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {/* Status */}
        <div>
          <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
            Status
          </label>
          <div className="flex rounded-lg overflow-hidden border border-[#e8e8e8]">
            {["all", "pending", "confirmed", "completed"].map((v) => (
              <button
                key={v}
                onClick={() => setStatusFilter(v)}
                className={`px-3 py-2 text-[13px] font-semibold transition-colors ${
                  statusFilter === v
                    ? "bg-[#0B2040] text-white"
                    : "bg-white text-[#444] hover:bg-[#f5f5f5]"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {/* Date range */}
        <div>
          <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-[13px] rounded-lg px-3 py-2 border border-[#e8e8e8] outline-none focus:border-[#1A5FAC]"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-[13px] rounded-lg px-3 py-2 border border-[#e8e8e8] outline-none focus:border-[#1A5FAC]"
          />
        </div>
      </div>

      {/* ═══ View toggle + count ═══ */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[14px] text-[#888]">
          Showing{" "}
          <span className="font-semibold text-[#0B2040]">
            {filtered.length}
          </span>{" "}
          booking{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="flex rounded-lg overflow-hidden border border-[#e8e8e8]">
          {(
            [
              { key: "list", label: "List View" },
              { key: "calendar", label: "Calendar View" },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={`px-4 py-2 text-[13px] font-semibold transition-colors ${
                viewMode === v.key
                  ? "bg-[#0B2040] text-white"
                  : "bg-white text-[#444] hover:bg-[#f5f5f5]"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Empty state ═══ */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 className="text-[18px] font-bold text-[#0B2040] mb-2">
            No bookings yet
          </h3>
          <p className="text-[14px] text-[#888]">
            Bookings from the website will appear here automatically.
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* ═══ LIST VIEW ═══ */
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="border-b border-[#eee]">
                  {[
                    "Date",
                    "Customer",
                    "Phone",
                    "Email",
                    "Service",
                    "Preferred Date",
                    "Source",
                    "Pref",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const source = getSourceLabel(b.source);
                  const status = getStatusStyle(b.status);
                  const isExpanded = expandedId === b.id;
                  const bIsNew = isNewBooking(b);
                  return (
                    <Fragment key={b.id}>
                      <tr
                        onClick={() => {
                          setExpandedId(isExpanded ? null : b.id);
                          if (!isExpanded) {
                            updateDoc(doc(db, "bookings", b.id), { lastViewedAt: serverTimestamp() }).catch(() => {});
                          }
                        }}
                        className={`border-b border-[#f0f0f0] cursor-pointer transition-colors ${
                          bIsNew
                            ? "bg-[#FFF8F0] border-l-4 border-l-[#E07B2D]"
                            : isExpanded ? "bg-[#FAFBFC]" : "hover:bg-[#FAFBFC]"
                        }`}
                      >
                        <td className="px-4 py-3 text-[13px] text-[#444] whitespace-nowrap">
                          {formatTimestamp(b.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-[14px] font-semibold text-[#0B2040] whitespace-nowrap">
                          {b.name || "—"}
                          {bIsNew && (
                            <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-[#E07B2D]">NEW</span>
                          )}
                          {b.datesFlexible && (
                            <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#888] bg-[#f0f0f0]">Flexible</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                          {b.phone ? (
                            <a
                              href={`tel:${b.phone}`}
                              className="text-[#1A5FAC] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {formatPhone(b.phone)}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#444] whitespace-nowrap">
                          {b.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#444] whitespace-nowrap max-w-[180px] truncate">
                          {b.service || "—"}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#444] whitespace-nowrap">
                          {b.preferredDate
                            ? new Date(b.preferredDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            : "—"}
                          {b.datesFlexible && <span className="text-[11px] text-[#888] ml-1">(flex)</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold text-white ${source.color}`}
                          >
                            {source.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {b.contactPreference ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold text-[#444] bg-[#f0f0f0]">
                              {b.contactPreference.charAt(0).toUpperCase() +
                                b.contactPreference.slice(1)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${status.cls}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <StatusActions
                            status={b.status}
                            onConfirm={() => {
                              setSettingAppointmentId(b.id);
                              setExpandedId(b.id);
                            }}
                            onComplete={() => updateStatus(b.id, "completed")}
                          />
                        </td>
                      </tr>

                      {/* ── Expanded detail ── */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="p-0">
                            <ExpandedDetail
                              booking={b}
                              editingNotes={editingNotes}
                              savingNotes={savingNotes}
                              onNotesChange={(val) =>
                                setEditingNotes((p) => ({
                                  ...p,
                                  [b.id]: val,
                                }))
                              }
                              onSaveNotes={() => saveAdminNotes(b.id)}
                              onToast={addToast}
                              showAppointmentSetter={settingAppointmentId === b.id}
                              onConfirmAppointment={(date, window, duration) =>
                                confirmAppointment(b.id, b, date, window, duration)
                              }
                              onCancelAppointmentSetter={() => setSettingAppointmentId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ═══ CALENDAR VIEW ═══ */
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                setCalendarDate(new Date(calYear, calMonth - 1, 1));
                setSelectedDay(null);
              }}
              className="px-3 py-2 text-[14px] font-semibold text-[#444] hover:text-[#0B2040] transition-colors"
            >
              &larr; Previous
            </button>
            <h3 className="text-[18px] font-bold text-[#0B2040]">
              {monthLabel}
            </h3>
            <button
              onClick={() => {
                setCalendarDate(new Date(calYear, calMonth + 1, 1));
                setSelectedDay(null);
              }}
              className="px-3 py-2 text-[14px] font-semibold text-[#444] hover:text-[#0B2040] transition-colors"
            >
              Next &rarr;
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px">
            {calDays.map((day, i) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[80px] bg-[#fafafa] rounded"
                  />
                );
              }
              const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayBookings = bookingsByDate[dateKey] || [];
              const isSelected = selectedDay === dateKey;
              const isToday = dateKey === todayISO;
              return (
                <div
                  key={dateKey}
                  onClick={() =>
                    setSelectedDay(isSelected ? null : dateKey)
                  }
                  className={`min-h-[80px] p-2 rounded cursor-pointer transition-colors border ${
                    isSelected
                      ? "border-[#0B2040] bg-[#EBF4FF]"
                      : isToday
                        ? "border-[#E07B2D] bg-white"
                        : "border-transparent bg-white hover:bg-[#FAFBFC]"
                  }`}
                >
                  <p
                    className={`text-[13px] font-semibold mb-1 ${isToday ? "text-[#E07B2D]" : "text-[#0B2040]"}`}
                  >
                    {day}
                  </p>
                  {dayBookings.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {dayBookings.slice(0, 5).map((b) => (
                        <span
                          key={b.id}
                          className={`w-2 h-2 rounded-full ${
                            b.status === "pending"
                              ? "bg-[#E07B2D]"
                              : b.status === "confirmed"
                                ? "bg-[#1A5FAC]"
                                : "bg-[#16a34a]"
                          }`}
                        />
                      ))}
                      {dayBookings.length > 5 && (
                        <span className="text-[10px] text-[#888]">
                          +{dayBookings.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day panel */}
          {selectedDay && bookingsByDate[selectedDay] && (
            <div className="mt-6 border-t border-[#eee] pt-6">
              <h4 className="text-[16px] font-bold text-[#0B2040] mb-4">
                {new Date(selectedDay + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "short", month: "short", day: "numeric" }
                )}
                <span className="ml-2 text-[14px] font-normal text-[#888]">
                  ({bookingsByDate[selectedDay].length} booking
                  {bookingsByDate[selectedDay].length !== 1 ? "s" : ""})
                </span>
              </h4>
              <div className="flex flex-col gap-3">
                {bookingsByDate[selectedDay].map((b) => {
                  const status = getStatusStyle(b.status);
                  const source = getSourceLabel(b.source);
                  const calIsNew = isNewBooking(b);
                  return (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between bg-[#FAFBFC] border border-[#e8e8e8] rounded-[10px] p-4 ${
                        calIsNew ? "border-l-4 border-l-[#E07B2D] bg-[#FFF8F0]" : ""
                      }`}
                    >
                      <div>
                        <p className="text-[15px] font-semibold text-[#0B2040]">
                          {b.name || "—"}
                          {calIsNew && (
                            <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-[#E07B2D]">NEW</span>
                          )}
                          {b.datesFlexible && (
                            <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#888] bg-[#f0f0f0]">Flexible</span>
                          )}
                        </p>
                        <p className="text-[13px] text-[#444]">
                          {b.service || "—"}
                          {calIsNew && (
                            <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-[#E07B2D]">NEW</span>
                          )}
                        </p>
                        <p className="text-[12px] text-[#888]">
                          {formatPhone(b.phone)}
                          {b.email ? ` · ${b.email}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold text-white ${source.color}`}
                        >
                          {source.label}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function StatusActions({
  status,
  onConfirm,
  onComplete,
}: {
  status?: string;
  onConfirm: () => void;
  onComplete: () => void;
}) {
  if (status === "pending") {
    return (
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="px-3 py-1.5 text-[12px] font-semibold text-white bg-[#1A5FAC] rounded-md hover:bg-[#164d8a] transition-colors"
        >
          Confirm
        </button>
        <button
          onClick={onComplete}
          className="px-3 py-1.5 text-[12px] font-semibold text-[#16a34a] border border-[#16a34a] rounded-md hover:bg-[#16a34a] hover:text-white transition-colors"
        >
          Complete
        </button>
      </div>
    );
  }
  if (status === "confirmed") {
    return (
      <button
        onClick={onComplete}
        className="px-3 py-1.5 text-[12px] font-semibold text-white bg-[#16a34a] rounded-md hover:bg-[#15803d] transition-colors"
      >
        Complete
      </button>
    );
  }
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16a34a"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const arrivalWindows = [
  "7:00 - 8:00 AM",
  "8:00 - 9:00 AM",
  "9:00 - 10:00 AM",
  "10:00 - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 - 1:00 PM",
  "1:00 - 2:00 PM",
  "2:00 - 3:00 PM",
  "3:00 - 4:00 PM",
  "4:00 - 5:00 PM",
];

const timeWindowToArrival: Record<string, string> = {
  morning: "8:00 - 9:00 AM",
  midday: "11:00 AM - 12:00 PM",
  afternoon: "2:00 - 3:00 PM",
};

function ExpandedDetail({
  booking: b,
  editingNotes,
  savingNotes,
  onNotesChange,
  onSaveNotes,
  onToast,
  showAppointmentSetter,
  onConfirmAppointment,
  onCancelAppointmentSetter,
}: {
  booking: Booking;
  editingNotes: Record<string, string>;
  savingNotes: Record<string, boolean>;
  onNotesChange: (val: string) => void;
  onSaveNotes: () => void;
  onToast: (message: string, type?: "success" | "info") => void;
  showAppointmentSetter: boolean;
  onConfirmAppointment: (date: string, window: string, duration: string) => void;
  onCancelAppointmentSetter: () => void;
}) {
  const [apptDate, setApptDate] = useState(b.preferredDate || toISODate(new Date()));
  const [apptWindow, setApptWindow] = useState(
    b.timeWindow ? (timeWindowToArrival[b.timeWindow] || "8:00 - 9:00 AM") : "8:00 - 9:00 AM"
  );
  const [apptDuration, setApptDuration] = useState("Under 1 hour");

  const fields = [
    { label: "Name", value: b.name },
    { label: "Phone", value: formatPhone(b.phone) },
    { label: "Email", value: b.email },
    { label: "Contact Preference", value: b.contactPreference },
    { label: "Service", value: b.service },
    { label: "Service Category", value: b.serviceCategory },
    { label: "Source", value: b.source },
    { label: "Address", value: b.address },
    { label: "Preferred Date", value: b.preferredDate },
    { label: "Dates Flexible", value: b.datesFlexible ? "Yes" : undefined },
    { label: "Time Window", value: b.timeWindow },
    { label: "Zip Code", value: b.zip },
    { label: "Fleet Size", value: b.fleetSize },
    { label: "Engine Type", value: b.engineType },
    { label: "Engine Count", value: b.engineCount },
    { label: "Notes", value: b.notes },
    { label: "Returning Customer", value: b.returningCustomer ? "Yes" : undefined },
    { label: "Status", value: b.status },
    { label: "Created", value: formatTimestamp(b.createdAt) },
    { label: "Updated", value: formatTimestamp(b.updatedAt) },
  ].filter((f) => f.value);

  return (
    <div className="bg-[#FAFBFC] border-t border-[#eee] px-6 py-5">
      {/* Confirmed appointment details (B3) */}
      {(b.status === "confirmed" || b.status === "completed") && b.confirmedDate && (
        <div className="mb-5 border-l-4 border-l-[#1A5FAC] bg-[#EBF4FF] rounded-r-[8px] p-4">
          <p className="text-[11px] uppercase font-semibold text-[#1A5FAC] tracking-[0.5px] mb-2">
            Confirmed Appointment
          </p>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-[12px] text-[#888]">Date</p>
              <p className="text-[15px] font-semibold text-[#0B2040]">
                {new Date(b.confirmedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            {b.confirmedArrivalWindow && (
              <div>
                <p className="text-[12px] text-[#888]">Arrival Window</p>
                <p className="text-[15px] font-semibold text-[#0B2040]">{b.confirmedArrivalWindow}</p>
              </div>
            )}
            {b.estimatedDuration && (
              <div>
                <p className="text-[12px] text-[#888]">Est. Duration</p>
                <p className="text-[15px] font-semibold text-[#0B2040]">{b.estimatedDuration}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointment setter form (B1) */}
      {showAppointmentSetter && (
        <div className="mb-5 border border-[#E07B2D] bg-white rounded-[10px] p-5">
          <p className="text-[14px] font-bold text-[#0B2040] mb-4">Set Appointment</p>

          <div className="mb-4">
            <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
              Appointment Date
            </label>
            <input
              type="date"
              value={apptDate}
              min={toISODate(new Date())}
              onChange={(e) => setApptDate(e.target.value)}
              className="text-[14px] rounded-lg px-3 py-2 border border-[#e8e8e8] outline-none focus:border-[#1A5FAC]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
              Arrival Window
            </label>
            <div className="flex flex-wrap gap-2">
              {arrivalWindows.map((w) => (
                <button
                  key={w}
                  onClick={() => setApptWindow(w)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                    apptWindow === w
                      ? "bg-[#0B2040] text-white"
                      : "bg-white text-[#444] border border-[#e8e8e8] hover:border-[#0B2040]"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
              Estimated Duration
            </label>
            <select
              value={apptDuration}
              onChange={(e) => setApptDuration(e.target.value)}
              className="text-[14px] rounded-lg px-3 py-2 border border-[#e8e8e8] outline-none focus:border-[#1A5FAC]"
            >
              <option>Under 1 hour</option>
              <option>1-2 hours</option>
              <option>2-3 hours</option>
              <option>Half day</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onConfirmAppointment(apptDate, apptWindow, apptDuration)}
              className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#E07B2D] rounded-md hover:bg-[#cc6a1f] transition-colors"
            >
              Confirm Appointment
            </button>
            <button
              onClick={onCancelAppointmentSetter}
              className="px-5 py-2.5 text-[13px] font-semibold text-[#444] border border-[#ddd] rounded-md hover:bg-[#f5f5f5] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1">
              {f.label}
            </p>
            <p className="text-[14px] text-[#0B2040]">{f.value}</p>
          </div>
        ))}
      </div>

      {/* Notification buttons */}
      <NotificationButtons
        bookingId={b.id}
        booking={b}
        phone={b.phone}
        email={b.email}
        onToast={onToast}
      />

      {/* Google Calendar button */}
      {(b.status === "confirmed" || b.status === "completed") && (
        <div className="mb-5">
          <button
            onClick={() => window.open(generateGCalUrl(b), "_blank")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-semibold text-[#0B2040] bg-white border-2 border-[#0B2040] hover:bg-[#0B2040] hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Add to Google Calendar
          </button>
        </div>
      )}

      {/* Admin notes */}
      <div>
        <p className="text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
          Admin Notes
        </p>
        <textarea
          rows={3}
          value={editingNotes[b.id] ?? b.adminNotes ?? ""}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Internal notes about this booking..."
          className="w-full text-[14px] rounded-[8px] px-3 py-2 border border-[#ddd] outline-none focus:border-[#1A5FAC] transition-colors resize-y"
        />
        <button
          onClick={onSaveNotes}
          disabled={savingNotes[b.id]}
          className="mt-2 px-4 py-2 text-[13px] font-semibold text-white bg-[#0B2040] rounded-md hover:bg-[#132E54] transition-colors disabled:opacity-50"
        >
          {savingNotes[b.id] ? "Saving..." : "Save Notes"}
        </button>
      </div>

      {/* Communication Log */}
      <CommsLog
        bookingId={b.id}
        commsLog={b.commsLog || []}
        onToast={onToast}
      />
    </div>
  );
}
