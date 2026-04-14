"use client";

import { useRouter } from "next/navigation";
import AdminBadge from "./AdminBadge";
import {
  type Booking,
  formatPhone,
  getServiceLabel,
  getBookingCalendarDate,
  formatTimeWindow,
} from "@/app/admin/shared";

const STATUS_STEPS = ["pending", "confirmed", "in-progress", "completed", "invoiced"];
const STATUS_LABELS: Record<string, string> = {
  pending: "New Lead",
  confirmed: "Confirmed",
  "in-progress": "In Progress",
  completed: "Completed",
  invoiced: "Invoiced",
};

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

function getStepIndex(status?: string): number {
  if (status === "new-lead" || status === "pending") return 0;
  if (status === "confirmed") return 1;
  if (status === "in-progress") return 2;
  if (status === "completed") return 3;
  if (status === "invoiced") return 4;
  return -1;
}

function getDivisionLabel(b: Booking): string {
  if (b.division) return b.division;
  if (b.serviceCategory === "marine" || b.vesselMake) return "Marine";
  if (b.serviceCategory === "fleet" || b.fleetSize) return "Fleet";
  if (b.serviceCategory === "rv" || b.rvType) return "RV";
  return "Auto";
}

export default function ScheduleDetailPanel({
  booking,
  onClose,
  onAdvance,
}: {
  booking: Booking | null;
  onClose: () => void;
  onAdvance: (bookingId: string, nextStatus: string) => void;
}) {
  const router = useRouter();

  if (!booking) return null;

  const b = booking;
  const currentStep = getStepIndex(b.status);
  const vehicle = [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") ||
    [b.vesselYear, b.vesselMake, b.vesselModel].filter(Boolean).join(" ") || "—";
  const calDate = getBookingCalendarDate(b);
  const dateDisplay = calDate
    ? new Date(calDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "—";
  const timeDisplay = b.confirmedArrivalWindow || formatTimeWindow(b.timeWindow) || "—";
  const division = getDivisionLabel(b);

  const price = b.selectedServices?.reduce((sum, s) => sum + (s.price || 0), 0);
  const priceDisplay = price ? `$${price.toFixed(0)}` : "—";

  /* Primary action config */
  let primaryLabel = "";
  let primaryBg = "";
  let primaryNextStatus = "";
  const isCancelled = b.status === "cancelled";

  if (b.status === "pending" || b.status === "new-lead") {
    primaryLabel = "Confirm Booking";
    primaryBg = "bg-[#16A34A]";
    primaryNextStatus = "confirmed";
  } else if (b.status === "confirmed") {
    primaryLabel = "Start Job";
    primaryBg = "bg-[#0D8A8F]";
    primaryNextStatus = "in-progress";
  } else if (b.status === "in-progress") {
    primaryLabel = "Complete Job";
    primaryBg = "bg-[#16A34A]";
    primaryNextStatus = "completed";
  } else if (b.status === "completed") {
    primaryLabel = "Create Invoice";
    primaryBg = "bg-[#E07B2D]";
    primaryNextStatus = "invoice";
  }

  const showCancel = b.status !== "completed" && b.status !== "cancelled" && b.status !== "invoiced";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/15 z-[55]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 w-[420px] h-screen bg-white border-l border-gray-200 z-[60] flex flex-col transition-transform duration-200"
        style={{ boxShadow: "-8px 0 32px rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0B2040]">{b.name || b.customerName || "—"}</h2>
            <div className="mt-1.5">
              <AdminBadge
                label={b.status === "new-lead" ? "New Lead" : (b.status || "—")}
                variant={getStatusBadgeVariant(b.status)}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xl text-gray-500 cursor-pointer hover:text-gray-700 transition p-1"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Job Details */}
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em] mb-3">Job Details</p>
          {([
            { label: "Service", value: getServiceLabel(b) || "—" },
            { label: "Vehicle", value: vehicle },
            { label: "Date + Time", value: `${dateDisplay} · ${timeDisplay}` },
            { label: "Duration", value: b.estimatedDuration || "~1 hour" },
            { label: "Division", value: division },
            { label: "Price", value: priceDisplay },
            { label: "Source", value: b.source || "—" },
          ] as { label: string; value: string }[]).map((row) => (
            <div key={row.label} className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-[13px] text-gray-500">{row.label}</span>
              <span className="text-[13px] font-medium text-[#0B2040] text-right max-w-[60%]">{row.value}</span>
            </div>
          ))}

          {/* Contact */}
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em] mb-3 mt-6">Contact</p>
          {([
            { label: "Phone", value: formatPhone(b.phone || b.customerPhone), href: b.phone ? `tel:${b.phone}` : undefined },
            { label: "Email", value: b.email || b.customerEmail || "—", href: b.email ? `mailto:${b.email}` : undefined },
            { label: "Address", value: b.address || "—" },
          ] as { label: string; value: string; href?: string }[]).map((row) => (
            <div key={row.label} className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-[13px] text-gray-500">{row.label}</span>
              {row.href ? (
                <a href={row.href} className="text-[13px] font-medium text-[#1A5FAC] cursor-pointer text-right max-w-[60%]">{row.value}</a>
              ) : (
                <span className="text-[13px] font-medium text-[#0B2040] text-right max-w-[60%]">{row.value}</span>
              )}
            </div>
          ))}

          {/* Notes */}
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em] mb-3 mt-6">Notes</p>
          <div className="bg-[#F7F8FA] rounded-[10px] p-3.5">
            <p className={`text-[13px] ${b.notes || b.adminNotes ? "text-[#0B2040]" : "italic text-gray-400"}`}>
              {b.adminNotes || b.notes || "No notes"}
            </p>
          </div>

          {/* Progress Timeline */}
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em] mb-3 mt-6">Progress</p>
          <div className="flex flex-col">
            {STATUS_STEPS.map((step, i) => {
              const isCompleted = i < currentStep;
              const isCurrent = i === currentStep;
              const isFuture = i > currentStep;
              const isLast = i === STATUS_STEPS.length - 1;

              return (
                <div key={step} className="flex items-start gap-3">
                  {/* Dot + connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3.5 h-3.5 rounded-full ${
                        isCompleted
                          ? "bg-[#16A34A]"
                          : isCurrent
                            ? "bg-[#E07B2D] border-2 border-[#E07B2D]"
                            : "bg-gray-200"
                      }`}
                      style={isCurrent ? { boxShadow: "0 0 0 2px rgba(224,123,45,0.3)" } : undefined}
                    />
                    {!isLast && (
                      <div className={`w-0.5 h-6 ${isCompleted ? "bg-[#16A34A]" : "bg-gray-200"}`} />
                    )}
                  </div>
                  {/* Label */}
                  <span className={`text-[13px] -mt-0.5 ${isCurrent ? "font-semibold text-[#0B2040]" : isFuture ? "text-gray-500" : "text-[#0B2040]"}`}>
                    {STATUS_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-2.5">
          {isCancelled ? (
            <p className="italic text-gray-400 text-sm">This booking was cancelled.</p>
          ) : (
            <>
              {primaryLabel && (
                <button
                  onClick={() => {
                    if (primaryNextStatus === "invoice") {
                      router.push(`/admin/invoicing?from=booking&id=${b.id}`);
                    } else {
                      onAdvance(b.id, primaryNextStatus);
                    }
                  }}
                  className={`flex-1 py-2.5 rounded-[10px] text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition ${primaryBg}`}
                >
                  {primaryLabel}
                </button>
              )}
              {showCancel && (
                <button
                  onClick={() => onAdvance(b.id, "cancelled")}
                  className="px-5 py-2.5 bg-transparent border border-gray-200 rounded-[10px] text-red-600 text-[13px] font-semibold cursor-pointer hover:bg-red-50 hover:border-red-600 transition"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
