"use client";

import { useState, useMemo } from "react";
import AdminBadge from "./AdminBadge";
import {
  type Booking,
  formatPhone,
  getServiceLabel,
  getSourceLabel,
} from "@/app/admin/shared";

/* ── Types ── */

export interface PanelInvoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  invoiceDate: string;
  createdAt?: { toDate: () => Date };
}

export interface CustomerForPanel {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: string;
  status: string;
  notes?: string;
  totalSpent: number;
  jobCount: number;
  lastVisit: string;
  customerSince: string;
}

interface TimelineEntry {
  id: string;
  type: "booking" | "invoice" | "comm";
  title: string;
  amount?: number;
  date: Date;
  status?: string;
  statusVariant?: "green" | "red" | "amber" | "gray" | "blue" | "teal";
  vehicle?: string;
  channel?: string;
}

/* ── Helpers ── */

function getVehicleName(b: Booking): string {
  return (
    [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") ||
    [b.vesselYear, b.vesselMake, b.vesselModel].filter(Boolean).join(" ") ||
    ""
  );
}

function getStatusBadgeVariant(status?: string): "green" | "red" | "amber" | "gray" | "blue" | "teal" {
  switch (status) {
    case "pending": return "amber";
    case "confirmed": return "blue";
    case "in-progress": return "teal";
    case "completed": return "green";
    case "cancelled": return "red";
    case "paid": return "green";
    case "sent": return "blue";
    case "draft": return "gray";
    case "overdue": return "red";
    default: return "gray";
  }
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case "pending": return "Pending";
    case "confirmed": return "Confirmed";
    case "in-progress": return "In Progress";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    case "invoiced": return "Invoiced";
    case "new-lead": return "New Lead";
    case "draft": return "Draft";
    case "sent": return "Sent";
    case "paid": return "Paid";
    case "overdue": return "Overdue";
    default: return status || "—";
  }
}

/* ── Main Panel ── */

