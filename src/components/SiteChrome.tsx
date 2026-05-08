"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyBottomBar from "@/components/StickyBottomBar";
import QuoteFAB from "@/components/QuoteFAB";

interface SiteChromeProps {
  children: ReactNode;
}

export default function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname() || "";
  const isTechRoute = pathname.startsWith("/tech");

  if (isTechRoute) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <Footer />
      <StickyBottomBar />
      <QuoteFAB />
    </>
  );
}
