import type { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Coastal Mobile Lube & Tire. Call 813-722-LUBE or request a quote online.",
  openGraph: {
    title: "Contact Us | Coastal Mobile Lube & Tire",
    description:
      "Get in touch with Coastal Mobile Lube & Tire. Call 813-722-LUBE or request a quote online.",
    url: "https://coastalmobilelube.com/contact",
    type: "website",
  },
  alternates: { canonical: "https://coastalmobilelube.com/contact" },
};

export default function ContactPage() {
  return <ContactContent />;
}
