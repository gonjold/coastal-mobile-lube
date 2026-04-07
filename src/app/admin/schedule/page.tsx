"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
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
import ToastContainer, { type ToastItem } from "../Toast";
import CommsLog from "../CommsLog";
import NotificationButtons from "../NotificationButtons";
import {
  type Booking,
  formatPhone,
  formatTimestamp,
  toISODate,
  getBookingCalendarDate,
  getSourceLabel,
  getStatusStyle,
  formatTimeWindow,
  isNewBooking,
  generateGCalUrl,
  exportBookingsCsv,
  getServiceLabel,
} from "../shared";

export default function SchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  /* Quick time filter — initialise from URL ?time= and ?status= */
  const validTimeFilters = ["today", "week", "month", "all"] as const;
  const validStatusFilters = ["bookings", "pending", "confirmed", "completed", "cancelled", "leads", "all"];
  const initialTime = validTimeFilters.find((v) => v === searchParams.get("time")) ?? "all";
  const initialStatus = validStatusFilters.find((v) => v === searchParams.get("status")) ?? "bookings";
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "all">(initialTime);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  /* List */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Set Appointment */
  const [settingAppointmentId, setSettingAppointmentId] = useState<string | null>(null);

  /* Cancel / Delete confirmation */
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  /* ── Time filter boundaries ── */
  const now = new Date();
  const todayISO = toISODate(now);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  /* ── Client-side filtering ── */
  const filtered = bookings.filter((b) => {
    // Lead / booking separation
    if (statusFilter === "bookings") {
      if (b.type === "lead") return false;
    } else if (statusFilter === "leads") {
      if (b.type !== "lead") return false;
    } else if (statusFilter !== "all") {
      // Specific status filter — exclude leads
      if (b.type === "lead") return false;
      if (b.status !== statusFilter) return false;
    }

    // Time filter
    if (timeFilter !== "all") {
      const bookingDate = getBookingCalendarDate(b);
      if (timeFilter === "today") {
        if (bookingDate !== todayISO) return false;
      } else if (timeFilter === "week") {
        if (!bookingDate) return false;
        const bd = new Date(bookingDate + "T12:00:00");
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        if (bd < startOfWeek || bd > endOfWeek) return false;
      } else if (timeFilter === "month") {
        if (!bookingDate) return false;
        const bd = new Date(bookingDate + "T12:00:00");
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        if (bd < startOfMonth || bd > endOfMonth) return false;
      }
    }

    return true;
  });

  /* ── Sort: leads → NEW pending → pending → confirmed → completed → cancelled ── */
  filtered.sort((a, b) => {
    const priority = (bk: Booking) => {
      if (bk.type === "lead") return -1;
      if (isNewBooking(bk)) return 0;
      if (bk.status === "pending") return 1;
      if (bk.status === "confirmed") return 2;
      if (bk.status === "cancelled") return 4;
      return 3;
    };
    const diff = priority(a) - priority(b);
    if (diff !== 0) return diff;
    const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
    const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
    return bTime - aTime;
  });

  /* ── Today count (for badge) ── */
  const todayCount = bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    return getBookingCalendarDate(b) === todayISO;
  }).length;

  /* ── Stats (unfiltered, excluding leads from booking stats) ── */
  const bookingsOnly = bookings.filter((b) => b.type !== "lead");
  const cancelled = bookingsOnly.filter((b) => b.status === "cancelled").length;
  const leads = bookings.filter((b) => b.type === "lead").length;
  const stats = {
    total: bookingsOnly.length - cancelled,
    pending: bookingsOnly.filter((b) => b.status === "pending").length,
    confirmed: bookingsOnly.filter((b) => b.status === "confirmed").length,
    completed: bookingsOnly.filter((b) => b.status === "completed").length,
    cancelled,
    leads,
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

  /* ── Cancel booking ── */
  async function cancelBooking(id: string) {
    setCancelConfirmId(null);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
    );
    try {
      const entry = {
        id: crypto.randomUUID(),
        type: "note" as const,
        direction: "outbound" as const,
        summary: "Booking cancelled",
        createdAt: new Date().toISOString(),
        createdBy: "admin",
      };
      await updateDoc(doc(db, "bookings", id), {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        commsLog: arrayUnion(entry),
      });
      addToast("Booking cancelled");
    } catch {
      /* onSnapshot will correct */
    }
  }

  /* ── Delete booking ── */
  async function deleteBooking(id: string) {
    setDeleteConfirmId(null);
    setBookings((prev) => prev.filter((b) => b.id !== id));
    if (expandedId === id) setExpandedId(null);
    try {
      await deleteDoc(doc(db, "bookings", id));
      addToast("Booking deleted");
    } catch {
      /* onSnapshot will correct */
    }
  }

  /* ── Convert lead to booking ── */
  async function convertToBooking(id: string) {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, type: "booking", status: "pending" } : b))
    );
    try {
      const entry = {
        id: crypto.randomUUID(),
        type: "note" as const,
        direction: "outbound" as const,
        summary: "Lead converted to booking",
        createdAt: new Date().toISOString(),
        createdBy: "admin",
      };
      await updateDoc(doc(db, "bookings", id), {
        type: "booking",
        status: "pending",
        updatedAt: serverTimestamp(),
        commsLog: arrayUnion(entry),
      });
      addToast("Lead converted to booking");
    } catch {
      /* onSnapshot will correct */
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

  /* ── Render ── */
  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1600px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[#888] mb-4">
        <Link href="/admin" className="hover:text-[#1A5FAC] transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-[#0B2040] font-semibold">Schedule</span>
      </div>

      {/* ═══ Header with today highlight ═══ */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-[800] text-[#0B2040] mb-1">Schedule</h1>
          <p className="text-[14px] text-[#888]">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Today badge */}
          <div className="flex items-center gap-2 bg-white border-2 border-[#E07B2D]/30 rounded-[12px] px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-[#E07B2D] flex items-center justify-center">
              <span className="text-[16px] font-[800] text-white leading-none">{todayCount}</span>
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#0B2040] leading-tight">Today</p>
              <p className="text-[11px] text-[#888]">booking{todayCount !== 1 ? "s" : ""} scheduled</p>
            </div>
          </div>
          <button
            onClick={() => exportBookingsCsv(filtered)}
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
      </div>

      {/* ═══ Quick Filter Bar ═══ */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Time filter pills */}
        <div className="flex rounded-lg overflow-hidden border border-[#e8e8e8]">
          {([
            { key: "today", label: "Today" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
            { key: "all", label: "All" },
          ] as const).map((v) => (
            <button
              key={v.key}
              onClick={() => setTimeFilter(v.key)}
              className={`px-4 py-2 text-[13px] font-semibold transition-colors ${
                timeFilter === v.key
                  ? "bg-[#0B2040] text-white"
                  : "bg-white text-[#444] hover:bg-[#f5f5f5]"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Status filter pills */}
        <div className="flex rounded-lg overflow-hidden border border-[#e8e8e8]">
          {[
            { key: "bookings", label: "Bookings" },
            { key: "pending", label: "Pending" },
            { key: "confirmed", label: "Confirmed" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
            { key: "leads", label: "Leads" },
            { key: "all", label: "All" },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setStatusFilter(v.key)}
              className={`px-3 py-2 text-[13px] font-semibold transition-colors ${
                statusFilter === v.key
                  ? "bg-[#0B2040] text-white"
                  : "bg-white text-[#444] hover:bg-[#f5f5f5]"
              }`}
            >
              {v.label}
              {v.key === "pending" && stats.pending > 0 && (
                <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E07B2D] text-white leading-none">
                  {stats.pending}
                </span>
              )}
              {v.key === "leads" && stats.leads > 0 && (
                <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#7c3aed] text-white leading-none">
                  {stats.leads}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-[14px] text-[#888] ml-auto">
          Showing{" "}
          <span className="font-semibold text-[#0B2040]">{filtered.length}</span>{" "}
          {statusFilter === "leads" ? "lead" : "booking"}{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ═══ Status Cards ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-[#FFF8F0] rounded-[10px] p-3 text-center">
          <p className="text-[22px] font-[800] text-[#E07B2D] leading-none mb-0.5">{stats.pending}</p>
          <p className="text-[11px] text-[#888] font-medium">Pending</p>
        </div>
        <div className="bg-[#EBF4FF] rounded-[10px] p-3 text-center">
          <p className="text-[22px] font-[800] text-[#1A5FAC] leading-none mb-0.5">{stats.confirmed}</p>
          <p className="text-[11px] text-[#888] font-medium">Confirmed</p>
        </div>
        <div className="bg-[#F0FAF0] rounded-[10px] p-3 text-center">
          <p className="text-[22px] font-[800] text-[#16a34a] leading-none mb-0.5">{stats.completed}</p>
          <p className="text-[11px] text-[#888] font-medium">Completed</p>
        </div>
        <div className="bg-[#f5f0ff] rounded-[10px] p-3 text-center">
          <p className="text-[22px] font-[800] text-[#7c3aed] leading-none mb-0.5">{stats.leads}</p>
          <p className="text-[11px] text-[#888] font-medium">Leads</p>
        </div>
        <div className="bg-[#f5f5f5] rounded-[10px] p-3 text-center">
          <p className="text-[22px] font-[800] text-[#999] leading-none mb-0.5">{stats.cancelled}</p>
          <p className="text-[11px] text-[#888] font-medium">Cancelled</p>
        </div>
      </div>

      {/* ═══ Bookings List ═══ */}
      <div>
        <div className="w-full">
          {filtered.length === 0 ? (
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#0B2040] mb-2">
                No bookings found
              </h3>
              <p className="text-[14px] text-[#888]">
                Try changing your filters or check back later.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#eee]">
                      {["Date", "Customer", "Phone", "Service", "Source", "Status", "Actions"].map((h) => (
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
                              b.type === "lead"
                                ? "bg-[#f5f0ff] border-l-4 border-l-[#7c3aed]"
                                : bIsNew
                                  ? "bg-[#FFF8F0] border-l-4 border-l-[#E07B2D]"
                                  : isExpanded ? "bg-[#FAFBFC]" : "hover:bg-[#FAFBFC]"
                            }`}
                          >
                            <td className="px-4 py-3 text-[13px] text-[#444] whitespace-nowrap">
                              {formatTimestamp(b.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-[14px] font-semibold text-[#0B2040] whitespace-nowrap">
                              {b.name || "\u2014"}
                              {b.type === "lead" && (
                                <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-[#7c3aed]">LEAD</span>
                              )}
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
                                "\u2014"
                              )}
                            </td>
                            <td className="px-4 py-3 text-[13px] text-[#444] whitespace-nowrap max-w-[180px] truncate">
                              {getServiceLabel(b) || "\u2014"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold text-white ${source.color}`}>
                                {source.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${status.cls}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <StatusActions
                                status={b.status}
                                type={b.type}
                                onConfirm={() => {
                                  setSettingAppointmentId(b.id);
                                  setExpandedId(b.id);
                                }}
                                onComplete={() => updateStatus(b.id, "completed")}
                                onCancel={() => setCancelConfirmId(b.id)}
                                onDelete={() => setDeleteConfirmId(b.id)}
                                onConvertToBooking={() => convertToBooking(b.id)}
                                onContactCustomer={() => {
                                  setExpandedId(b.id);
                                }}
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
                                  onCreateInvoice={() => router.push(`/admin/invoicing?from=booking&id=${b.id}`)}
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
          )}
        </div>

      </div>

      {/* ═══ Cancel Confirmation Dialog ═══ */}
      {cancelConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[14px] shadow-xl max-w-[400px] w-full mx-4 p-6">
            <h3 className="text-[18px] font-bold text-[#0B2040] mb-2">Cancel this booking?</h3>
            <p className="text-[14px] text-[#666] mb-6">
              The customer will not be notified automatically.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCancelConfirmId(null)}
                className="px-4 py-2.5 text-[13px] font-semibold text-[#444] border border-[#ddd] rounded-md hover:bg-[#f5f5f5] transition-colors"
              >
                Never mind
              </button>
              <button
                onClick={() => cancelBooking(cancelConfirmId)}
                className="px-4 py-2.5 text-[13px] font-semibold text-white bg-[#dc2626] rounded-md hover:bg-[#b91c1c] transition-colors"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Delete Confirmation Dialog ═══ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[14px] shadow-xl max-w-[440px] w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#0B2040]">Permanently delete this booking?</h3>
            </div>
            <p className="text-[14px] text-[#dc2626] font-medium mb-1">
              This cannot be undone.
            </p>
            <p className="text-[14px] text-[#666] mb-6">
              All data and communication logs will be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 text-[13px] font-semibold text-[#444] border border-[#ddd] rounded-md hover:bg-[#f5f5f5] transition-colors"
              >
                Keep It
              </button>
              <button
                onClick={() => deleteBooking(deleteConfirmId)}
                className="px-4 py-2.5 text-[13px] font-semibold text-white bg-[#dc2626] rounded-md hover:bg-[#b91c1c] transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function StatusActions({
  status,
  type,
  onConfirm,
  onComplete,
  onCancel,
  onDelete,
  onConvertToBooking,
  onContactCustomer,
}: {
  status?: string;
  type?: string;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onConvertToBooking: () => void;
  onContactCustomer: () => void;
}) {
  const trashBtn = (
    <button
      onClick={onDelete}
      className="ml-2 p-1.5 text-[#aaa] hover:text-[#dc2626] transition-colors rounded"
      title="Delete"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </button>
  );

  if (type === "lead") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onContactCustomer}
          className="px-3 py-1.5 text-[12px] font-semibold text-white bg-[#7c3aed] rounded-md hover:bg-[#6d28d9] transition-colors"
        >
          Contact Customer
        </button>
        <button
          onClick={onConvertToBooking}
          className="px-3 py-1.5 text-[12px] font-semibold text-[#1A5FAC] border border-[#1A5FAC] rounded-md hover:bg-[#1A5FAC] hover:text-white transition-colors"
        >
          Convert to Booking
        </button>
        {trashBtn}
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2">
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
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-[12px] font-semibold text-[#dc2626] hover:bg-[#fef2f2] rounded-md transition-colors"
        >
          Cancel
        </button>
        {trashBtn}
      </div>
    );
  }
  if (status === "confirmed") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onComplete}
          className="px-3 py-1.5 text-[12px] font-semibold text-white bg-[#16a34a] rounded-md hover:bg-[#15803d] transition-colors"
        >
          Complete
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-[12px] font-semibold text-[#dc2626] hover:bg-[#fef2f2] rounded-md transition-colors"
        >
          Cancel
        </button>
        {trashBtn}
      </div>
    );
  }
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[#999]">Cancelled</span>
        {trashBtn}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
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
      {trashBtn}
    </div>
  );
}

const arrivalWindows = [
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
  onCreateInvoice,
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
  onCreateInvoice: () => void;
}) {
  const [apptDate, setApptDate] = useState(b.preferredDate || toISODate(new Date()));
  const [apptWindow, setApptWindow] = useState(
    b.timeWindow ? (timeWindowToArrival[b.timeWindow] || "8:00 - 9:00 AM") : "8:00 - 9:00 AM"
  );
  const [apptDuration, setApptDuration] = useState("Under 1 hour");

  const customerRows: { label: string; value?: string; href?: string }[] = [
    { label: "Name", value: b.name },
    { label: "Phone", value: formatPhone(b.phone), href: b.phone ? `tel:${b.phone}` : undefined },
    { label: "Email", value: b.email, href: b.email ? `mailto:${b.email}` : undefined },
    { label: "Address", value: b.address },
    { label: "Contact Pref", value: b.contactPreference },
    { label: "Source", value: b.source },
    { label: "Preferred Date", value: b.preferredDate },
    { label: "Dates Flexible", value: b.datesFlexible ? "Yes" : undefined },
    { label: "Notes", value: b.notes },
    { label: "Status", value: b.status },
    { label: "Service", value: getServiceLabel(b) },
    { label: "Category", value: b.serviceCategory },
    { label: "Time Window", value: formatTimeWindow(b.timeWindow) },
    { label: "Vehicle", value: [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") || undefined },
    { label: "VIN/Hull", value: b.vinOrHull },
    { label: "Vessel", value: [b.vesselYear, b.vesselMake, b.vesselModel].filter(Boolean).join(" ") || undefined },
    { label: "Zip", value: b.zip },
    { label: "Fleet Size", value: b.fleetSize },
    { label: "Engine Type", value: b.engineType },
    { label: "Engine Count", value: b.engineCount },
    { label: "Returning", value: b.returningCustomer ? "Yes" : undefined },
    { label: "Created", value: formatTimestamp(b.createdAt) },
    { label: "Updated", value: formatTimestamp(b.updatedAt) },
  ].filter((f) => f.value);

  return (
    <div className="bg-[#FAFBFC] border-t border-[#eee] px-6 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN - Customer Info */}
        <div>
          <div className="bg-white border border-[#e8e8e8] rounded-[10px] p-4">
            <h4 className="text-[14px] font-bold text-[#0B2040] mb-3 pb-2 border-b border-[#eee]">Customer Info</h4>
            {customerRows.map((r) => (
              <div key={r.label} className="flex justify-between items-start py-1.5 border-b border-[#f5f5f5] last:border-0">
                <span className="text-[12px] text-[#888] font-medium shrink-0">{r.label}</span>
                {r.href ? (
                  <a href={r.href} className="text-[13px] text-[#1A5FAC] font-medium hover:underline text-right" onClick={(e) => e.stopPropagation()}>{r.value}</a>
                ) : (
                  <span className="text-[13px] text-[#0B2040] font-medium text-right max-w-[60%] break-words">{r.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN - Actions & Communications */}
        <div>
      {/* Notification buttons */}
      <NotificationButtons
        bookingId={b.id}
        booking={b}
        phone={b.phone}
        email={b.email}
        onToast={onToast}
      />

      {/* Create Invoice button */}
      <div className="mb-5">
        <button
          onClick={onCreateInvoice}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-semibold text-white bg-[#1A5FAC] hover:bg-[#174f94] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Create Invoice
        </button>
      </div>

      {/* Confirmed appointment details */}
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

      {/* Appointment setter form */}
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
      </div>
    </div>
  );
}
