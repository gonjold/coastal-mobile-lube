import { notFound } from "next/navigation";
import { getJobDetail } from "@/lib/jobs/queries";
import { JobSheet } from "@/components/field/JobSheet";

export const dynamic = "force-dynamic";

export default async function FieldJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobDetail(id);
  if (!job) notFound();
  return <JobSheet job={job} />;
}
