"use client";

/* A3f Polish Round 3 Unit 4: anchored status-filter dropdown per
 * coastal-invoice-dropdown-final.jsx.
 *
 * Trigger:   44px full-width, white bg, 1px navy/16 border (turns orange
 *            when open), label (15/600) + count (12/700 orange) on the
 *            left, chevron on the right that rotates 180 when open.
 * Menu:      absolutely positioned top: calc(100% + 6px), left/right 0,
 *            white bg, 1px hairline border, radius 12, shadow
 *            0 8px 24px rgba(11,32,64,0.16), padding 6, maxHeight 280
 *            with internal overflow-y auto. NOT a bottom sheet, NOT
 *            centered, NO Apply button.
 * Rows:      label + count + check (when active). Active bg
 *            rgba(224,123,45,0.08), label 600, orange check; inactive
 *            label 500.
 * Behavior:  tap a row sets the filter and closes. Tap outside closes
 *            via a transparent full-area catcher (no dark overlay). */

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface StatusFilterItem<T extends string = string> {
  key: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  items: StatusFilterItem<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function StatusFilterDropdown<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const active = items.find((it) => it.key === value) ?? items[0];

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function pick(key: T) {
    onChange(key);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full h-11 px-3.5 rounded-[10px] bg-white",
          "flex items-center justify-between gap-2 cursor-pointer",
          "border transition-colors",
          open ? "border-[#E07B2D]" : "border-[#0B2040]/16 hover:border-[#0B2040]/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E07B2D]/60 focus-visible:ring-offset-2",
        ].join(" ")}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-[15px] font-semibold text-[#0B2040] truncate">{active.label}</span>
          {active.count != null && (
            <span className="text-[12px] font-bold text-[#E07B2D] tabular-nums shrink-0">{active.count}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#0B2040]/50 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          {/* Transparent outside-click catcher: no dark overlay, captures
              taps anywhere on the page so menu closes without modal feel.
              Sits below the menu (z-10) and above the trigger sibling
              row but covers fullscreen via fixed inset. */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10"
          />
          <div
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#0B2040]/8 rounded-[12px] shadow-[0_8px_24px_rgba(11,32,64,0.16)] p-1.5 max-h-[280px] overflow-y-auto"
          >
            {items.map((it) => {
              const sel = it.key === value;
              return (
                <button
                  key={it.key}
                  type="button"
                  role="option"
                  aria-selected={sel}
                  onClick={() => pick(it.key)}
                  className={[
                    "w-full px-3 py-2.5 rounded-[8px] flex items-center justify-between gap-2",
                    "transition-colors cursor-pointer",
                    sel ? "bg-[#E07B2D]/8" : "bg-transparent hover:bg-[#0B2040]/5",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E07B2D]/60",
                  ].join(" ")}
                >
                  <span className={`text-[15px] truncate text-[#0B2040] ${sel ? "font-semibold" : "font-medium"}`}>
                    {it.label}
                  </span>
                  <span className="flex items-center gap-2.5 shrink-0">
                    {it.count != null && (
                      <span className="text-[13px] font-semibold text-[#0B2040]/50 tabular-nums">{it.count}</span>
                    )}
                    {sel && <Check className="h-4 w-4 text-[#E07B2D]" strokeWidth={2.5} aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
