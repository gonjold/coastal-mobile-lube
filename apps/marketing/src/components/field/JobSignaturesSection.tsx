"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JobSection } from "./JobSection";
import type { JobDetail, JobSignature } from "@/lib/jobs/queries";
import { Button } from "@coastal/shared-ui";
import { SignatureCapture } from "./SignatureCapture";
import { CheckCircle2, Lock } from "lucide-react";

export function JobSignaturesSection({
  job,
  locked,
}: {
  job: JobDetail;
  locked: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState<"estimate" | "completion" | null>(null);

  return (
    <>
      <JobSection
        title="Signatures"
        action={
          locked ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" strokeWidth={1.75} /> Finalized
            </span>
          ) : null
        }
      >
        <div className="flex flex-col gap-3">
          <SignatureRow
            label="Estimate"
            sig={job.signatures.estimate}
            onCapture={() => setActive("estimate")}
            disabled={locked}
          />
          <SignatureRow
            label="Completion"
            sig={job.signatures.completion}
            onCapture={() => setActive("completion")}
            disabled={locked}
          />
        </div>
      </JobSection>

      {active && (
        <SignatureCapture
          jobId={job.id}
          kind={active}
          open={!!active}
          onOpenChange={(v) => !v && setActive(null)}
          onCaptured={() => router.refresh()}
        />
      )}
    </>
  );
}

function SignatureRow({
  label,
  sig,
  onCapture,
  disabled,
}: {
  label: string;
  sig: JobSignature | null;
  onCapture: () => void;
  disabled: boolean;
}) {
  if (sig) {
    const signed = sig.signedAt
      ? new Date(sig.signedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 p-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{label}</span>
          {signed && (
            <span className="text-xs text-muted-foreground">
              Signed {signed}
            </span>
          )}
        </div>
        <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={1.75} />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border p-3">
      <span className="text-sm">{label} signature</span>
      <Button
        size="sm"
        variant="outline"
        onClick={onCapture}
        disabled={disabled}
      >
        Capture
      </Button>
    </div>
  );
}
