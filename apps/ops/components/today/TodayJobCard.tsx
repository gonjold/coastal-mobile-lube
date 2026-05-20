"use client";

import { useRouter } from "next/navigation";
import { Phone, Navigation } from "lucide-react";
import { Badge, Button, Card, statusBadgeVariant } from "@coastal/shared-ui";
import {
  formatBookingService,
  formatBookingVehicle,
  getBookingArrivalTime,
  getBookingCustomerName,
} from "@coastal/shared-types";
import type { BookingDoc } from "@/lib/queries/bookings";

interface Props {
  booking: BookingDoc;
}

function statusBadgeLabel(status?: string): string {
  switch (status) {
    case "in-progress":
      return "In Progress";
    case "confirmed":
      return "Upcoming";
    default:
      return status ?? "Pending";
  }
}

/* A3f Phase 5.5: whole-card clickability.
 *
 * The entire Card is the primary tap target — clicking anywhere on the
 * card opens /jobs/{id} (matches every other Today list pattern post-A3f).
 * The redundant "Open" button is dropped; Call + Navigate stay as
 * explicit per-action buttons with stopPropagation so tapping them
 * doesn't bubble into the card-level navigate.
 *
 * Card uses onClick + onKeyDown (Enter/Space) + tabIndex={0} + role="link"
 * for keyboard access and screen-reader semantics. The Card primitive
 * underneath accepts arbitrary HTMLDivElement props so the click/keyboard
 * handlers attach cleanly without wrapping in an extra element. */
export default function TodayJobCard({ booking }: Props) {
  const router = useRouter();
  const customerName = getBookingCustomerName(booking) || "Customer";
  const service = formatBookingService(booking);
  const vehicle = formatBookingVehicle(booking);
  const phone = booking.customerPhone || booking.phone || "";
  const address = booking.address || "";
  const arrival = getBookingArrivalTime(booking);
  const statusLabel = statusBadgeLabel(booking.status);

  const telHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined;
  const navHref = address
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`
    : undefined;

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={`Open job for ${customerName}`}
      onClick={() => router.push(`/jobs/${booking.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/jobs/${booking.id}`);
        }
      }}
      className="flex flex-col gap-4 p-4 lg:p-5 cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-foreground">{customerName}</div>
          <div className="text-sm text-muted-foreground">{vehicle || service}</div>
        </div>
        <Badge variant={statusBadgeVariant(booking.status)}>
          {statusLabel}
        </Badge>
      </header>

      <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <div className="truncate" title={address}>
          {address || "No address on file"}
        </div>
        <div className="sm:text-right">{arrival}</div>
        {service && vehicle && (
          <div className="col-span-1 truncate sm:col-span-2">{service}</div>
        )}
      </div>

      {(telHref || navHref) && (
        <div className="flex flex-wrap gap-2">
          {telHref && (
            <Button asChild variant="outline" className="min-h-[48px]">
              <a
                href={telHref}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Call ${customerName}`}
              >
                <Phone className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Call</span>
              </a>
            </Button>
          )}
          {navHref && (
            <Button asChild variant="outline" className="min-h-[48px]">
              <a
                href={navHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Navigate to ${address}`}
              >
                <Navigation className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Navigate</span>
              </a>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
