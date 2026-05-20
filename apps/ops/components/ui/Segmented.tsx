"use client";

/* A3f Polish Round 3 Unit 3 + 5: ops-local segmented control per WO.
 *
 * Container bg navy/5, radius 10, padding 3. Segments flex 1 0 auto so
 * they grow to fill but never shrink below content (labels never
 * truncate, no horizontal scroll). Active segment: white bg + soft
 * shadow, navy 600. Inactive: navy 55 percent, weight 500. Count chip:
 * 11/700 tabular-nums, orange when active else navy 40 percent.
 *
 * Used by Today (status filter, Unit 3), Schedule (Day/Week/Month view
 * toggle, Unit 5), and replaces ad-hoc filter chip rows on Jobs and
 * Invoices where the WO calls for the same look. */

import type { ReactNode } from "react";

export interface SegmentedItem<T extends string = string> {
  key: T;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface Props<T extends string> {
  items: SegmentedItem<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function Segmented<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-[3px] bg-[#0B2040]/5 rounded-[10px] p-[3px] w-full ${className ?? ""}`}
    >
      {items.map((it) => {
        const active = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.key)}
            className={[
              "flex-[1_0_auto] inline-flex items-center justify-center gap-1.5",
              "px-2.5 py-2 rounded-[8px] whitespace-nowrap text-[13px] leading-none",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E07B2D]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B2040]/5",
              active
                ? "bg-white shadow-[0_1px_2px_rgba(11,32,64,0.12)] text-[#0B2040] font-semibold"
                : "bg-transparent text-[#0B2040]/55 font-medium hover:text-[#0B2040]/75",
            ].join(" ")}
          >
            {it.icon ? <span aria-hidden="true">{it.icon}</span> : null}
            <span>{it.label}</span>
            {it.count != null && (
              <span
                className={[
                  "text-[11px] font-bold tabular-nums",
                  active ? "text-[#E07B2D]" : "text-[#0B2040]/40",
                ].join(" ")}
              >
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
