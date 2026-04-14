"use client";

import { useState } from "react";
import { type Booking, getServiceLabel } from "@/app/admin/shared";

/* ── Types ── */

export interface CompletedJob {
  booking: Booking;
  estimatedAmount: number;
}

/* ── Component ── */

export default function NeedsInvoiceBanner({
  jobs,
  onCreateInvoice,
}: {
  jobs: CompletedJob[];
  onCreateInvoice: (job: CompletedJob) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (jobs.length === 0) return null;

  const totalAmount = jobs.reduce((sum, j) => sum + j.estimatedAmount, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      {/* Header bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-amber-50 px-5 py-3.5 flex justify-between items-center cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-amber-800">
            {jobs.length} completed job{jobs.length !== 1 ? "s" : ""} ready for invoicing
          </span>
          <span className="text-[13px] font-medium text-amber-800">
            (${totalAmount.toFixed(2)})
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-amber-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded list */}
      {expanded && (
        <div>
          {jobs.map((job) => {
            const b = job.booking;
            const name = b.name || b.customerName || "—";
            const service = getServiceLabel(b);
            const vehicle = [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") ||
              [b.vesselYear, b.vesselMake, b.vesselModel].filter(Boolean).join(" ") || "";

            return (
              <div
                key={b.id}
                className="px-5 py-3 flex justify-between items-center border-b border-gray-200 last:border-b-0"
              >
                <div>
                  <div className="text-sm font-semibold text-[#0B2040]">{name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {service}{vehicle ? ` \u00B7 ${vehicle}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#0B2040]">
                    ${job.estimatedAmount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onCreateInvoice(job)}
                    className="px-4 py-1.5 bg-[#E07B2D] rounded-lg text-xs font-semibold text-white hover:bg-[#CC6A1F] cursor-pointer whitespace-nowrap transition"
                  >
                    Create Invoice
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