export default function CustomerProfilePanel({
  customer,
  bookings,
  invoices,
  onClose,
}: {
  customer: CustomerForPanel | null;
  bookings: Booking[];
  invoices: PanelInvoice[];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"timeline" | "details" | "vehicles">("timeline");
  const [timelineFilter, setTimelineFilter] = useState<"all" | "bookings" | "invoices" | "comms">("all");

  /* Build vehicles list */
  const vehicles = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach((b) => {
      const v = getVehicleName(b);
      if (v) map.set(v, (map.get(v) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, bookingCount: count }));
  }, [bookings]);

  /* Build timeline */
  const timeline = useMemo(() => {
    const entries: TimelineEntry[] = [];

    bookings.forEach((b) => {
      const date = b.createdAt?.toDate?.() || new Date();

      // Booking entry
      entries.push({
        id: `booking-${b.id}`,
        type: "booking",
        title: getServiceLabel(b) || "Booking",
        amount: b.selectedServices?.reduce((sum, s) => sum + (s.price || 0), 0) || undefined,
        date,
        status: getStatusLabel(b.status),
        statusVariant: getStatusBadgeVariant(b.status),
        vehicle: getVehicleName(b) || undefined,
      });

      // TODO: Replace with proper communications logging system
      // Generate comm entry from booking creation
      const source = getSourceLabel(b.source);
      entries.push({
        id: `comm-booking-${b.id}`,
        type: "comm",
        title: `New booking via ${source.label}`,
        date,
        channel: b.source?.includes("email") ? "Email" : b.source === "admin-manual" ? "Phone" : "Web",
      });

      // Add commsLog entries if available
      (b.commsLog || []).forEach((entry, i) => {
        entries.push({
          id: `comm-${b.id}-${i}`,
          type: "comm",
          title: entry.summary,
          date: new Date(entry.createdAt),
          channel: entry.type === "text" ? "SMS" : entry.type === "email" ? "Email" : entry.type === "call" ? "Phone" : "Web",
        });
      });
    });

    invoices.forEach((inv) => {
      const date = inv.createdAt?.toDate?.() || new Date(inv.invoiceDate);
      entries.push({
        id: `invoice-${inv.id}`,
        type: "invoice",
        title: `Invoice ${inv.invoiceNumber}`,
        amount: inv.total,
        date,
        status: getStatusLabel(inv.status),
        statusVariant: getStatusBadgeVariant(inv.status),
      });
    });

    entries.sort((a, b) => b.date.getTime() - a.date.getTime());
    return entries;
  }, [bookings, invoices]);

  if (!customer) return null;

  const filteredTimeline = timelineFilter === "all"
    ? timeline
    : timeline.filter((e) => {
        if (timelineFilter === "bookings") return e.type === "booking";
        if (timelineFilter === "invoices") return e.type === "invoice";
        if (timelineFilter === "comms") return e.type === "comm";
        return true;
      });

  /* Avatar initials */
  const nameParts = customer.name.split(/\s+/).filter(Boolean);
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : (nameParts[0]?.[0] || "?").toUpperCase();

  const isCommercial = customer.type === "Commercial";
  const avatarBg = isCommercial ? "bg-[#1A5FAC]" : "bg-[#0B2040]";
  const typeBadgeVariant: "blue" | "gray" = isCommercial ? "blue" : "gray";
  const statusBadgeVariant: "green" | "amber" | "gray" = customer.status === "Active" ? "green" : customer.status === "Lead" ? "amber" : "gray";

  const tabs = [
    { key: "timeline" as const, label: "Timeline" },
    { key: "details" as const, label: "Details" },
    { key: "vehicles" as const, label: `Vehicles (${vehicles.length})` },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/15 z-[55]" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 w-[480px] h-screen bg-white border-l border-gray-200 z-[60] flex flex-col"
        style={{ boxShadow: "-8px 0 32px rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex gap-3.5 items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[17px] font-bold text-white ${avatarBg}`}>
                {initials}
              </div>
              <div>
                <div className="text-lg font-bold text-[#0B2040]">{customer.name}</div>
                <div className="flex gap-1.5 mt-1">
                  <AdminBadge label={customer.type} variant={typeBadgeVariant} />
                  <AdminBadge label={customer.status} variant={statusBadgeVariant} />
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-xl text-gray-500 cursor-pointer hover:text-gray-700 transition p-1">
              ✕
            </button>
          </div>

          {/* Quick stats */}
          <div className="mt-4 bg-[#F7F8FA] rounded-[10px] overflow-hidden flex">
            {[
              { label: "Total Spent", value: customer.totalSpent > 0 ? `$${customer.totalSpent.toLocaleString()}` : "$0" },
              { label: "Jobs", value: String(customer.jobCount) },
              { label: "Last Visit", value: customer.lastVisit || "Not yet" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`flex-1 py-3 px-3.5 text-center ${i > 0 ? "border-l border-gray-200" : ""}`}
              >
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.05em] mb-1">{stat.label}</div>
                <div className="text-base font-bold text-[#0B2040]">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-[13px] cursor-pointer transition ${
                activeTab === tab.key
                  ? "font-semibold text-[#0B2040] border-b-2 border-[#E07B2D]"
                  : "font-medium text-gray-500 border-b-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "timeline" && (
            <TimelineTab
              entries={filteredTimeline}
              filter={timelineFilter}
              onFilterChange={setTimelineFilter}
            />
          )}
          {activeTab === "details" && <DetailsTab customer={customer} />}
          {activeTab === "vehicles" && <VehiclesTab vehicles={vehicles} />}
        </div>

        {/* Bottom action bar */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-2.5">
          <button
            onClick={() => alert("New Booking — coming soon")}
            className="flex-1 py-2.5 bg-[#E07B2D] rounded-[10px] text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition"
          >
            New Booking
          </button>
          <button
            onClick={() => alert("New Invoice — coming soon")}
            className="flex-1 py-2.5 bg-transparent border border-gray-200 rounded-[10px] text-[#16A34A] text-sm font-semibold cursor-pointer hover:bg-green-50 hover:border-green-600 transition"
          >
            New Invoice
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Timeline Tab ── */

const CHANNEL_COLORS: Record<string, string> = {
  SMS: "bg-blue-100 text-blue-700",
  Email: "bg-amber-100 text-amber-700",
  Phone: "bg-green-100 text-green-700",
  Web: "bg-purple-100 text-purple-700",
};

const DOT_COLORS: Record<string, string> = {
  booking: "bg-[#1A5FAC]",
  invoice: "bg-[#16A34A]",
  comm: "bg-[#6B7280]",
};

function TimelineTab({
  entries,
  filter,
  onFilterChange,
}: {
  entries: TimelineEntry[];
  filter: string;
  onFilterChange: (f: "all" | "bookings" | "invoices" | "comms") => void;
}) {
  const pills: { key: "all" | "bookings" | "invoices" | "comms"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "bookings", label: "Bookings" },
    { key: "invoices", label: "Invoices" },
    { key: "comms", label: "Comms" },
  ];

  return (
    <>
      {/* Filter pills */}
      <div className="flex gap-1.5 mb-4">
        {pills.map((pill) => (
          <button
            key={pill.key}
            onClick={() => onFilterChange(pill.key)}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
              filter === pill.key
                ? "bg-[#0B2040] text-white"
                : "bg-transparent text-gray-500"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Timeline feed */}
      <div className="relative">
        {entries.length > 1 && (
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />
        )}

        {entries.map((entry) => (
          <div key={entry.id} className="flex gap-3.5 mb-1 relative">
            {/* Dot */}
            <div className="w-8 flex justify-center pt-3">
              <div className={`w-2.5 h-2.5 rounded-full z-[2] border-2 border-white ${DOT_COLORS[entry.type]}`} />
            </div>

            {/* Card */}
            <div
              className={`flex-1 bg-white border border-gray-200 rounded-[10px] p-3 px-3.5 mb-1 ${
                entry.type !== "comm" ? "cursor-pointer hover:bg-gray-50" : ""
              }`}
            >
              <div className="flex justify-between">
                <span className="text-[13px] font-semibold text-[#0B2040]">{entry.title}</span>
                {entry.amount != null && entry.amount > 0 && (
                  <span className="text-[13px] font-semibold text-[#0B2040]">
                    ${entry.amount.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {entry.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                {entry.status && entry.statusVariant && (
                  <AdminBadge label={entry.status} variant={entry.statusVariant} />
                )}
                {entry.vehicle && (
                  <span className="text-[11px] text-gray-500">{entry.vehicle}</span>
                )}
                {entry.channel && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CHANNEL_COLORS[entry.channel] || "bg-gray-100 text-gray-600"}`}>
                    {entry.channel}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <p className="text-[13px] text-gray-500 italic">No timeline entries</p>
        )}
      </div>
    </>
  );
}

/* ── Details Tab ── */

function DetailsTab({ customer }: { customer: CustomerForPanel }) {
  return (
    <>
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em] mb-3">Contact Information</p>
      {([
        { label: "Phone", value: customer.phone ? formatPhone(customer.phone) : "—", href: customer.phone ? `tel:${customer.phone}` : undefined },
        { label: "Email", value: customer.email || "—", href: customer.email ? `mailto:${customer.email}` : undefined },
        { label: "Address", value: customer.address || "—" },
        { label: "Customer Since", value: customer.customerSince || "—" },
        { label: "Type", value: customer.type },
      ] as { label: string; value: string; href?: string }[]).map((row) => (
        <div key={row.label} className="flex justify-between py-2 border-b border-gray-50">
          <span className="text-[13px] text-gray-500">{row.label}</span>
          {row.href ? (
            <a href={row.href} className="text-[13px] font-medium text-[#1A5FAC] cursor-pointer">
              {row.value}
            </a>
          ) : (
            <span className="text-[13px] font-medium text-[#0B2040]">{row.value}</span>
          )}
        </div>
      ))}

      <button
        onClick={() => alert("Edit Customer — coming soon")}
        className="w-full py-2.5 rounded-lg border border-gray-200 text-[13px] font-semibold text-[#1A5FAC] hover:bg-gray-50 mt-4 cursor-pointer transition"
      >
        Edit Customer
      </button>

      {/* Notes */}
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em] mb-3 mt-6">Notes</p>
      <div className="bg-[#F7F8FA] rounded-[10px] p-3.5">
        <p className={`text-[13px] ${customer.notes ? "text-[#0B2040]" : "italic text-gray-500"}`}>
          {customer.notes || "No notes."}
        </p>
      </div>
    </>
  );
}

/* ── Vehicles Tab ── */

function VehiclesTab({ vehicles }: { vehicles: { name: string; bookingCount: number }[] }) {
  return (
    <>
      {vehicles.map((v) => (
        <div key={v.name} className="bg-[#F7F8FA] rounded-[10px] p-3.5 mb-2 flex justify-between items-center">
          <div>
            <div className="text-sm font-semibold text-[#0B2040]">{v.name}</div>
            <div className="text-xs text-gray-500">
              {v.bookingCount} booking{v.bookingCount !== 1 ? "s" : ""}
            </div>
          </div>
          <button className="px-3.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-semibold text-[#1A5FAC] cursor-pointer hover:bg-gray-50 transition">
            View History
          </button>
        </div>
      ))}

      {vehicles.length === 0 && (
        <p className="text-[13px] text-gray-500 italic mb-2">No vehicles on file</p>
      )}

      <button className="w-full py-2.5 rounded-[10px] border border-dashed border-gray-300 text-[13px] font-semibold text-gray-500 hover:border-[#1A5FAC] hover:text-[#1A5FAC] cursor-pointer transition">
        + Add Vehicle
      </button>
    </>
  );
}
