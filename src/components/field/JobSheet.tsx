import type { JobDetail } from "@/lib/jobs/queries";
import { JobStatusBar } from "./JobStatusBar";
import { JobCustomerCard } from "./JobCustomerCard";
import { JobAssetCard } from "./JobAssetCard";
import { JobServicesSection } from "./JobServicesSection";
import { JobPhotosSection } from "./JobPhotosSection";
import { JobNotesSection } from "./JobNotesSection";
import { JobPaymentSection } from "./JobPaymentSection";
import { JobSignaturesSection } from "./JobSignaturesSection";

export function JobSheet({ job }: { job: JobDetail }) {
  const locked = job.qboInvoiceFinalized;

  return (
    <div className="flex flex-col">
      <JobStatusBar job={job} />
      <div className="flex flex-col gap-3 p-4">
        <JobCustomerCard customer={job.customer} />
        <JobAssetCard asset={job.asset} />
        <JobServicesSection job={job} locked={locked} />
        <JobPhotosSection job={job} />
        <JobNotesSection jobId={job.id} initialNotes={job.notes ?? ""} />
        <JobPaymentSection job={job} />
        <JobSignaturesSection job={job} locked={locked} />
      </div>
    </div>
  );
}
