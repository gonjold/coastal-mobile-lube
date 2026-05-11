'use client';

import { Wrench, ChevronRight } from 'lucide-react';
import { stubJobsInFlight, type JobInFlight } from '@/lib/stubData';

const STATUS_LABEL: Record<JobInFlight['status'], string> = {
  'in-progress': 'In progress',
  confirmed: 'Confirmed',
  scheduled: 'Scheduled',
};

const STATUS_CLASS: Record<JobInFlight['status'], string> = {
  'in-progress': 'bg-accent/15 text-accent-text border border-accent/30',
  confirmed: 'bg-muted text-foreground border border-border',
  scheduled: 'bg-muted text-muted-foreground border border-border',
};

export function JobsInFlight() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold">Jobs in flight</h2>
        </div>
        <button
          type="button"
          disabled
          title="Available in A3b"
          className="text-xs text-muted-foreground/70 cursor-not-allowed flex items-center gap-1"
        >
          View all <ChevronRight className="w-3 h-3" strokeWidth={2} />
        </button>
      </div>
      <div className="divide-y divide-border">
        {stubJobsInFlight.map((job) => (
          <div key={job.id} className="px-5 py-3 flex items-center gap-4">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_CLASS[job.status]}`}
            >
              {STATUS_LABEL[job.status]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{job.customer}</div>
              <div className="text-xs text-muted-foreground truncate">
                {job.vehicle} · {job.service}
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right shrink-0 hidden sm:block">
              <div>{job.time}</div>
              <div>{job.location}</div>
            </div>
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shrink-0">
              {job.techInitials}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
