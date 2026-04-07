"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import BookingWizardModal from "@/components/BookingWizardModal";

interface BookingContextType {
  openBooking: () => void;
  bookingOpen: boolean;
}

const BookingContext = createContext<BookingContextType>({ openBooking: () => {}, bookingOpen: false });

export function useBooking() {
  return useContext(BookingContext);
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const openBooking = useCallback(() => setBookingOpen(true), []);

  return (
    <BookingContext.Provider value={{ openBooking, bookingOpen }}>
      {children}
      <BookingWizardModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    </BookingContext.Provider>
  );
}
