"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import AdminBadge from "./AdminBadge";
import {
  type Booking,
  formatPhone,
  getServiceLabel,
  getSourceLabel,
} from "@/app/admin/shared";
import { useAdminModal } from "@/contexts/AdminModalContext";
import type { DuplicateGroup } from "@/lib/customerDedup";
import { formatCurrency } from "@/lib/formatCurrency";

/* ── Types ── */

export interface PanelInvoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  invoiceDate: string;
  createdAt?: { toDate: () => Date };
}

export interface CommunicationPreferences {
  doNotCall: boolean;
  doNotText: boolean;
  doNotEmail: boolean;
  optOutDate?: string | null;
  optOutReason?: string | null;
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
  communicationPreferences?: CommunicationPreferences;
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
  onDelete,
  duplicateGroups,
  onMerge,
  initialEditMode,
}: {
  customer: CustomerForPanel | null;
  bookings: Booking[];
  invoices: PanelInvoice[];
  onClose: () => void;
  onDelete?: () => void;
  duplicateGroups?: DuplicateGroup[];
  onMerge?: (group: DuplicateGroup) => void;
  initialEditMode?: boolean;
}) {
  const { openModal } = useAdminModal();
  const [activeTab, setActiveTab] = useState<"timeline" | "details" | "vehicles">(initialEditMode ? "details" : "timeline");
  const [timelineFilter, setTimelineFilter] = useState<"all" | "bookings" | "invoices" | "comms">("all");
  const [vehicleFilter, setVehicleFilter] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* Escape key handler */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

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

  const filteredTimeline = timeline.filter((e) => {
    if (timelineFilter !== "all") {
      if (timelineFilter === "bookings" && e.type !== "booking") return false;
      if (timelineFilter === "invoices" && e.type !== "invoice") return false;
      if (timelineFilter === "comms" && e.type !== "comm") return false;
    }
    if (vehicleFilter && e.vehicle !== vehicleFilter) return false;
    return true;
  });

  /* Avatar initials */
  const nameParts = customer.name.split(/\s+/).filter(Boolean);
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : (nameParts[0]?.[0] || "?").toUpperCase();

  // Find duplicate group for this customer
  const dupGroup = duplicateGroups?.find((g) =>
    g.customers.some(
      (c) =>
        c.name === customer.name &&
        c.phone === customer.phone &&
        c.email === customer.email,
    ),
  );
  const dupOther = dupGroup?.customers.find(
    (c) =>
      !(c.name === customer.name && c.phone === customer.phone && c.email === customer.email),
  );

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
      <div
        className="fixed inset-0 bg-black/40 z-[70]"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-[960px] h-[90vh] flex flex-col pointer-events-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
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
                {dupOther && dupGroup && onMerge && (
                  <button
                    onClick={() => onMerge(dupGroup)}
                    className="text-xs text-blue-600 cursor-pointer hover:underline mt-1"
                  >
                    Possible duplicate of {dupOther.name}
                  </button>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-xl text-gray-500 cursor-pointer hover:text-gray-700 transition p-1">
              ✕
            </button>
          </div>

          {/* Quick stats */}
          <div className="mt-4 bg-[#F7F8FA] rounded-[10px] overflow-hidden flex">
            {[
              { label: "Total Spent", value: formatCurrency(customer.totalSpent) },
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
              vehicleFilter={vehicleFilter}
              onClearVehicleFilter={() => setVehicleFilter(null)}
            />
          )}
          {activeTab === "details" && (
            <DetailsTab
              customer={customer}
              bookings={bookings}
              onShowDelete={() => setShowDeleteConfirm(true)}
              initialEditMode={initialEditMode}
            />
          )}
          {activeTab === "vehicles" && (
            <VehiclesTab
              vehicles={vehicles}
              bookings={bookings}
              onViewHistory={(vehicleName) => {
                setActiveTab("timeline");
                setVehicleFilter(vehicleName);
              }}
            />
          )}
        </div>

        {/* Bottom action bar */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-2.5">
          <button
            onClick={() =>
              openModal("booking", {
                customer: {
                  name: customer.name,
                  phone: customer.phone,
                  email: customer.email,
                  address: customer.address,
                },
              })
            }
            className="flex-1 py-2.5 bg-[#E07B2D] rounded-[10px] text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition"
          >
            New Booking
          </button>
          <button
            onClick={() =>
              openModal("invoice", {
                customer: {
                  name: customer.name,
                  phone: customer.phone,
                  email: customer.email,
                  address: customer.address,
                },
              })
            }
            className="flex-1 py-2.5 bg-transparent border border-gray-200 rounded-[10px] text-[#16A34A] text-sm font-semibold cursor-pointer hover:bg-green-50 hover:border-green-600 transition"
          >
            New Invoice
          </button>
        </div>
      </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-[80] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-[400px] mx-4 p-6">
            <h3 className="text-lg font-bold text-[#0B2040]">
              Delete Customer
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to delete{" "}
              <strong>{customer.name}</strong>? This will permanently
              remove their profile. Bookings and invoices linked to this
              customer will NOT be deleted.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const batch = writeBatch(db);
                    bookings.forEach((b) => {
                      batch.update(doc(db, "bookings", b.id), {
                        customerDeleted: true,
                        updatedAt: serverTimestamp(),
                      });
                    });
                    await batch.commit();
                    setShowDeleteConfirm(false);
                    onClose();
                    onDelete?.();
                  } catch {
                    /* silent */
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 bg-red-600 rounded-lg py-2.5 text-sm font-semibold text-white cursor-pointer hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
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
  vehicleFilter,
  onClearVehicleFilter,
}: {
  entries: TimelineEntry[];
  filter: string;
  onFilterChange: (f: "all" | "bookings" | "invoices" | "comms") => void;
  vehicleFilter?: string | null;
  onClearVehicleFilter?: () => void;
}) {
  const pills: { key: "all" | "bookings" | "invoices" | "comms"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "bookings", label: "Bookings" },
    { key: "invoices", label: "Invoices" },
    { key: "comms", label: "Comms" },
  ];

  return (
    <>
      {/* Vehicle filter chip */}
      {vehicleFilter && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1.5 bg-[#EBF4FF] text-[#1A5FAC] text-xs font-semibold px-2.5 py-1.5 rounded-md">
            {vehicleFilter}
            <button
              onClick={onClearVehicleFilter}
              className="text-[#1A5FAC] hover:text-[#0B2040] cursor-pointer"
            >
              ✕
            </button>
          </span>
        </div>
      )}

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
                    {formatCurrency(entry.amount)}
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

function DetailsTab({
  customer,
  bookings,
  onShowDelete,
  initialEditMode,
}: {
  customer: CustomerForPanel;
  bookings: Booking[];
  onShowDelete: () => void;
  initialEditMode?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(!!initialEditMode);
  const [editForm, setEditForm] = useState({
    name: customer.name,
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
    type: customer.type || "Residential",
    notes: customer.notes || "",
  });
  const [saving, setSaving] = useState(false);

  /* Local comm prefs state — syncs from props, allows optimistic toggle */
  const [commPrefs, setCommPrefs] = useState<CommunicationPreferences>({
    doNotCall: customer.communicationPreferences?.doNotCall ?? false,
    doNotText: customer.communicationPreferences?.doNotText ?? false,
    doNotEmail: customer.communicationPreferences?.doNotEmail ?? false,
    optOutDate: customer.communicationPreferences?.optOutDate ?? null,
    optOutReason: customer.communicationPreferences?.optOutReason ?? null,
  });

  useEffect(() => {
    setCommPrefs({
      doNotCall: customer.communicationPreferences?.doNotCall ?? false,
      doNotText: customer.communicationPreferences?.doNotText ?? false,
      doNotEmail: customer.communicationPreferences?.doNotEmail ?? false,
      optOutDate: customer.communicationPreferences?.optOutDate ?? null,
      optOutReason: customer.communicationPreferences?.optOutReason ?? null,
    });
  }, [customer.communicationPreferences]);

  function startEdit() {
    setEditForm({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      type: customer.type || "Residential",
      notes: customer.notes || "",
    });
    setIsEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      bookings.forEach((b) => {
        batch.update(doc(db, "bookings", b.id), {
          name: editForm.name.trim(),
          phone: editForm.phone.replace(/\D/g, "") || null,
          email: editForm.email.trim().toLowerCase() || null,
          address: editForm.address.trim() || null,
          notes: editForm.notes.trim() || null,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setIsEditing(false);
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-[#1A5FAC] transition-colors";

  if (isEditing) {
    return (
      <>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em] mb-3">
          Edit Contact Information
        </p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[13px] text-gray-500 mb-1 block">Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, name: e.target.value }))
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[13px] text-gray-500 mb-1 block">Phone</label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, phone: e.target.value }))
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[13px] text-gray-500 mb-1 block">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, email: e.target.value }))
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[13px] text-gray-500 mb-1 block">Address</label>
            <input
              type="text"
              value={editForm.address}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, address: e.target.value }))
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[13px] text-gray-500 mb-1 block">Type</label>
            <select
              value={editForm.type}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, type: e.target.value }))
              }
              className={`${inputCls} bg-white`}
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label className="text-[13px] text-gray-500 mb-1 block">Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, notes: e.target.value }))
              }
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        <div className="flex gap-2.5 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-[#16A34A] text-white text-[13px] font-semibold cursor-pointer hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="border border-gray-200 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </>
    );
  }

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
        onClick={startEdit}
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

      {/* Communication Preferences */}
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em] mb-3 mt-6">Communication Preferences</p>
      <div className="flex flex-col gap-2.5">
        {([
          { key: "doNotCall" as const, label: "Do Not Call" },
          { key: "doNotText" as const, label: "Do Not Text" },
          { key: "doNotEmail" as const, label: "Do Not Email" },
        ]).map((pref) => {
          const isOn = commPrefs[pref.key];
          return (
            <div key={pref.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#0B2040]">{pref.label}</span>
                {isOn && commPrefs.optOutDate && (
                  <span className="text-[10px] text-gray-400">(opted out {commPrefs.optOutDate})</span>
                )}
              </div>
              <button
                onClick={async () => {
                  const newVal = !isOn;
                  const newPrefs = {
                    ...commPrefs,
                    [pref.key]: newVal,
                    optOutDate: newVal ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : commPrefs.optOutDate || null,
                    optOutReason: null,
                  };
                  setCommPrefs(newPrefs);
                  try {
                    const batch = writeBatch(db);
                    bookings.forEach((b) => {
                      batch.update(doc(db, "bookings", b.id), {
                        communicationPreferences: newPrefs,
                        updatedAt: serverTimestamp(),
                      });
                    });
                    await batch.commit();
                  } catch (err) {
                    console.error("Failed to update DNC status:", err);
                    setCommPrefs(commPrefs);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isOn ? "bg-red-500" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isOn ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Delete Customer */}
      <button
        onClick={onShowDelete}
        className="mt-6 text-red-500 text-xs font-medium cursor-pointer hover:text-red-700 transition"
      >
        Delete Customer
      </button>
    </>
  );
}

/* ── Vehicles Tab ── */

function VehiclesTab({
  vehicles,
  bookings,
  onViewHistory,
}: {
  vehicles: { name: string; bookingCount: number }[];
  bookings: Booking[];
  onViewHistory?: (vehicleName: string) => void;
}) {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newVehicle, setNewVehicle] = useState("");
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [removingVehicle, setRemovingVehicle] = useState<string | null>(null);

  async function handleAddVehicle() {
    if (!newVehicle.trim() || !bookings[0]) return;
    setSavingVehicle(true);
    try {
      // Add as a booking with vehicle info
      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const latestBooking = bookings[0];
      await addDoc(collection(db, "bookings"), {
        name: latestBooking.name || latestBooking.customerName,
        phone: latestBooking.phone || latestBooking.customerPhone || null,
        email: latestBooking.email || latestBooking.customerEmail || null,
        vehicleMake: newVehicle.trim(),
        source: "admin-manual",
        status: "pending",
        notes: "Vehicle added from customer profile",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewVehicle("");
      setShowAddInput(false);
    } catch {
      /* silent */
    } finally {
      setSavingVehicle(false);
    }
  }

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewHistory?.(v.name)}
              className="px-3.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-semibold text-[#1A5FAC] cursor-pointer hover:bg-gray-50 transition"
            >
              View History
            </button>
            {removingVehicle === v.name ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-red-500">Remove?</span>
                <button
                  onClick={() => setRemovingVehicle(null)}
                  className="text-xs text-gray-500 cursor-pointer"
                >
                  No
                </button>
                <button
                  onClick={() => setRemovingVehicle(null)}
                  className="text-xs text-red-600 font-semibold cursor-pointer"
                >
                  Yes
                </button>
              </div>
            ) : (
              <button
                onClick={() => setRemovingVehicle(v.name)}
                className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}

      {vehicles.length === 0 && (
        <p className="text-[13px] text-gray-500 italic mb-2">No vehicles on file</p>
      )}

      {showAddInput ? (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newVehicle}
            onChange={(e) => setNewVehicle(e.target.value)}
            placeholder="Year Make Model"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A5FAC] transition-colors"
            autoFocus
          />
          <button
            onClick={handleAddVehicle}
            disabled={!newVehicle.trim() || savingVehicle}
            className="px-4 py-2 bg-[#1A5FAC] text-white text-sm font-semibold rounded-lg cursor-pointer hover:opacity-90 transition disabled:opacity-50"
          >
            {savingVehicle ? "..." : "Save"}
          </button>
          <button
            onClick={() => {
              setShowAddInput(false);
              setNewVehicle("");
            }}
            className="px-3 py-2 text-sm text-gray-500 cursor-pointer"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddInput(true)}
          className="w-full py-2.5 rounded-[10px] border border-dashed border-gray-300 text-[13px] font-semibold text-gray-500 hover:border-[#1A5FAC] hover:text-[#1A5FAC] cursor-pointer transition"
        >
          + Add Vehicle
        </button>
      )}
    </>
  );
}
