'use client';

import { AlertCircle } from 'lucide-react';
import { stubARPastDue } from '@/lib/stubData';

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function ARPastDue() {
  const overdueTotal = stubARPastDue.reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold">A/R past due</h2>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[11px] font-semibold">
          {formatCurrency(overdueTotal)} overdue
        </span>
      </div>
      <div className="divide-y divide-border">
        {stubARPastDue.map((row) => {
          const severityClass =
            row.daysOverdue >= 30 ? 'text-red-700' : 'text-amber-700';
          return (
            <div key={row.id} className="px-5 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{row.number}</div>
                <div className="text-sm font-semibold truncate">{row.customer}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold">{formatCurrency(row.amount)}</div>
                <div className={`text-[11px] font-semibold ${severityClass}`}>
                  {row.daysOverdue}d overdue
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
