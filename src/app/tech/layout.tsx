import type { Metadata } from "next";
import TechAuthShell from "@/components/tech/TechAuthShell";

export const metadata: Metadata = {
  title: "Coastal Tech",
  manifest: "/tech-manifest.json",
};

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return <TechAuthShell>{children}</TechAuthShell>;
}
