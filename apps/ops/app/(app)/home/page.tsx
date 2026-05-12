import { KpiCard } from '@/components/dashboard/KpiCard';
import { JobsInFlight } from '@/components/dashboard/JobsInFlight';
import { EstimatesAwaiting } from '@/components/dashboard/EstimatesAwaiting';
import { ARPastDue } from '@/components/dashboard/ARPastDue';
import { stubKpis } from '@/lib/stubData';

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function HomePage() {
  const { revenueMTD, jobsThisWeek, arOutstanding, pipelineValue } = stubKpis;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      <div className="mb-1 flex flex-col md:flex-row md:items-baseline md:justify-between gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{today}</h1>
        <div className="text-sm text-muted-foreground">
          {jobsThisWeek.count} jobs this week · {jobsThisWeek.inFlight} in progress
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Overview of revenue, jobs in flight, outstanding A/R, and pending sales pipeline.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Revenue MTD"
          value={formatCurrency(revenueMTD.value)}
          delta={`+${revenueMTD.deltaPct}% ${revenueMTD.baselineLabel}`}
          deltaTone="positive"
        />
        <KpiCard
          label="Jobs This Week"
          value={String(jobsThisWeek.count)}
          delta={`${jobsThisWeek.inFlight} in flight`}
          deltaTone="neutral"
        />
        <KpiCard
          label="A/R Outstanding"
          value={formatCurrency(arOutstanding.value)}
          delta={`${arOutstanding.pastDueCount} past due`}
          deltaTone="negative"
        />
        <KpiCard
          label="Pipeline Value"
          value={formatCurrency(pipelineValue.value)}
          delta={`${pipelineValue.estimateCount} estimates pending`}
          deltaTone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <JobsInFlight />
        </div>
        <div className="space-y-4">
          <EstimatesAwaiting />
          <ARPastDue />
        </div>
      </div>
    </div>
  );
}
