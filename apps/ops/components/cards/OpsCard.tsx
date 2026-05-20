"use client";

/* A3f Phase 6A.1: generic clickable card primitive shared across the four
 * mobile list surfaces (jobs, invoices, customers, pending billing).
 *
 * Mirrors the Phase 5 whole-row pattern exactly:
 * - onClick + onKeyDown (Enter / Space) call router.push(href)
 * - role="link" + tabIndex={0} + aria-label for screen-reader semantics
 * - cursor-pointer + hover:bg-muted/40 + focus-visible ring
 * - Nested interactive children (phone/email taps) MUST call
 *   e.stopPropagation() in their onClick so they don't bubble into the
 *   card navigate; see JobCard/CustomerCard for examples.
 *
 * The card itself is a <div> with role="link" rather than wrapping <a>
 * because nested <a> elements (the tappable phone tel: links) are
 * invalid as children of an <a>. Same trade-off as Phase 5 row pattern.
 *
 * Border radius 14 + warm-paper border matches the approved mockup.
 *
 * NOT clickable variant exists for TeamCard (display-only per WO §5.1);
 * that card builds its own static container without OpsCard. */

import { useRouter } from "next/navigation";

interface Props {
  href: string;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}

export function OpsCard({ href, ariaLabel, children, className }: Props) {
  const router = useRouter();
  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
      className={`block w-full rounded-[14px] border border-[#0B2040]/8 bg-white p-4 shadow-[0_1px_2px_rgba(11,32,64,0.06)] cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
