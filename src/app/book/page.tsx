import type { Metadata } from "next";
import BookingForm from "./BookingForm";

export const metadata: Metadata = {
  title: "Book Mobile Service | Coastal Mobile Lube & Tire",
  description:
    "Schedule mobile oil changes, tire service, brake repair, and more. We come to your home or office in Apollo Beach and the South Shore. Book online in under 60 seconds.",
};

export default function BookPage() {
  return <BookingForm />;
}
