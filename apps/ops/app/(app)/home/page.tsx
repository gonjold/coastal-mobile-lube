'use client';

import { useEffect, useState } from 'react';
import { getLongDateLabel } from '@coastal/shared-ui';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { JobsInFlight } from '@/components/dashboard/JobsInFlight';
import { EstimatesAwaiting } from '@/components/dashboard/EstimatesAwaiting';
import { ARPastDue } from '@/components/dashboard/ARPastDue';
import { fetchDashboard, type DashboardResult } from '@/lib/queries/dashboard';

function formatCurrency(dollars: number): string {
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(0)}%`;
}

export default function HomePage() {
  const [data, setData] = useState<DashboardResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const todayLabel = getLongDateLabel();

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subStat = data
    ? data.kpis.jobs.thisWeek === 0 && data.kpis.jobs.inFlight === 0
      ? ''
      : `${data.kpis.jobs.thisWeek} jobs this week · ${data.kpis.jobs.inFlight} in progress`
    : '';

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      <div className="mb-1 flex flex-col md:flex-row md:items-baseline md:justify-between gap-1">
        <h1 className="text-[20px] lg:text-2xl font-semibold tracking-tight text-[#0B2040]">{todayLabel}</h1>
        {subStat && (
          <div className="text-sm text-muted-foreground">{subStat}</div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Overview of revenue, jobs in flight, outstanding A/R, and pending sales pipeline.
      </p>

      {loading && (
        <div className="text-sm text-muted-foreground py-12 text-center">Loading dashboard…</div>
      )}
      {error && !loading && (
        <div className="text-sm text-red-700 py-12 text-center">{error}</div>
      )}
      {!loading && !error && data && (
        <DashboardBody data={data} />
      )}
    </div>
  );

  function DashboardBody({ data }: { data: DashboardResult }) {
    const { kpis, panels } = data;
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            label="Revenue MTD"
            value={formatCurrency(kpis.revenue.value)}
            emptyHint={kpis.revenue.value === 0 ? 'No revenue this month yet' : undefined}
            delta={
              kpis.revenue.value > 0 && kpis.revenue.delta !== null
                ? `${fmtPct(kpis.revenue.delta)} vs last month`
                : undefined
            }
            deltaTone={kpis.revenue.delta && kpis.revenue.delta < 0 ? 'negative' : 'positive'}
          />
          <KpiCard
            label="Jobs This Week"
            value={String(kpis.jobs.thisWeek)}
            emptyHint={kpis.jobs.thisWeek === 0 ? 'No jobs scheduled this week' : undefined}
            delta={kpis.jobs.thisWeek > 0 ? `${kpis.jobs.inFlight} in flight` : undefined}
            deltaTone="neutral"
          />
          <KpiCard
            label="A/R Outstanding"
            value={formatCurrency(kpis.ar.outstanding)}
            emptyHint={kpis.ar.outstanding === 0 ? 'Nothing outstanding' : undefined}
            delta={
              kpis.ar.outstanding > 0
                ? `${kpis.ar.pastDueCount} past due`
                : undefined
            }
            deltaTone={kpis.ar.pastDueCount > 0 ? 'negative' : 'neutral'}
          />
          <KpiCard
            label="Pipeline Value"
            value={formatCurrency(kpis.pipeline.value)}
            emptyHint={kpis.pipeline.value === 0 ? 'No estimates pending' : undefined}
            delta={kpis.pipeline.value > 0 ? `${kpis.pipeline.count} estimates pending` : undefined}
            deltaTone="neutral"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <JobsInFlight rows={panels.jobsInFlight} techMap={panels.techMap} />
          </div>
          <div className="space-y-4">
            <EstimatesAwaiting rows={panels.estimatesAwaiting} />
            <ARPastDue rows={panels.arPastDue} />
          </div>
        </div>
      </>
    );
  }
}
