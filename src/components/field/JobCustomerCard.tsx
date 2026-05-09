import { JobSection } from "./JobSection";
import type { JobDetail } from "@/lib/jobs/queries";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import { CustomerEditSheet } from "./edit/CustomerEditSheet";

export function JobCustomerCard({
  jobId,
  customer,
  locked,
}: {
  jobId: string;
  customer: JobDetail["customer"];
  locked: boolean;
}) {
  return (
    <JobSection
      title="Customer"
      action={
        <CustomerEditSheet
          jobId={jobId}
          locked={locked}
          initial={{
            name: customer.name ?? "",
            phone: customer.phone ?? "",
            email: customer.email ?? "",
            address: customer.address ?? "",
          }}
        />
      }
    >
      <div className="flex flex-col gap-2">
        <span className="font-display text-base font-semibold">
          {customer.name}
        </span>
        {customer.phone && (
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <Phone
              className="h-4 w-4 text-muted-foreground"
              strokeWidth={1.75}
            />
            {customer.phone}
          </a>
        )}
        {customer.email && (
          <a
            href={`mailto:${customer.email}`}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <Mail
              className="h-4 w-4 text-muted-foreground"
              strokeWidth={1.75}
            />
            {customer.email}
          </a>
        )}
        {customer.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(customer.address)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <MapPin
              className="h-4 w-4 text-muted-foreground"
              strokeWidth={1.75}
            />
            <span className="flex-1">{customer.address}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        )}
      </div>
    </JobSection>
  );
}
