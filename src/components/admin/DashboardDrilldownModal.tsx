"use client";

import { useRouter } from "next/navigation";
import AdminBadge from "./AdminBadge";
import { type Booking, getServiceLabel, getBookingCalendarDate } from "@/app/admin/shared";
import { formatCurrency } from "@/lib/formatCurrency";
import { useAdminModal } from "@/contexts/AdminModalContext";

interface DrilldownInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: string;
  dueDate?: string;
}

function getBadgeVariant(status?: string): "green" | "red" | "amber" | "gray" | "blue" | "teal" {
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

export default function DashboardDrilldownModal({
  title,
  bookings,
  invoices,
  type,
  onClose,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  bookings?: Booking[];
  invoices?: DrilldownInvoice[];
  type: "booking" | "invoice";
  onClose: () => void;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  const router = useRouter();
  const { openModal } = useAdminModal();
  const records = type === "booking" ? (bookings || []) : (invoices || []);
  const count = records.length;

  const totalAmount = type === "booking"
    ? (bookings || []).reduce((sum, b) => sum + (b.selectedServices?.reduce((s, svc) => s + (svc.price || 0), 0) || 0), 0)
    : (invoices || []).reduce((sum, i) => sum + (i.total || 0), 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-[65]" onClick={onClose} />
      <div className="fixed inset-0 z-[66] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-[#0B2040]">{title}</h2>
              <span className="text-sm font-semibold bg-gray-100 px-2.5 py-0.5 rounded-md">{count}</span>
            </div>
            <button onClick={onClose} className="text-xl text-gray-500 cursor-pointer hover:text-gray-700 transition">
              &times;
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {count === 0 && (
              <p className="px-6 py-10 text-center text-sm text-gray-400">No records found</p>
            )}

            {type === "booking" && (bookings || []).map((b) => {
              const vehicle = [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") || "";
              const calDate = getBookingCalendarDate(b);
              const dateDisplay = calDate
                ? new Date(calDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "—";
              const price = b.selectedServices?.reduce((sum, s) => sum + (s.price || 0), 0);
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    openModal("customer-profile", {
                      customer: {
                        name: b.name || b.customerName || "",
                        phone: b.phone || b.customerPhone,
                        email: b.email || b.customerEmail,
                        address: b.address,
                      },
                    });
                  }}
                  className="px-6 py-3.5 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-[#1A5FAC]">
                      {b.name || b.customerName || "—"}
                    </span>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {getServiceLabel(b)}{vehicle ? ` · ${vehicle}` : ""} · {dateDisplay}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {price ? <span className="text-sm font-semibold text-[#0B2040]">{formatCurrency(price)}</span> : null}
                    <AdminBadge label={b.status || "—"} variant={getBadgeVariant(b.status)} />
                  </div>
                </div>
              );
            })}

            {type === "invoice" && (invoices || []).map((i) => (
              <div
                key={i.id}
                onClick={() => { onClose(); router.push(`/admin/invoicing?select=${i.id}`); }}
                className="px-6 py-3.5 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#0B2040]">{i.invoiceNumber}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{i.customerName}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-[#0B2040]">{formatCurrency(i.total)}</span>
                  <AdminBadge label={i.status.charAt(0).toUpperCase() + i.status.slice(1)} variant={getBadgeVariant(i.status)} />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">
            <span className="text-sm text-gray-500">
              {count} {type === "booking" ? "booking" : "invoice"}{count !== 1 ? "s" : ""} totaling {formatCurrency(totalAmount)}
            </span>
            <button
              onClick={() => { onClose(); router.push(viewAllHref); }}
              className="bg-[#1A5FAC] text-white rounded-lg px-5 py-2.5 text-sm font-semibold cursor-pointer hover:bg-[#174f94] transition"
            >
              {viewAllLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
