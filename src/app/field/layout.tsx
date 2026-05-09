import type { ReactNode } from "react";
import { TabBar } from "@/components/field/TabBar";
import { FieldPageHeader } from "@/components/field/FieldPageHeader";

export const metadata = {
  title: "Coastal Field",
};

// Fixed page header (top) + fixed tab bar (bottom). main is the scroll
// container; pt-14 clears the top header, pb-[88px] clears the tab bar.
// h-dvh (not min-h-dvh) so main establishes a real scroll context — with
// min-h, content taller than viewport grows the parent and overflow-y-auto
// would silently stop scrolling.
export default function FieldLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground font-sans">
      <FieldPageHeader />
      <main className="flex-1 overflow-y-auto pt-14 pb-[88px]">{children}</main>
      <TabBar />
    </div>
  );
}
