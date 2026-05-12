import * as React from "react"
import { cn } from "../../lib/utils"

const Kbd = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-semibold text-muted-foreground",
        className
      )}
      {...props}
    />
  )
)
Kbd.displayName = "Kbd"

export { Kbd }
