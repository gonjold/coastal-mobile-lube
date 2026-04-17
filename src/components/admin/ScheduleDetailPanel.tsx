"use client";

import { useState, useEffect } from "react";
import AdminBadge from "./AdminBadge";
import {
  type Booking,
  formatPhone,
  getServiceLabel,
  getBookingCalendarDate,
  formatTimeWindow,
} from "@/app/admin/shared";
import { useAdminModal } from "@/contexts/AdminModalContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    case "dead": return "gray";
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
  const { openModal } = useAdminModal();
  const [showDeadReason, setShowDeadReason] = useState(false);
  const [deadReason, setDeadReason] = useState("");
  const [customDeadReason, setCustomDeadReason] = useState("");
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [confirmDate, setConfirmDate] = useState('');
  const [confirmTime, setConfirmTime] = useState('');
  const [confirmDuration, setConfirmDuration] = useState('60');
  const [confirmSending, setConfirmSending] = useState(false);

  /* Escape key handler */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  /* Reset confirm form when booking changes */
  useEffect(() => {
    setShowConfirmForm(false);
  }, [booking?.id]);

  /* Pre-fill confirm form from booking data */
  useEffect(() => {
    if (showConfirmForm && booking) {
      const preferred = booking.preferredDate || '';
      if (preferred) setConfirmDate(preferred);
      const preferredTime = booking.confirmedArrivalWindow || booking.timeWindow || '';
      if (preferredTime) setConfirmTime(preferredTime);
    }
  }, [showConfirmForm, booking]);

  const handleConfirmBooking = async () => {
    if (!booking?.id || !confirmDate || !confirmTime) return;
    setConfirmSending(true);

    try {
      // 1. Update booking in Firestore
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'confirmed',
        confirmedDate: confirmDate,
        confirmedArrivalWindow: confirmTime,
        estimatedDuration: confirmDuration,
        confirmedAt: new Date().toISOString(),
      });

      // 2. Get customer info
      const customerEmail = booking.email || booking.customerEmail || '';
      const customerName = booking.name || booking.customerName || '';
      const customerPhone = booking.phone || booking.customerPhone || '';

      // 3. Call Cloud Function to send confirmation email with .ics
      if (customerEmail) {
        try {
          const response = await fetch(
            'https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendBookingConfirmation',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerName,
                customerEmail,
                customerPhone,
                services: getServiceLabel(booking),
                vehicle: [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(' ') || '',
                address: booking.address || '',
                confirmedDate: confirmDate,
                confirmedTime: confirmTime,
                estimatedDuration: confirmDuration,
                division: booking.division || 'automotive',
                notes: booking.notes || '',
                bookingId: booking.id,
              }),
            }
          );
          if (!response.ok) {
            console.error('Confirmation email failed:', await response.text());
          }
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', emailErr);
        }
      }

      // 4. Close confirm form
      setShowConfirmForm(false);
      setConfirmSending(false);

    } catch (err) {
      console.error('Failed to confirm booking:', err);
      setConfirmSending(false);
    }
  };

  const DEAD_REASONS = [
    "No response",
    "Not interested",
    "Chose competitor",
    "Wrong number",
    "Budget",
    "Out of service area",
    "Other",
  ];

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
  const priceDisplay = price ? formatCurrency(price) : "—";

  /* Primary action config */
  let primaryLabel = "";
  let primaryBg = "";
  let primaryNextStatus = "";
  const isCancelled = b.status === "cancelled";
  const isDead = b.status === "dead";

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

  const showCancel = b.status !== "completed" && b.status !== "cancelled" && b.status !== "invoiced" && b.status !== "dead";

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
        <div className="border-b border-gray-200 px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0B2040]">{b.name || b.customerName || "—"}</h2>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <AdminBadge
                label={b.status === "new-lead" ? "New Lead" : (b.status || "—")}
                variant={getStatusBadgeVariant(b.status)}
              />
              {b.needsConfirmation && (
                <AdminBadge
                  label="Call to confirm"
                  variant="amber"
                />
              )}
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

        {/* Confirm form */}
        {showConfirmForm && (
          <div className="mx-6 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm font-semibold text-[#0B2040] mb-3">Confirm Appointment</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={confirmDate}
                  onChange={(e) => setConfirmDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Arrival Window</label>
                <select
                  value={confirmTime}
                  onChange={(e) => setConfirmTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select time</option>
                  <option value="7:00 AM - 8:00 AM">7:00 AM - 8:00 AM</option>
                  <option value="8:00 AM - 9:00 AM">8:00 AM - 9:00 AM</option>
                  <option value="9:00 AM - 10:00 AM">9:00 AM - 10:00 AM</option>
                  <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                  <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                  <option value="12:00 PM - 1:00 PM">12:00 PM - 1:00 PM</option>
                  <option value="1:00 PM - 2:00 PM">1:00 PM - 2:00 PM</option>
                  <option value="2:00 PM - 3:00 PM">2:00 PM - 3:00 PM</option>
                  <option value="3:00 PM - 4:00 PM">3:00 PM - 4:00 PM</option>
                  <option value="4:00 PM - 5:00 PM">4:00 PM - 5:00 PM</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estimated Duration</label>
              <select
                value={confirmDuration}
                onChange={(e) => setConfirmDuration(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4+ hours</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmBooking}
                disabled={!confirmDate || !confirmTime || confirmSending}
                className="flex-1 py-2 bg-[#1A5FAC] text-white rounded-lg text-sm font-semibold hover:bg-[#164d8f] disabled:opacity-50"
              >
                {confirmSending ? 'Sending...' : 'Confirm & Send Invite'}
              </button>
              <button
                onClick={() => setShowConfirmForm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bottom action bar */}
        <div className="border-t border-gray-200 px-6 py-4">
          {isCancelled ? (
            <p className="italic text-gray-400 text-sm">This booking was cancelled.</p>
          ) : isDead ? (
            <div>
              <p className="italic text-gray-400 text-sm">This lead has been marked as dead.</p>
              {(() => {
                const reason = (b as unknown as Record<string, unknown>).deadReason as string | undefined;
                if (!reason) return null;
                return <p className="text-xs text-gray-400 mt-1">Reason: {reason}</p>;
              })()}
            </div>
          ) : (
            <>
              <div className="flex gap-2.5">
                {primaryLabel && !showConfirmForm && (
                  <button
                    onClick={() => {
                      if (primaryNextStatus === "invoice") {
                        openModal("invoice", { bookingId: b.id });
                      } else if (b.status === "pending" || b.status === "new-lead") {
                        setShowConfirmForm(true);
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
                    onClick={() => {
                      if (!confirm('Cancel this booking? This cannot be undone. The customer will need to rebook.')) return;
                      onAdvance(b.id, "cancelled");
                    }}
                    className="px-5 py-2.5 bg-transparent border border-gray-200 rounded-[10px] text-red-600 text-[13px] font-semibold cursor-pointer hover:bg-red-50 hover:border-red-600 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Mark as Dead */}
              {showCancel && !showDeadReason && (
                <button
                  onClick={() => setShowDeadReason(true)}
                  className="mt-3 text-xs text-gray-500 cursor-pointer hover:text-red-600 transition"
                >
                  Mark as Dead Lead
                </button>
              )}
              {showDeadReason && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Dead Reason</p>
                  <select
                    value={deadReason}
                    onChange={(e) => setDeadReason(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A5FAC] bg-white mb-2"
                  >
                    <option value="">Select reason...</option>
                    {DEAD_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {deadReason === "Other" && (
                    <input
                      type="text"
                      value={customDeadReason}
                      onChange={(e) => setCustomDeadReason(e.target.value)}
                      placeholder="Custom reason..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A5FAC] mb-2"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const reason = deadReason === "Other" ? customDeadReason : deadReason;
                        if (!reason) return;
                        onAdvance(b.id, `dead:${reason}`);
                      }}
                      disabled={!deadReason || (deadReason === "Other" && !customDeadReason)}
                      className="px-4 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => { setShowDeadReason(false); setDeadReason(""); setCustomDeadReason(""); }}
                      className="px-4 py-1.5 text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
