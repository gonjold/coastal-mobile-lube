'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { getBookingCustomerName } from '@coastal/shared-types';
import type { BookingDoc } from '@/lib/queries/bookings';

function formatCurrency(dollars: number): string {
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function daysSince(d?: { toDate: () => Date }): number | null {
  if (!d) return null;
  const ms = Date.now() - d.toDate().getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export type EstimatesAwaitingProps = {
  rows: BookingDoc[];
};

export function EstimatesAwaiting({ rows }: EstimatesAwaitingProps) {
  const isEmpty = rows.length === 0;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold">Estimates awaiting</h2>
        </div>
        {!isEmpty && (
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold">
            {rows.length} awaiting
          </span>
        )}
      </div>
      {isEmpty ? (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          No estimates pending customer decision
        </div>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((b) => {
            const aging = daysSince(b.customerEstimateSentAt ?? b.createdAt);
            const amount = typeof b.estimateTotal === 'number' ? b.estimateTotal : 0;
            return (
              <Link
                key={b.id}
                href={`/jobs/${b.id}`}
                className="px-5 py-3 flex items-center gap-4 hover:bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Estimate</div>
                  <div className="text-sm font-semibold truncate">
                    {getBookingCustomerName(b) || 'Unnamed'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold">{formatCurrency(amount)}</div>
                  {aging !== null && (
                    <div className="text-[11px] text-muted-foreground">Sent {aging}d ago</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
