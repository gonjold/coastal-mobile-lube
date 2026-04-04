import type { Metadata } from "next";
import FAQContent from "./FAQContent";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Coastal Mobile Lube & Tire",
  description:
    "Answers to common questions about mobile oil change, tire, and marine service in Apollo Beach, FL. How mobile service works, areas served, pricing, and more.",
};

export default function FAQPage() {
  return <FAQContent />;
}
