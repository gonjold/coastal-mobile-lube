"use client";

/* A3f Phase 6A: mobile InvoiceCard. Renders below `lg` in place of
 * InvoicesTable rows. Anatomy per WO §"InvoiceCard":
 * - Row 1: invoice number (bold navy, tabular-nums) left, status badge right
 * - Row 2: customer name (13.5)
 * - Divider, footer: date (mid) left; amount (bold 17, tabular-nums) right
 * Whole card navigates to /invoices/{id}. */

import { Badge, statusBadgeVariant } from "@coastal/shared-ui";
import type { Invoice } from "@coastal/shared-types";
import { OpsCard } from "./OpsCard";

interface Props {
  invoice: Invoice & { id: string };
}

function formatCompactDate(iso?: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function InvoiceCard({ invoice }: Props) {
  const invoiceLabel = invoice.invoiceNumber || invoice.id.slice(0, 8);
  const total = typeof invoice.qbTotalAmount === "number" ? invoice.qbTotalAmount : invoice.total;
  const dateLabel = formatCompactDate(invoice.invoiceDate) || formatCompactDate(invoice.dueDate) || "";

  return (
    <OpsCard
      href={`/invoices/${invoice.id}`}
      ariaLabel={`Open invoice ${invoiceLabel}`}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#0B2040]/45 tabular-nums truncate">
            {invoiceLabel}
          </div>
          <Badge variant={statusBadgeVariant(invoice.status)} className="capitalize shrink-0">
            {invoice.status}
          </Badge>
        </div>

        {invoice.customerName && (
          <div className="text-[15px] font-semibold text-[#0B2040] leading-tight truncate">{invoice.customerName}</div>
        )}

        <div className="mt-1.5 pt-2.5 border-t border-[#0B2040]/8 flex items-center justify-between gap-3">
          <div className="text-[13px] text-[#0B2040]/58">{dateLabel || "Date TBD"}</div>
          <div className="text-[15px] font-bold text-[#0B2040] tabular-nums shrink-0">
            {formatCurrency(total)}
          </div>
        </div>
      </div>
    </OpsCard>
  );
}
