import { JobSection } from "./JobSection";
import type { JobDetail } from "@/lib/jobs/queries";
import { Lock } from "lucide-react";
import { AddServiceDialog } from "./edit/AddServiceDialog";
import { RemoveServiceButton } from "./edit/RemoveServiceButton";

export function JobServicesSection({
  job,
  locked,
}: {
  job: JobDetail;
  locked: boolean;
}) {
  const items = job.lineItems;
  const totals = job.totals;

  return (
    <JobSection
      title="Services"
      action={
        locked ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" strokeWidth={1.75} /> Finalized
          </span>
        ) : (
          <AddServiceDialog jobId={job.id} />
        )
      }
    >
      {items.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          No line items yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-baseline justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0"
            >
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-semibold">{it.description}</span>
                <span className="text-xs text-muted-foreground">
                  {it.qty} × ${it.unitPrice.toFixed(2)}
                  {it.taxable ? "" : " (no tax)"}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                ${it.totalPrice.toFixed(2)}
              </span>
              {!locked && (
                <RemoveServiceButton
                  jobId={job.id}
                  itemId={it.id}
                  description={it.description}
                />
              )}
            </div>
          ))}
          <div className="mt-2 border-t border-border pt-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">${totals.tax.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex justify-between font-display font-bold">
              <span>Total</span>
              <span className="tabular-nums">${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </JobSection>
  );
}
