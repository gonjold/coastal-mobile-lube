"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminBadge from "@/components/admin/AdminBadge";
import PipelineCard from "@/components/admin/PipelineCard";
import {
  type Booking,
  getServiceLabel,
  getStatusStyle,
  toISODate,
} from "./shared";

/* ─── Invoice type (mirrors invoicing page) ─────────────── */
interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  createdAt?: { toDate: () => Date };
}

/* ─── Badge variant mapper ───────────────────────────────── */
function badgeVariant(status?: string): "green" | "red" | "amber" | "gray" | "blue" | "teal" {
  switch (status) {
    case "confirmed": return "blue";
    case "completed": return "green";
    case "pending": return "amber";
    case "cancelled": return "red";
    case "in-progress": return "teal";
    default: return "gray";
  }
}

export default function AdminHome() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

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
    const unsub2 = onSnapshot(
      qInvoices,
      (snap) => {
        setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice));
      },
      () => {},
    );

    return () => { unsub1(); unsub2(); };
  }, []);

  /* ── Today's date ── */
  const now = new Date();
  const todayISO = toISODate(now);
  const todayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  /* ── Week bounds ── */
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  /* ── Pipeline counts ── */
  const newLeads = bookings.filter(
    (b) => b.status === "new" || b.status === "new-lead" || b.type === "lead",
  ).length;
  const quoteRequests = bookings.filter(
    (b) => (b.source || "").toLowerCase().includes("quote"),
  ).length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const incomingTotal = newLeads + quoteRequests + pendingBookings;

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
  const todayBookings = bookings.filter((b) => {
    const date = b.confirmedDate || b.preferredDate;
    return date === todayISO && (b.status === "confirmed" || b.status === "in-progress");
  });
  const weekBookings = bookings.filter((b) => {
    const dateStr = b.confirmedDate || b.preferredDate;
    if (!dateStr) return false;
    const d = new Date(dateStr + "T00:00:00");
    return d >= startOfWeek && d <= endOfWeek;
  }).length;
  const scheduledTotal = confirmedBookings + todayBookings.length + weekBookings;

  const inProgress = bookings.filter((b) => b.status === "in-progress").length;
  const completedBookings = bookings.filter((b) => b.status === "completed");
  // TODO: wire up "needs invoice" - check for completed bookings without a linked invoiceId
  const needsInvoice = completedBookings.filter(
    (b) => !(b as unknown as Record<string, unknown>).invoiceId,
  ).length;
  const completedCount = completedBookings.length;
  const jobsTotal = inProgress + needsInvoice + completedCount;

  const sentInvoices = invoices.filter((i) => i.status === "sent");
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const invoiceTotal = sentInvoices.length + paidInvoices.length + overdueInvoices.length;

  const sumTotal = (arr: Invoice[]) =>
    arr.reduce((s, i) => s + (i.total || 0), 0);
  const fmt$ = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  /* ── Today's schedule list ── */
  const todaySchedule = todayBookings.length > 0 ? todayBookings : bookings.filter((b) => {
    const date = b.confirmedDate || b.preferredDate;
    return date === todayISO;
  });

  /* ── Action items ── */
  const actionItems: { label: string; urgency: string; action: string; href: string }[] = [];
  if (overdueInvoices.length > 0)
    actionItems.push({ label: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""}`, urgency: "red", action: "View", href: "/admin/invoicing" });
  if (needsInvoice > 0)
    actionItems.push({ label: `${needsInvoice} completed job${needsInvoice > 1 ? "s" : ""} need invoicing`, urgency: "red", action: "Invoice", href: "/admin/invoicing" });
  if (pendingBookings > 0)
    actionItems.push({ label: `${pendingBookings} unconfirmed booking${pendingBookings > 1 ? "s" : ""}`, urgency: "#F59E0B", action: "Review", href: "/admin/schedule" });
  if (quoteRequests > 0)
    actionItems.push({ label: `${quoteRequests} quote request${quoteRequests > 1 ? "s" : ""} awaiting response`, urgency: "#1A5FAC", action: "Review", href: "/admin/schedule" });

  /* ── Revenue summary (placeholder data where Firestore doesn't provide) ── */
  // TODO: wire up real revenue aggregation queries from Firestore
  const thisMonthRevenue = sumTotal(paidInvoices);
  const outstanding = sumTotal(sentInvoices) + sumTotal(overdueInvoices);
  const avgJobValue = paidInvoices.length > 0 ? thisMonthRevenue / paidInvoices.length : 0;
  const currentInvoiceAmount = sumTotal(sentInvoices);
  const overdueAmount = sumTotal(overdueInvoices);
  const agingTotal = currentInvoiceAmount + overdueAmount || 1; // avoid /0

  if (loading) {
    return (
      <>
        <AdminTopBar title="Dashboard" subtitle={todayLabel} />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminTopBar title="Dashboard" subtitle={todayLabel} />

      <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
        {/* ═══ PIPELINE CARDS ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <PipelineCard
            title="Incoming"
            accentColor="#1A5FAC"
            total={incomingTotal}
            rows={[
              { label: "New Leads", count: newLeads, dotColor: "#1A5FAC" },
              { label: "Quote Requests", count: quoteRequests, dotColor: "#F59E0B", amount: fmt$(sumTotal(sentInvoices)) },
              { label: "Pending Bookings", count: pendingBookings, dotColor: "#F59E0B" },
            ]}
            actionLabel="Review Incoming"
            onAction={() => router.push("/admin/schedule")}
          />

          <PipelineCard
            title="Scheduled"
            accentColor="#16A34A"
            total={scheduledTotal}
            rows={[
              { label: "Confirmed", count: confirmedBookings, dotColor: "#16A34A" },
              { label: "Today", count: todayBookings.length, dotColor: "#0D8A8F" },
              { label: "This Week", count: weekBookings, dotColor: "#1A5FAC" },
            ]}
            actionLabel="View Schedule"
            onAction={() => router.push("/admin/schedule")}
          />

          <PipelineCard
            title="Jobs"
            accentColor="#E07B2D"
            total={jobsTotal}
            rows={[
              { label: "In Progress", count: inProgress, dotColor: "#E07B2D" },
              { label: "Needs Invoice", count: needsInvoice, dotColor: "#dc2626", amount: fmt$(needsInvoice * 150) },
              { label: "Completed", count: completedCount, dotColor: "#16A34A", amount: fmt$(completedCount * 185) },
            ]}
            actionLabel="Create Invoice"
            onAction={() => router.push("/admin/invoicing")}
          />

          <PipelineCard
            title="Invoices"
            accentColor="#0B2040"
            total={invoiceTotal}
            rows={[
              { label: "Sent", count: sentInvoices.length, dotColor: "#1A5FAC", amount: fmt$(sumTotal(sentInvoices)) },
              { label: "Paid", count: paidInvoices.length, dotColor: "#16A34A", amount: fmt$(sumTotal(paidInvoices)) },
              { label: "Overdue", count: overdueInvoices.length, dotColor: "#dc2626", amount: fmt$(sumTotal(overdueInvoices)) },
            ]}
            actionLabel="View Invoices"
            onAction={() => router.push("/admin/invoicing")}
          />
        </div>

        {/* ═══ BOTTOM SECTION ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── Today's Schedule ── */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 flex justify-between items-center border-b border-gray-200">
              <div>
                <h2 className="text-[15px] font-bold text-[#0B2040]">
                  Today&apos;s Schedule
                </h2>
                <p className="text-xs text-gray-500">
                  {todaySchedule.length} booking{todaySchedule.length !== 1 ? "s" : ""} today
                </p>
              </div>
              <button
                onClick={() => router.push("/admin/schedule")}
                className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-[#1A5FAC] hover:bg-[#1A5FAC] hover:text-white hover:border-[#1A5FAC] transition cursor-pointer"
              >
                Full Schedule
              </button>
            </div>

            {todaySchedule.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                No bookings scheduled for today.
              </div>
            ) : (
              todaySchedule.map((b) => {
                const statusInfo = getStatusStyle(b.status);
                return (
                  <div
                    key={b.id}
                    onClick={() => router.push("/admin/schedule")}
                    className="flex items-center px-5 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <span className="text-[13px] font-semibold text-gray-500 min-w-[60px] flex-shrink-0">
                      {b.confirmedArrivalWindow
                        ? b.confirmedArrivalWindow.split(" - ")[0] || b.confirmedArrivalWindow
                        : b.timeWindow || "TBD"}
                    </span>
                    <div className="flex-1 min-w-0 ml-3">
                      <p className="text-sm font-semibold text-[#0B2040] truncate">
                        {b.name || b.customerName || "—"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {getServiceLabel(b)}
                        {(b.vehicleYear || b.vehicleMake) && ` • ${[b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ")}`}
                      </p>
                    </div>
                    <AdminBadge label={statusInfo.label} variant={badgeVariant(b.status)} />
                  </div>
                );
              })
            )}
          </div>

          {/* ── Right Column: Action Items + Revenue ── */}
          <div className="flex flex-col gap-4">
            {/* Action Items */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-[15px] font-bold text-[#0B2040]">
                  Needs Attention
                </h2>
                <p className="text-xs text-gray-500">
                  {actionItems.length} item{actionItems.length !== 1 ? "s" : ""}
                </p>
              </div>

              {actionItems.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-gray-400">
                  All caught up!
                </div>
              ) : (
                actionItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.urgency }}
                      />
                      <span className="text-[13px] text-[#0B2040]">
                        {item.label}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(item.href)}
                      className="px-3 py-1 rounded-md border border-gray-200 text-xs font-semibold text-[#1A5FAC] hover:bg-[#1A5FAC] hover:text-white hover:border-[#1A5FAC] transition cursor-pointer"
                    >
                      {item.action}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Revenue Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-[15px] font-bold text-[#0B2040] mb-4">
                Revenue Summary
              </h2>

              {/* Three stats */}
              <div className="flex items-stretch">
                {/* This Month */}
                <div className="flex-1 text-center">
                  <p className="text-[26px] font-bold text-[#0B2040]">
                    {fmt$(thisMonthRevenue)}
                  </p>
                  <p className="text-xs text-gray-500 mb-0.5">This Month</p>
                  {/* TODO: compute real trend from prior month */}
                  <span className="text-xs font-semibold text-emerald-600">
                    +12%
                  </span>
                </div>

                <div className="w-px bg-gray-200 self-stretch" />

                {/* Outstanding */}
                <div className="flex-1 text-center">
                  <p className="text-[26px] font-bold text-[#0B2040]">
                    {fmt$(outstanding)}
                  </p>
                  <p className="text-xs text-gray-500 mb-0.5">Outstanding</p>
                  {overdueInvoices.length > 0 && (
                    <span className="text-xs font-semibold text-red-600">
                      {overdueInvoices.length} overdue
                    </span>
                  )}
                </div>

                <div className="w-px bg-gray-200 self-stretch" />

                {/* Avg Job Value */}
                <div className="flex-1 text-center">
                  <p className="text-[26px] font-bold text-[#0B2040]">
                    {fmt$(avgJobValue)}
                  </p>
                  <p className="text-xs text-gray-500 mb-0.5">Avg Job Value</p>
                  {/* TODO: compute real trend */}
                  <span className="text-xs font-semibold text-emerald-600">
                    +5%
                  </span>
                </div>
              </div>

              {/* Invoice Aging bar */}
              <div className="mt-4">
                <p className="text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                  Invoice Aging
                </p>
                <div className="flex h-2.5 rounded-md overflow-hidden gap-0.5">
                  <div
                    className="bg-emerald-500 rounded-sm"
                    style={{
                      width: `${(currentInvoiceAmount / agingTotal) * 100}%`,
                    }}
                  />
                  {/* TODO: split 30-60 day vs 60+ when data is available */}
                  <div
                    className="bg-amber-400 rounded-sm"
                    style={{ width: "15%" }}
                  />
                  <div
                    className="bg-red-500 rounded-sm"
                    style={{
                      width: `${(overdueAmount / agingTotal) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                    <span className="text-[11px] text-gray-500">
                      Current {fmt$(currentInvoiceAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-amber-400" />
                    <span className="text-[11px] text-gray-500">30-60 days</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-red-500" />
                    <span className="text-[11px] text-gray-500">
                      60+ days {fmt$(overdueAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
