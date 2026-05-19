import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        // A3e: status variants. Single source of truth for the status chips
        // rendered across /jobs, /invoices, /schedule, /customers, /today.
        // Calibrated for contrast on the warm-paper background of the ops
        // light theme; foreground reads against background even at small
        // badge size.
        statusInProgress: "bg-amber-100 text-amber-900 border-amber-200",
        statusConfirmed: "bg-sky-100 text-sky-900 border-sky-200",
        statusCompleted: "bg-emerald-100 text-emerald-900 border-emerald-200",
        statusDraft: "bg-slate-100 text-slate-700 border-slate-200",
        statusSent: "bg-sky-100 text-sky-900 border-sky-200",
        statusPaid: "bg-emerald-100 text-emerald-900 border-emerald-200",
        statusOverdue: "bg-red-100 text-red-900 border-red-200",
        statusCancelled: "bg-slate-100 text-slate-500 border-slate-200 line-through",
        statusPending: "bg-stone-100 text-stone-700 border-stone-200",
        statusDead: "bg-slate-100 text-slate-500 border-slate-200",
        statusNewLead: "bg-violet-100 text-violet-900 border-violet-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/** Map a booking/invoice status string to the matching Badge variant. */
export function statusBadgeVariant(status?: string | null): VariantProps<typeof badgeVariants>["variant"] {
  switch (status) {
    case "in-progress":
    case "in_progress":
      return "statusInProgress";
    case "confirmed":
      return "statusConfirmed";
    case "completed":
    case "invoiced":
      return "statusCompleted";
    case "draft":
      return "statusDraft";
    case "sent":
      return "statusSent";
    case "paid":
      return "statusPaid";
    case "overdue":
      return "statusOverdue";
    case "cancelled":
      return "statusCancelled";
    case "pending":
      return "statusPending";
    case "dead":
      return "statusDead";
    case "new-lead":
    case "new_lead":
      return "statusNewLead";
    default:
      return "outline";
  }
}

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
