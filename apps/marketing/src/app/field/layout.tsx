"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TabBar } from "@/components/field/TabBar";
import { FieldPageHeader } from "@/components/field/FieldPageHeader";

// Two pinned bars to clear:
//   - Most field routes: FieldPageHeader (h-14) at top:0  → main pt-14
//   - /field/jobs/[id]:  JobStatusBar (h-20) at top:0     → main pt-20
//                        (FieldPageHeader hidden — the customer/asset bar
//                        owns the top of the viewport so there's no empty
//                        whitespace strip above it)
// position:fixed, not sticky, because iOS Safari URL-bar reflow during
// scroll breaks the sticky containing block.
export default function FieldLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const isJobSheet = pathname.startsWith("/field/jobs/");

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground font-sans">
      {!isJobSheet && <FieldPageHeader />}
      <main
        className={`flex-1 overflow-y-auto pb-[88px] ${isJobSheet ? "pt-20" : "pt-14"}`}
      >
        {children}
      </main>
      <TabBar />
    </div>
  );
}
