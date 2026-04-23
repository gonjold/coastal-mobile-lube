"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import DashboardDrilldownModal from "@/components/admin/DashboardDrilldownModal";
import CustomerProfilePanel, { type PanelInvoice } from "@/components/admin/CustomerProfilePanel";
import { useAdminModal } from "@/contexts/AdminModalContext";
import {
  type Booking,
  buildCustomerList,
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
  isTest?: boolean;
}

/* ─── Time formatting for schedule display ────────────────── */
const TIME_WINDOW_LABELS: Record<string, string> = {
  "early-morning": "7:00 AM",
  earlyMorning: "7:00 AM",
  morning: "9:00 AM",
  midday: "11:00 AM",
  afternoon: "1:00 PM",
  "late-afternoon": "3:00 PM",
  lateAfternoon: "3:00 PM",
  late: "4:00 PM",
};

function formatBookingTime(b: Booking): string {
  if (b.confirmedArrivalWindow) {
    return b.confirmedArrivalWindow.split(" - ")[0] || b.confirmedArrivalWindow;
  }
  if (b.timeWindow) {
    return TIME_WINDOW_LABELS[b.timeWindow] || b.timeWindow;
  }
  return "TBD";
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
  return (
    <Suspense
      fallback={
        <>
          <AdminTopBar title="Dashboard" />
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
          </div>
        </>
      }
    >
      <AdminHomeInner />
    </Suspense>
  );
}

function AdminHomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showTest = searchParams.get("showTest") === "1";
  const { activeModal, preFill, closeModal } = useAdminModal();
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

  /* ── Drilldown modal ── */
  const [drilldown, setDrilldown] = useState<{ title: string; filterKey: string; type: "booking" | "invoice" } | null>(null);

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

  /* ── Test-data visibility (mirrors /admin/schedule, /customers, /invoicing) ── */
  const visibleBookings = showTest ? bookings : bookings.filter((b) => b.isTest !== true);
  const visibleInvoices = showTest ? invoices : invoices.filter((i) => i.isTest !== true);

  /* ── Pipeline counts (exclude dead leads) ── */
  const activeBookings = visibleBookings.filter((b) => b.status !== "dead");
  const newLeads = activeBookings.filter(
    (b) => b.status === "new" || b.status === "new-lead" || b.type === "lead",
  ).length;
  const quoteRequests = activeBookings.filter(
    (b) => (b.source || "").toLowerCase().includes("quote"),
  ).length;
  const pendingBookings = activeBookings.filter((b) => b.status === "pending").length;
  const incomingTotal = newLeads + quoteRequests + pendingBookings;

  const confirmedBookings = activeBookings.filter((b) => b.status === "confirmed").length;
  const todayBookings = activeBookings.filter((b) => {
    const date = b.confirmedDate || b.preferredDate;
    return date === todayISO && (b.status === "confirmed" || b.status === "in-progress");
  });
  const weekBookings = activeBookings.filter((b) => {
    const dateStr = b.confirmedDate || b.preferredDate;
    if (!dateStr) return false;
    const d = new Date(dateStr + "T00:00:00");
    return d >= startOfWeek && d <= endOfWeek;
  }).length;
  const scheduledTotal = confirmedBookings + todayBookings.length + weekBookings;

  const inProgress = activeBookings.filter((b) => b.status === "in-progress").length;
  const completedBookings = activeBookings.filter((b) => b.status === "completed");
  // TODO: wire up "needs invoice" - check for completed bookings without a linked invoiceId
  const needsInvoice = completedBookings.filter(
    (b) => !(b as unknown as Record<string, unknown>).invoiceId,
  ).length;
  const completedCount = completedBookings.length;
  const jobsTotal = inProgress + needsInvoice + completedCount;

  const sentInvoices = visibleInvoices.filter((i) => i.status === "sent");
  const paidInvoices = visibleInvoices.filter((i) => i.status === "paid");
  const overdueInvoices = visibleInvoices.filter((i) => i.status === "overdue");
  const invoiceTotal = sentInvoices.length + paidInvoices.length + overdueInvoices.length;

  /* ── Sparkline: daily counts for last 7 days ── */
  const last7Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(toISODate(d));
    }
    return days;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayISO]);

  const countPerDay = (
    records: { createdAt?: { toDate: () => Date } }[],
    filter: (r: Booking | Invoice) => boolean,
    days: string[],
  ): number[] => {
    const filtered = (records as (Booking | Invoice)[]).filter(filter);
    return days.map(
      (day) =>
        filtered.filter((r) => {
          const ca = (r as { createdAt?: { toDate: () => Date } }).createdAt;
          if (!ca?.toDate) return false;
          return toISODate(ca.toDate()) === day;
        }).length,
    );
  };

  const incomingSparkline = useMemo(
    () =>
      countPerDay(
        visibleBookings,
        (b) => {
          const bk = b as Booking;
          return (
            bk.status === "pending" ||
            bk.status === "new-lead" ||
            (bk.source || "").toLowerCase().includes("quote")
          );
        },
        last7Days,
      ),
    [visibleBookings, last7Days],
  );

  const scheduledSparkline = useMemo(
    () =>
      countPerDay(
        visibleBookings,
        (b) => (b as Booking).status === "confirmed",
        last7Days,
      ),
    [visibleBookings, last7Days],
  );

  const jobsSparkline = useMemo(
    () =>
      countPerDay(
        visibleBookings,
        (b) => {
          const s = (b as Booking).status;
          return s === "in-progress" || s === "completed";
        },
        last7Days,
      ),
    [visibleBookings, last7Days],
  );

  const invoicesSparkline = useMemo(
    () => countPerDay(visibleInvoices, () => true, last7Days),
    [visibleInvoices, last7Days],
  );

  const sumTotal = (arr: Invoice[]) =>
    arr.reduce((s, i) => s + (i.total || 0), 0);
  const fmt$ = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  /* ── Today's schedule list ── */
  const todaySchedule = todayBookings.length > 0 ? todayBookings : visibleBookings.filter((b) => {
    const date = b.confirmedDate || b.preferredDate;
    return date === todayISO;
  });

  /* ── Action items ── */
  const actionItems: { label: string; urgency: string; action: string; href: string }[] = [];
  if (overdueInvoices.length > 0)
    actionItems.push({ label: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""}`, urgency: "red", action: "View", href: "/admin/invoicing?filter=overdue" });
  if (needsInvoice > 0)
    actionItems.push({ label: `${needsInvoice} completed job${needsInvoice > 1 ? "s" : ""} need invoicing`, urgency: "red", action: "Invoice", href: "/admin/invoicing" });
  if (pendingBookings > 0)
    actionItems.push({ label: `${pendingBookings} unconfirmed booking${pendingBookings > 1 ? "s" : ""}`, urgency: "#F59E0B", action: "Review", href: "/admin/schedule?filter=pending" });
  if (quoteRequests > 0)
    actionItems.push({ label: `${quoteRequests} quote request${quoteRequests > 1 ? "s" : ""} awaiting response`, urgency: "#1A5FAC", action: "Review", href: "/admin/schedule?filter=pending" });

  /* ── Drilldown filter logic ── */
  function handleDrilldownClick(filterKey: string) {
    const filterMap: Record<string, { title: string; type: "booking" | "invoice" }> = {
      new_leads: { title: "New Leads", type: "booking" },
      quote_requests: { title: "Quote Requests", type: "booking" },
      pending_bookings: { title: "Pending Bookings", type: "booking" },
      confirmed: { title: "Confirmed", type: "booking" },
      today: { title: "Today", type: "booking" },
      this_week: { title: "This Week", type: "booking" },
      in_progress: { title: "In Progress", type: "booking" },
      needs_invoice: { title: "Needs Invoice", type: "booking" },
      completed: { title: "Completed", type: "booking" },
      sent_invoices: { title: "Sent Invoices", type: "invoice" },
      paid_invoices: { title: "Paid Invoices", type: "invoice" },
      overdue_invoices: { title: "Overdue Invoices", type: "invoice" },
    };
    const info = filterMap[filterKey];
    if (info) setDrilldown({ ...info, filterKey });
  }

  const drilldownBookings = useMemo(() => {
    if (!drilldown || drilldown.type !== "booking") return [];
    switch (drilldown.filterKey) {
      case "new_leads": return activeBookings.filter((b) => b.status === "new" || b.status === "new-lead" || b.type === "lead");
      case "quote_requests": return activeBookings.filter((b) => (b.source || "").toLowerCase().includes("quote"));
      case "pending_bookings": return activeBookings.filter((b) => b.status === "pending");
      case "confirmed": return activeBookings.filter((b) => b.status === "confirmed");
      case "today": return todayBookings;
      case "this_week": return activeBookings.filter((b) => {
        const dateStr = b.confirmedDate || b.preferredDate;
        if (!dateStr) return false;
        const d = new Date(dateStr + "T00:00:00");
        return d >= startOfWeek && d <= endOfWeek;
      });
      case "in_progress": return activeBookings.filter((b) => b.status === "in-progress");
      case "needs_invoice": return completedBookings.filter((b) => !(b as unknown as Record<string, unknown>).invoiceId);
      case "completed": return completedBookings;
      default: return [];
    }
  }, [drilldown, activeBookings, todayBookings, completedBookings, startOfWeek, endOfWeek]);

  const drilldownInvoices = useMemo(() => {
    if (!drilldown || drilldown.type !== "invoice") return [];
    switch (drilldown.filterKey) {
      case "sent_invoices": return sentInvoices;
      case "paid_invoices": return paidInvoices;
      case "overdue_invoices": return overdueInvoices;
      default: return [];
    }
  }, [drilldown, sentInvoices, paidInvoices, overdueInvoices]);

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
              { label: "New Leads", count: newLeads, dotColor: "#1A5FAC", filterKey: "new_leads" },
              { label: "Quote Requests", count: quoteRequests, dotColor: "#F59E0B", amount: fmt$(sumTotal(sentInvoices)), filterKey: "quote_requests" },
              { label: "Pending Bookings", count: pendingBookings, dotColor: "#F59E0B", filterKey: "pending_bookings" },
            ]}
            actionLabel="Review Incoming"
            onAction={() => router.push("/admin/schedule?filter=pending")}
            onRowClick={handleDrilldownClick}
            sparklineData={incomingSparkline}
          />

          <PipelineCard
            title="Scheduled"
            accentColor="#16A34A"
            total={scheduledTotal}
            rows={[
              { label: "Confirmed", count: confirmedBookings, dotColor: "#16A34A", filterKey: "confirmed" },
              { label: "Today", count: todayBookings.length, dotColor: "#0D8A8F", filterKey: "today" },
              { label: "This Week", count: weekBookings, dotColor: "#1A5FAC", filterKey: "this_week" },
            ]}
            actionLabel="View Schedule"
            onAction={() => router.push("/admin/schedule")}
            onRowClick={handleDrilldownClick}
            sparklineData={scheduledSparkline}
          />

          <PipelineCard
            title="Jobs"
            accentColor="#E07B2D"
            total={jobsTotal}
            rows={[
              { label: "In Progress", count: inProgress, dotColor: "#E07B2D", filterKey: "in_progress" },
              { label: "Needs Invoice", count: needsInvoice, dotColor: "#dc2626", amount: fmt$(needsInvoice * 150), filterKey: "needs_invoice" },
              { label: "Completed", count: completedCount, dotColor: "#16A34A", amount: fmt$(completedCount * 185), filterKey: "completed" },
            ]}
            actionLabel="Create Invoice"
            onAction={() => router.push("/admin/invoicing")}
            onRowClick={handleDrilldownClick}
            sparklineData={jobsSparkline}
          />

          <PipelineCard
            title="Invoices"
            accentColor="#0B2040"
            total={invoiceTotal}
            rows={[
              { label: "Sent", count: sentInvoices.length, dotColor: "#1A5FAC", amount: fmt$(sumTotal(sentInvoices)), filterKey: "sent_invoices" },
              { label: "Paid", count: paidInvoices.length, dotColor: "#16A34A", amount: fmt$(sumTotal(paidInvoices)), filterKey: "paid_invoices" },
              { label: "Overdue", count: overdueInvoices.length, dotColor: "#dc2626", amount: fmt$(sumTotal(overdueInvoices)), filterKey: "overdue_invoices" },
            ]}
            actionLabel="View Invoices"
            onAction={() => router.push("/admin/invoicing")}
            onRowClick={handleDrilldownClick}
            sparklineData={invoicesSparkline}
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
                      {formatBookingTime(b)}
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

      {/* Drilldown Modal */}
      {drilldown && (
        <DashboardDrilldownModal
          title={drilldown.title}
          type={drilldown.type}
          bookings={drilldown.type === "booking" ? drilldownBookings : undefined}
          invoices={drilldown.type === "invoice" ? drilldownInvoices : undefined}
          onClose={() => setDrilldown(null)}
          viewAllHref={drilldown.type === "booking" ? "/admin/schedule" : "/admin/invoicing"}
          viewAllLabel={drilldown.type === "booking" ? "View All in Schedule" : "View All in Invoicing"}
        />
      )}

      {/* Customer Profile Panel (from global search or drilldown clicks) */}
      {activeModal === "customer-profile" && preFill?.customer && (() => {
        const c = preFill.customer;
        const custName = c.name.toLowerCase();
        const custPhone = c.phone?.replace(/\D/g, "");
        const custEmail = c.email?.toLowerCase();

        const customerBookings = visibleBookings.filter((b) => {
          const bName = (b.name || b.customerName || "").toLowerCase();
          const bPhone = (b.phone || b.customerPhone || "").replace(/\D/g, "");
          const bEmail = (b.email || b.customerEmail || "").toLowerCase();
          if (custName && bName === custName) return true;
          if (custPhone && bPhone === custPhone) return true;
          if (custEmail && bEmail === custEmail) return true;
          return false;
        });

        const customerInvoices: PanelInvoice[] = visibleInvoices
          .filter((inv) => inv.customerName.toLowerCase() === custName)
          .map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            total: inv.total,
            status: inv.status,
            invoiceDate: "",
            createdAt: inv.createdAt,
          }));

        const completed = customerBookings.filter((b) => b.status === "completed" || b.status === "invoiced");
        const totalSpent = customerInvoices
          .filter((i) => i.status === "paid")
          .reduce((sum, i) => sum + (i.total || 0), 0);

        return (
          <CustomerProfilePanel
            customer={{
              name: c.name,
              phone: c.phone,
              email: c.email,
              address: c.address,
              type: "Residential",
              status: completed.length > 0 ? "Active" : "Lead",
              totalSpent,
              jobCount: customerBookings.length,
              lastVisit: completed[0]?.createdAt?.toDate?.()
                ? completed[0].createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Not yet",
              customerSince: customerBookings.length > 0 && customerBookings[customerBookings.length - 1]?.createdAt?.toDate?.()
                ? customerBookings[customerBookings.length - 1].createdAt!.toDate().toLocaleDateString("en-US", { month: "short", year: "numeric" })
                : "—",
            }}
            bookings={customerBookings}
            invoices={customerInvoices}
            onClose={closeModal}
          />
        );
      })()}
    </>
  );
}
