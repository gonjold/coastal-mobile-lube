import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Coastal Mobile Lube & Tire | Tampa FL",
  description:
    "Get in touch with Coastal Mobile Lube & Tire. Request a quote, ask a question, or schedule fleet service. Call 813-722-LUBE or fill out our contact form.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
