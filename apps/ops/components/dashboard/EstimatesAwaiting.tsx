'use client';

import { FileText } from 'lucide-react';
import { stubEstimatesAwaiting } from '@/lib/stubData';

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function EstimatesAwaiting() {
  const awaitingCount = stubEstimatesAwaiting.length;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold">Estimates awaiting</h2>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold">
          {awaitingCount} awaiting
        </span>
      </div>
      <div className="divide-y divide-border">
        {stubEstimatesAwaiting.map((est) => (
          <div key={est.id} className="px-5 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">{est.number}</div>
              <div className="text-sm font-semibold truncate">{est.customer}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold">{formatCurrency(est.amount)}</div>
              <div className="text-[11px] text-muted-foreground">
                Sent {est.sentDaysAgo}d ago
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
