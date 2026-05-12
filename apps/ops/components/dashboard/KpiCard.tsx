'use client';

import { Card } from '@coastal/shared-ui';

export type KpiCardProps = {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'positive' | 'negative' | 'neutral';
  /** Optional muted secondary text shown when the primary value is zero
   * (replaces delta in empty states). */
  emptyHint?: string;
};

export function KpiCard({ label, value, delta, deltaTone = 'neutral', emptyHint }: KpiCardProps) {
  const deltaClass =
    deltaTone === 'positive'
      ? 'text-emerald-600'
      : deltaTone === 'negative'
        ? 'text-red-600'
        : 'text-muted-foreground';

  return (
    <Card className="gap-1 py-4 px-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {emptyHint ? (
        <div className="text-xs text-muted-foreground">{emptyHint}</div>
      ) : delta ? (
        <div className={`text-xs ${deltaClass}`}>{delta}</div>
      ) : null}
    </Card>
  );
}
