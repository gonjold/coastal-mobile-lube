'use client';

import Link from 'next/link';
import type { Booking } from '@/lib/types/booking';
import { getServiceLabel } from '@/lib/types/booking-helpers';
import {
  fmtBookingDate,
  formatBookingTimeLabel,
} from '@coastal/shared-ui';
import { getBookingDivision } from '@/lib/schedule-filters';

interface Props {
  booking: Booking;
  techName: string | null;
}

export function ScheduleBookingRow({ booking, techName }: Props) {
  const date = fmtBookingDate(booking.confirmedDate || booking.preferredDate);
  const time = formatBookingTimeLabel(booking);
  const customer = booking.name || booking.customerName || 'Customer';
  const service = getServiceLabel(booking) || 'Service';
  const division = getBookingDivision(booking);
  const techLabel = techName || 'Unassigned';
  const techIsUnassigned = !techName;

  return (
    <Link
      href={`/tech/jobs/${booking.id}`}
      className="block min-h-[64px] rounded-lg bg-white shadow-sm px-3 py-2 active:bg-slate-50 hover:bg-slate-50"
    >
      <div className="flex items-start gap-3">
        <div className="w-[64px] flex-shrink-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {date}
          </div>
          <div className="text-[13px] font-semibold text-slate-700">{time}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-bold text-[#0B2040] truncate">
              {customer}
            </div>
            <StatusPill status={booking.status} />
          </div>
          <div className="mt-0.5 text-xs text-slate-500 truncate">
            <span>{service}</span>
            <span className="mx-1 text-slate-300">·</span>
            <span className="uppercase tracking-wide text-[10px] font-semibold text-slate-500">
              {division}
            </span>
          </div>
          <div
            className={`mt-0.5 text-xs ${
              techIsUnassigned
                ? 'text-[#E07B2D] font-semibold'
                : 'text-slate-500'
            }`}
          >
            Tech: {techLabel}
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatusPill({ status }: { status?: string }) {
  const cls = pillClass(status);
  const label = (status || '—').replace('-', ' ').replace('_', ' ');
  return (
    <span
      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

function pillClass(status?: string): string {
  switch (status) {
    case 'confirmed':
    case 'pending':
      return 'bg-[#DBEAFE] text-[#1E3A8A]';
    case 'in-progress':
      return 'bg-[#E07B2D] text-white';
    case 'completed':
      return 'bg-[#DCFCE7] text-[#166534]';
    case 'cancelled':
      return 'bg-slate-200 text-slate-600';
    case 'dead':
      return 'bg-slate-200 text-slate-500';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
