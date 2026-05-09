import { JobSection } from "./JobSection";
import type { JobDetail } from "@/lib/jobs/queries";
import { Car, Anchor, Container, Truck } from "lucide-react";
import { AssetEditSheet } from "./edit/AssetEditSheet";

const ICONS: Record<string, typeof Car> = {
  vehicle: Car,
  boat: Anchor,
  trailer: Container,
  fleet_vehicle: Truck,
  unknown: Car,
};

export function JobAssetCard({
  jobId,
  asset,
  locked,
}: {
  jobId: string;
  asset: JobDetail["asset"];
  locked: boolean;
}) {
  const Icon = ICONS[asset.type] ?? Car;
  const action = <AssetEditSheet jobId={jobId} locked={locked} />;

  if (!asset.displayName) {
    return (
      <JobSection title="Asset" action={action}>
        <p className="text-sm italic text-muted-foreground">
          No asset linked to this job.
        </p>
      </JobSection>
    );
  }

  return (
    <JobSection title="Asset" action={action}>
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        <div className="flex flex-col">
          <span className="font-display text-base font-semibold">
            {asset.displayName}
          </span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {asset.type}
          </span>
        </div>
      </div>
    </JobSection>
  );
}
