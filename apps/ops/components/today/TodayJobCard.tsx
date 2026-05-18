"use client";

import Link from "next/link";
import { Phone, Navigation, ArrowRight } from "lucide-react";
import { Badge, Button, Card } from "@coastal/shared-ui";
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

function statusBadge(status?: string) {
  switch (status) {
    case "in-progress":
      return { label: "In Progress", className: "bg-amber-100 text-amber-900" };
    case "confirmed":
      return { label: "Upcoming", className: "bg-sky-100 text-sky-900" };
    default:
      return { label: status ?? "Pending", className: "bg-slate-100 text-slate-700" };
  }
}

export default function TodayJobCard({ booking }: Props) {
  const customerName = getBookingCustomerName(booking) || "Customer";
  const service = formatBookingService(booking);
  const vehicle = formatBookingVehicle(booking);
  const phone = booking.customerPhone || booking.phone || "";
  const address = booking.address || "";
  const arrival = getBookingArrivalTime(booking);
  const sb = statusBadge(booking.status);

  const telHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined;
  const navHref = address
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`
    : undefined;

  return (
    <Card className="flex flex-col gap-4 p-4 lg:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-foreground">{customerName}</div>
          <div className="text-sm text-muted-foreground">{vehicle || service}</div>
        </div>
        <Badge variant="outline" className={sb.className}>
          {sb.label}
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

      <div className="flex flex-wrap gap-2">
        <Button asChild className="flex-1 min-h-[48px]">
          <Link href={`/jobs/${booking.id}`}>
            Open
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        {telHref && (
          <Button asChild variant="outline" className="min-h-[48px]">
            <a href={telHref} aria-label={`Call ${customerName}`}>
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
              aria-label={`Navigate to ${address}`}
            >
              <Navigation className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Navigate</span>
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}
