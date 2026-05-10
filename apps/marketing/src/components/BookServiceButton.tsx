"use client";

import { type ReactNode } from "react";
import { useBooking } from "@/contexts/BookingContext";
import Button from "./Button";

export default function BookServiceButton({
  variant = "primary",
  size = "lg",
  className = "",
  children = "Book Service",
}: {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
}) {
  const { openBooking } = useBooking();
  return (
    <Button variant={variant} size={size} className={className} onClick={openBooking}>
      {children}
    </Button>
  );
}

export function BookServiceLink({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { openBooking } = useBooking();
  return (
    <button onClick={openBooking} className={className}>
      {children}
    </button>
  );
}
