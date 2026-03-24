import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
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
        style={{ fontFamily: "var(--font-body)" }}
      >
        <Header />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <Footer />

        {/* Mobile Sticky Bottom Bar — visible on all pages */}
        <div className="fixed bottom-0 left-0 right-0 flex lg:hidden items-center gap-3 px-4 py-3 bg-white border-t border-[#eee] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-[100]">
          <a
            href="tel:8137225823"
            className="inline-flex items-center justify-center w-12 h-12 shrink-0 text-[#0B2040] border-2 border-[#e8e8e8] rounded-[10px]"
            aria-label="Call 813-722-LUBE"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </a>
          <Link
            href="/book"
            className="flex-1 inline-flex items-center justify-center font-semibold text-white rounded-[var(--radius-button)] py-3.5 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors"
          >
            Book Online
          </Link>
        </div>
      </body>
    </html>
  );
}
