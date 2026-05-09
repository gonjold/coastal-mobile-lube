import type { JobDetail } from "@/lib/jobs/queries";
import { JobStatusBar } from "./JobStatusBar";
import { JobActionButton } from "./JobActionButton";
import { JobCustomerCard } from "./JobCustomerCard";
import { JobAssetCard } from "./JobAssetCard";
import { JobServicesSection } from "./JobServicesSection";
import { JobPhotosSection } from "./JobPhotosSection";
import { JobNotesSection } from "./JobNotesSection";
import { JobPaymentSection } from "./JobPaymentSection";
import { JobSignaturesSection } from "./JobSignaturesSection";

// JobStatusBar is fixed top:0 h-20. The field layout's <main> already
// adds pt-20 on /field/jobs/*, so the body wrapper here uses no extra top
// padding — first content (JobActionButton) lands at viewport y=80px.
export function JobSheet({ job }: { job: JobDetail }) {
  const locked = job.qboInvoiceFinalized;

  return (
    <>
      <JobStatusBar job={job} />
      <div className="flex flex-col gap-3 px-4 pb-4">
        <JobActionButton job={job} />
        <JobCustomerCard jobId={job.id} customer={job.customer} locked={locked} />
        <JobAssetCard jobId={job.id} asset={job.asset} locked={locked} />
        <JobServicesSection job={job} locked={locked} />
        <JobPhotosSection job={job} />
        <JobNotesSection jobId={job.id} initialNotes={job.notes ?? ""} />
        <JobPaymentSection job={job} />
        <JobSignaturesSection job={job} locked={locked} />
      </div>
    </>
  );
}
