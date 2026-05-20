"use client";

/* A3f Phase 6A: mobile JobCard. Renders below `lg` in place of JobsTable
 * rows. Anatomy per WO §"JobCard":
 * - Row 1: customer name (bold 15.5) left, status badge right
 * - Row 2: service name (medium)
 * - Row 3 (only if vehicle present): car icon + vehicle (soft, truncate)
 * - Divider, then footer row: calendar icon + date · time (mid) left;
 *   phone icon + tappable phone (blue bold) right.
 * - Date format: compact "May 21" not "2026-05-21". No wrapping.
 * Whole card navigates to /jobs/{id}. The phone <a tel:> stops
 * propagation so tapping it dials without navigating. */

import { Phone, Calendar, Car } from "lucide-react";
import { Badge, statusBadgeVariant } from "@coastal/shared-ui";
import {
  formatBookingService,
  formatBookingVehicle,
  getBookingCustomerName,
} from "@coastal/shared-types";
import type { BookingDoc } from "@/lib/queries/bookings";
import { formatPhone, telHref } from "@/lib/format";
import { OpsCard } from "./OpsCard";

interface Props {
  booking: BookingDoc;
}

function formatCompactDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusBadgeLabel(status?: string): string {
  if (!status) return "Pending";
  return status.replace(/-/g, " ");
}

export function JobCard({ booking }: Props) {
  const customerName = getBookingCustomerName(booking) || "(no name)";
  const service = formatBookingService(booking) || "";
  const vehicle = formatBookingVehicle(booking) || "";
  const date = formatCompactDate(booking.confirmedDate || booking.preferredDate);
  const timeWindow = booking.timeWindow || "";
  const dateTimeLabel = [date, timeWindow].filter(Boolean).join(" · ");
  const rawPhone = booking.customerPhone || booking.phone || "";
  const phoneHref = telHref(rawPhone);
  const phoneDisplay = rawPhone ? formatPhone(rawPhone) : "";

  return (
    <OpsCard href={`/jobs/${booking.id}`} ariaLabel={`Open job for ${customerName}`}>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[15px] font-semibold leading-tight text-[#0B2040] min-w-0 truncate">
            {customerName}
          </div>
          <Badge variant={statusBadgeVariant(booking.status)} className="capitalize shrink-0">
            {statusBadgeLabel(booking.status)}
          </Badge>
        </div>

        {service && (
          <div className="text-[14px] font-medium text-[#0B2040] truncate">{service}</div>
        )}

        {vehicle && (
          <div className="flex items-center gap-1.5 text-[13px] text-[#0B2040]/58 min-w-0">
            <Car className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{vehicle}</span>
          </div>
        )}

        {(dateTimeLabel || phoneHref) && (
          <div className="mt-1.5 pt-2.5 border-t border-[#0B2040]/8 flex items-center justify-between gap-3 text-[13px]">
            <div className="flex items-center gap-1.5 text-[#0B2040]/58 min-w-0">
              <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="truncate">{dateTimeLabel || "Date TBD"}</span>
            </div>
            {phoneHref && (
              <a
                href={phoneHref}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-[#1A5FAC] font-semibold shrink-0 hover:underline"
                aria-label={`Call ${customerName} at ${phoneDisplay}`}
              >
                <Phone className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                <span>{phoneDisplay}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </OpsCard>
  );
}
