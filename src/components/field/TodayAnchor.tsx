"use client";

import { useEffect, useState, type RefObject } from "react";
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TodayAnchor({
  todayRef,
}: {
  todayRef: RefObject<HTMLElement | null>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = todayRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [todayRef]);

  function scrollToToday() {
    todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!visible) return null;

  return (
    <Button
      onClick={scrollToToday}
      size="sm"
      className="fixed bottom-[100px] right-4 z-30 shadow-lg"
    >
      <Sun className="mr-2 h-4 w-4" strokeWidth={1.75} /> Today
    </Button>
  );
}
