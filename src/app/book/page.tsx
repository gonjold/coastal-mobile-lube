import type { Metadata } from "next";
import BookRedirect from "./BookRedirect";

export const metadata: Metadata = {
  title: "Book Service",
  description:
    "Book mobile auto, marine, or RV service online. Choose your service, pick a date, and we come to you.",
  openGraph: {
    title: "Book Service | Coastal Mobile Lube & Tire",
    description:
      "Book mobile auto, marine, or RV service online. Choose your service, pick a date, and we come to you.",
    url: "https://coastalmobilelube.com/book",
    type: "website",
  },
  alternates: { canonical: "https://coastalmobilelube.com/book" },
};

export default function BookPage() {
  return <BookRedirect />;
}
