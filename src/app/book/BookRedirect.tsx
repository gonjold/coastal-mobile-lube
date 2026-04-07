"use client";

import { useEffect } from "react";
import { useBooking } from "@/contexts/BookingContext";

export default function BookRedirect() {
  const { openBooking } = useBooking();

  useEffect(() => {
    openBooking();
  }, [openBooking]);

  return (
    <div className="flex items-center justify-center py-32">
      <p className="text-[#888]">Opening booking wizard...</p>
    </div>
  );
}
