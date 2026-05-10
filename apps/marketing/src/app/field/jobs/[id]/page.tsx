import { notFound } from "next/navigation";
import { getJobDetail } from "@/lib/jobs/queries";
import { JobSheet } from "@/components/field/JobSheet";
import { RescheduleControl } from "@/components/field/RescheduleControl";

export const dynamic = "force-dynamic";

export default async function FieldJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobDetail(id);
  if (!job) notFound();
  // RescheduleControl is rendered as a JobSheet *sibling* before JobSheet so
  // it lands at the top of the scroll area — visually below the fixed
  // JobStatusBar and above JobActionButton — without modifying JobSheet
  // (which Sprint 2 owns the inner section-swap edits on).
  return (
    <>
      <RescheduleControl job={job} />
      <JobSheet job={job} />
    </>
  );
}
