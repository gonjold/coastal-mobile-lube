"use client";

/* A3f Phase 6A: mobile CustomerCard. Renders below `lg` in place of
 * CustomersTable rows. Anatomy per WO §"CustomerCard":
 * - Row 1: name (bold 15.5) left, chevron-right (soft) right
 * - Row 2: phone icon + tappable phone (blue, bold)
 * - Row 3: mail icon + email (soft, truncate)
 * - Divider, activity meta line (soft 12, e.g. "3 jobs · last May 21")
 * Whole card navigates to /customers/{customerId ?? key}. Phone tap
 * stops propagation. */

import { ChevronRight, Phone, Mail } from "lucide-react";
import type { CustomerRow } from "@/lib/queries/customers";
import { formatPhone, telHref } from "@/lib/format";
import { OpsCard } from "./OpsCard";

interface Props {
  row: CustomerRow;
}

function formatCompactDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CustomerCard({ row }: Props) {
  const id = row.customerId ?? row.key;
  const phoneHref = telHref(row.phone);
  const phoneDisplay = row.phone ? formatPhone(row.phone) : "";
  const activityBits: string[] = [];
  if (row.totalBookings > 0) {
    activityBits.push(`${row.totalBookings} job${row.totalBookings === 1 ? "" : "s"}`);
    const last = formatCompactDate(row.lastBookingDate);
    if (last) activityBits.push(`last ${last}`);
  } else {
    activityBits.push("No jobs yet");
  }
  const activity = activityBits.join(" · ");

  return (
    <OpsCard href={`/customers/${id}`} ariaLabel={`Open customer ${row.name || id}`}>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[15px] font-semibold leading-tight text-[#0B2040] min-w-0 truncate">
            {row.name || "(no name)"}
          </div>
          <ChevronRight
            className="h-5 w-5 text-[#0B2040]/45 shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        {phoneHref && (
          <a
            href={phoneHref}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-[13px] text-[#1A5FAC] font-semibold hover:underline w-fit"
            aria-label={`Call ${row.name || "customer"} at ${phoneDisplay}`}
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            <span>{phoneDisplay}</span>
          </a>
        )}

        {row.email && (
          <div className="flex items-center gap-1.5 text-[13px] text-[#0B2040]/58 min-w-0">
            <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{row.email}</span>
          </div>
        )}

        <div className="mt-1.5 pt-2.5 border-t border-[#0B2040]/8 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#0B2040]/45">
          {activity}
        </div>
      </div>
    </OpsCard>
  );
}
