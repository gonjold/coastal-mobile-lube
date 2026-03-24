import type { Metadata } from "next";
import BookingWizard from "./BookingWizard";

export const metadata: Metadata = {
  title: "Book Your Service | Coastal Mobile Lube & Tire",
  description:
    "Schedule your mobile oil change, tire service, or marine maintenance in Tampa. Book online in under two minutes.",
};

export default function BookPage() {
  return <BookingWizard />;
}
