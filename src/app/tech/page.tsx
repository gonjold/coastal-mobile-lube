"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TechRoot() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/tech/jobs");
  }, [router]);
  return null;
}
