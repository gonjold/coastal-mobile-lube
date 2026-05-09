import { JobSection } from "./JobSection";
import type { JobDetail } from "@/lib/jobs/queries";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export function JobPhotosSection({ job }: { job: JobDetail }) {
  const photos = job.photos;

  return (
    <JobSection
      title="Photos"
      action={
        <Button size="sm" variant="outline" disabled>
          <Camera className="mr-1 h-3 w-3" strokeWidth={1.75} /> Add
        </Button>
      }
    >
      {photos.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption ?? "Job photo"}
                className="h-full w-full object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </JobSection>
  );
}
