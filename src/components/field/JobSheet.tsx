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

// pt-14 on body clears the fixed JobStatusBar (top:56, h-14). Combined
// with main's pt-14 for the field page header, content starts at 112px.
export function JobSheet({ job }: { job: JobDetail }) {
  const locked = job.qboInvoiceFinalized;

  return (
    <>
      <JobStatusBar job={job} />
      <div className="flex flex-col gap-3 p-4 pt-14">
        <JobActionButton job={job} />
        <JobCustomerCard customer={job.customer} />
        <JobAssetCard asset={job.asset} />
        <JobServicesSection job={job} locked={locked} />
        <JobPhotosSection job={job} />
        <JobNotesSection jobId={job.id} initialNotes={job.notes ?? ""} />
        <JobPaymentSection job={job} />
        <JobSignaturesSection job={job} locked={locked} />
      </div>
    </>
  );
}
