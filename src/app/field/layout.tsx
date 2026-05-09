import type { ReactNode } from "react";
import { TabBar } from "@/components/field/TabBar";

export const metadata = {
  title: "Coastal Field",
};

// h-dvh (not min-h-dvh): the parent must be height-bounded so <main> can act
// as a real scroll container for its overflow-y-auto. With min-h, content
// taller than viewport grows the parent and main never establishes a scroll
// context — sticky page headers inside main would silently stop sticking.
export default function FieldLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground font-sans">
      <main className="flex-1 overflow-y-auto pb-[88px]">{children}</main>
      <TabBar />
    </div>
  );
}
