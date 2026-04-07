"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import BookingWizardModal from "@/components/BookingWizardModal";

export interface BookingPreselect {
  division?: string;
  categoryId?: string;
  serviceId?: string;
}

interface BookingContextType {
  openBooking: (preselect?: BookingPreselect | React.MouseEvent) => void;
  bookingOpen: boolean;
}

const BookingContext = createContext<BookingContextType>({ openBooking: () => {}, bookingOpen: false });

export function useBooking() {
  return useContext(BookingContext);
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselect, setPreselect] = useState<BookingPreselect | undefined>();
  const openBooking = useCallback((ps?: BookingPreselect | React.MouseEvent) => {
    // Ignore MouseEvent when used directly as onClick handler
    const data = ps && typeof ps === "object" && "division" in ps ? ps : undefined;
    setPreselect(data);
    setBookingOpen(true);
  }, []);

  return (
    <BookingContext.Provider value={{ openBooking, bookingOpen }}>
      {children}
      <BookingWizardModal
        isOpen={bookingOpen}
        onClose={() => { setBookingOpen(false); setPreselect(undefined); }}
        preselect={preselect}
      />
    </BookingContext.Provider>
  );
}
