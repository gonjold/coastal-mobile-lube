import { JobSection } from "./JobSection";
import type { JobDetail } from "@/lib/jobs/queries";
import { PhotoUploadButton } from "./edit/PhotoUploadButton";
import { PhotoGrid } from "./edit/PhotoGrid";

export function JobPhotosSection({ job }: { job: JobDetail }) {
  const photos = job.photos.map((p) => ({
    id: p.id,
    url: p.url,
    caption: p.caption,
  }));

  return (
    <JobSection title="Photos" action={<PhotoUploadButton jobId={job.id} />}>
      <PhotoGrid photos={photos} />
    </JobSection>
  );
}
