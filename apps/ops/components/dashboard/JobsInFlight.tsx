'use client';

import Link from 'next/link';
import { Wrench, ChevronRight } from 'lucide-react';
import {
  formatBookingVehicle,
  formatBookingService,
  getBookingCustomerName,
  getBookingLocation,
  getBookingArrivalTime,
} from '@coastal/shared-types';
import type { BookingDoc } from '@/lib/queries/bookings';
import type { TechInfo } from '@/lib/queries/users';

const STATUS_LABEL: Record<string, string> = {
  'in-progress': 'In progress',
  confirmed: 'Confirmed',
};

const STATUS_CLASS: Record<string, string> = {
  'in-progress': 'bg-accent/15 text-accent-text border border-accent/30',
  confirmed: 'bg-muted text-foreground border border-border',
};

export type JobsInFlightProps = {
  rows: BookingDoc[];
  techMap: Map<string, TechInfo>;
};

export function JobsInFlight({ rows, techMap }: JobsInFlightProps) {
  const isEmpty = rows.length === 0;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold">Jobs in flight</h2>
        </div>
        <Link
          href="/jobs"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          View all <ChevronRight className="w-3 h-3" strokeWidth={2} />
        </Link>
      </div>
      {isEmpty ? (
        <div className="px-5 py-8 text-center">
          <div className="text-sm text-muted-foreground mb-2">No active jobs right now</div>
          <Link
            href="/jobs"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Schedule a job
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((b) => {
            const statusKey = typeof b.status === 'string' ? b.status : '';
            const statusClass = STATUS_CLASS[statusKey] ?? 'bg-muted text-muted-foreground border border-border';
            const statusLabel = STATUS_LABEL[statusKey] ?? statusKey;
            const tech = b.assignedTechId ? techMap.get(b.assignedTechId) : undefined;
            return (
              <Link
                key={b.id}
                href={`/jobs/${b.id}`}
                className="px-5 py-3 flex items-center gap-4 hover:bg-muted/30"
              >
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${statusClass}`}>
                  {statusLabel}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {getBookingCustomerName(b) || 'Unnamed'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {formatBookingVehicle(b)} · {formatBookingService(b)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right shrink-0 hidden sm:block">
                  <div>{getBookingArrivalTime(b)}</div>
                  <div>{getBookingLocation(b)}</div>
                </div>
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shrink-0">
                  {tech?.initials ?? '—'}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
