import type { ReactNode } from "react";
import { TabBar } from "@/components/field/TabBar";

export const metadata = {
  title: "Coastal Field",
};

export default function FieldLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground font-sans">
      <main className="flex-1 overflow-y-auto pb-[88px]">{children}</main>
      <TabBar />
    </div>
  );
}
