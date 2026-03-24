import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title:
    "Coastal Mobile Lube & Tire | Mobile Oil Change, Tire & Marine Service in Tampa",
  description:
    "Mobile oil change, tire service, and marine engine maintenance in Tampa, FL. 30 years of dealership expertise brought to your driveway, parking lot, or marina. Call 813-722-LUBE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} antialiased`}>
      <body
        className="min-h-screen flex flex-col"
        style={{ fontFamily: "var(--font-plus-jakarta), var(--font-body)" }}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
