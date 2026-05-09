import { JobSection } from "./JobSection";
import type { JobDetail } from "@/lib/jobs/queries";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";

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
          <Button size="sm" variant="outline" disabled>
            <Plus className="mr-1 h-3 w-3" strokeWidth={2} /> Add
          </Button>
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
              <span className="text-sm font-semibold">
                ${it.totalPrice.toFixed(2)}
              </span>
            </div>
          ))}
          <div className="mt-2 border-t border-border pt-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex justify-between font-display font-bold">
              <span>Total</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </JobSection>
  );
}
