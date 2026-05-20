"use client";

/* A3f Polish Round 3 Unit 2: ops-local button variant set per WO §"buttons".
 *
 * The shared-ui Button (frozen) uses theme-driven variants (primary maps to
 * navy via --primary). The WO's primary CTA is orange (#E07B2D), so we
 * keep the shared Button intact and add this ops-local OpsButton that
 * implements the four WO variants directly:
 *
 *   primary      orange bg, white text, soft orange shadow
 *   secondary    white bg, navy text, 1px navy/16 outline
 *   text         transparent bg, navy text, no border
 *   destructive  white bg, #B23A2E text, 1px red/30 outline
 *
 * Sizes: default 44px, small 36px. Disabled gets 0.45 opacity + not-allowed.
 * Each variant carries focus-visible ring + hover treatment to stay
 * keyboard-accessible.
 *
 * Use OpsButton when the WO Round-3 button spec applies. The shared Button
 * still serves icon-only chrome (TopBar bell, sidebar tooltips) and
 * destructive inline actions that already match shared theme. */

import { forwardRef } from "react";
import { Slot } from "radix-ui";

type Variant = "primary" | "secondary" | "text" | "destructive";
type Size = "default" | "small";

interface OpsButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E07B2D]/60 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed";

const SIZES: Record<Size, string> = {
  default: "h-11 px-[18px] text-[15px] rounded-[10px]",
  small: "h-9 px-[14px] text-[13px] rounded-[9px]",
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[#E07B2D] text-white border-0 shadow-[0_1px_2px_rgba(224,123,45,0.35)] hover:bg-[#c96a23] active:bg-[#b65f1f]",
  secondary:
    "bg-white text-[#0B2040] border border-[#0B2040]/16 hover:bg-[#0B2040]/5 active:bg-[#0B2040]/10",
  text:
    "bg-transparent text-[#0B2040] border-0 px-2 hover:bg-[#0B2040]/5 active:bg-[#0B2040]/10",
  destructive:
    "bg-white text-[#B23A2E] border border-[#B23A2E]/30 hover:bg-[#B23A2E]/5 active:bg-[#B23A2E]/10",
};

export const OpsButton = forwardRef<HTMLButtonElement, OpsButtonProps>(
  function OpsButton(
    { variant = "primary", size = "default", className, asChild = false, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp
        ref={ref}
        className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className ?? ""}`}
        {...props}
      />
    );
  },
);
