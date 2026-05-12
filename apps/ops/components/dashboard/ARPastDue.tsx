'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ARPastDueRow } from '@/lib/queries/invoices';

function formatCurrency(dollars: number): string {
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export type ARPastDueProps = {
  rows: ARPastDueRow[];
};

export function ARPastDue({ rows }: ARPastDueProps) {
  const isEmpty = rows.length === 0;
  const overdueTotal = rows.reduce((acc, r) => acc + (r.total ?? 0), 0);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEmpty ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
          )}
          <h2 className="text-sm font-semibold">A/R past due</h2>
        </div>
        {!isEmpty && (
          <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[11px] font-semibold">
            {formatCurrency(overdueTotal)} overdue
          </span>
        )}
      </div>
      {isEmpty ? (
        <div className="px-5 py-8 text-center text-sm text-emerald-700">
          All invoices current
        </div>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((row) => {
            const severityClass = row.daysOverdue >= 30 ? 'text-red-700' : 'text-amber-700';
            return (
              <Link
                key={row.id}
                href={`/invoices/${row.id}`}
                className="px-5 py-3 flex items-center gap-4 hover:bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{row.invoiceNumber}</div>
                  <div className="text-sm font-semibold truncate">{row.customerName}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold">{formatCurrency(row.total)}</div>
                  <div className={`text-[11px] font-semibold ${severityClass}`}>
                    {row.daysOverdue}d overdue
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
