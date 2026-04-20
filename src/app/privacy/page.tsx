import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Coastal Mobile Lube & Tire",
  description:
    "How Coastal Mobile Lube & Tire collects, uses, and protects your information.",
  alternates: { canonical: "https://coastalmobilelube.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0B2040]">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-12 pb-10 md:pt-16 md:pb-14">
          <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[2.5px] mb-4">
            Legal
          </p>
          <h1 className="text-[32px] md:text-[46px] font-extrabold leading-[1.06] text-white tracking-[-1.5px] mb-4">
            Privacy Policy
          </h1>
          <p className="text-[14px] text-white/60">Effective: April 20, 2026</p>
        </div>
      </section>

      {/* Body */}
      <section className="bg-white">
        <div className="max-w-[780px] mx-auto px-4 lg:px-6 py-12 md:py-16">
          <p className="text-[15px] leading-[1.7] text-[#444] mb-10">
            Coastal Mobile Lube &amp; Tire LLC (&ldquo;Coastal,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us&rdquo;) operates
            coastalmobilelube.com and the booking, scheduling, and invoicing
            services offered through it. This policy explains what we collect,
            why, who we share it with, and your rights.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            1. Who we are and how to reach us
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            Coastal Mobile Lube &amp; Tire LLC
            <br />
            Apollo Beach, FL
            <br />
            Phone: 813-722-5823
            <br />
            Email: info@coastalmobilelube.com
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            2. Information we collect
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444] font-semibold mb-2">
            You give us:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.7] text-[#444] mb-5">
            <li>Contact info: name, phone number, email, and service address</li>
            <li>
              Vehicle info: year, make, model, trim, VIN, fuel type, and
              odometer reading
            </li>
            <li>
              Service details: services requested, preferred date and time, and
              any special instructions
            </li>
            <li>
              Payment info: processed by our payment partners (Intuit
              QuickBooks, Clover). Full card numbers never touch Coastal
              servers.
            </li>
          </ul>
          <p className="text-[15px] leading-[1.7] text-[#444] font-semibold mb-2">
            We collect automatically when you use the site:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.7] text-[#444] mb-5">
            <li>Device and browser info (type, operating system, screen size)</li>
            <li>IP address and approximate location</li>
            <li>Pages visited, referral source, and time on site</li>
            <li>
              Anonymous scan data from Coastal QR codes (count, timestamp,
              approximate location)
            </li>
          </ul>
          <p className="text-[15px] leading-[1.7] text-[#444] font-semibold mb-2">
            From our partners:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.7] text-[#444]">
            <li>Vehicle specifications from NHTSA&rsquo;s public VIN database</li>
            <li>Existing customer records that Jason (owner) may import manually</li>
          </ul>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            3. How we use it
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.7] text-[#444]">
            <li>Schedule and deliver the service you booked</li>
            <li>
              Contact you about your appointment (confirmation, reminders,
              arrival notifications, and status updates)
            </li>
            <li>Process payment and send receipts</li>
            <li>Track your service history for warranty and follow-up</li>
            <li>Improve the site and our operations</li>
            <li>
              Meet legal and regulatory requirements, including Florida
              Department of Agriculture and Consumer Services (FDACS)
              recordkeeping for motor vehicle repair
            </li>
          </ul>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            4. Who we share it with
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444] mb-4">
            We share data only with service providers that help us run Coastal.
            We do not sell your data.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.7] text-[#444] mb-4">
            <li>Google Firebase: site database, authentication, and hosting</li>
            <li>Netlify: web hosting</li>
            <li>
              Intuit QuickBooks: customer records, invoices, and payment
              processing
            </li>
            <li>
              Clover: customer records, orders, and card-present payment
              processing
            </li>
            <li>
              Twilio: name, phone number, and message content for appointment
              texts
            </li>
            <li>Google Analytics (GA4): anonymous usage statistics</li>
            <li>Cloudinary: image hosting</li>
            <li>NHTSA: VIN-only lookup for vehicle decoding</li>
          </ul>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            We may also share data when required by law, including subpoena,
            court order, or regulatory request.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            5. Cookies and tracking
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            We use cookies to keep you signed in to admin tools, remember your
            preferences, and measure site performance. You can disable cookies
            in your browser, but some features (booking, account management)
            will not work without them.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            6. Your rights
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444] mb-3">You can:</p>
          <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.7] text-[#444] mb-5">
            <li>Ask what data we have about you</li>
            <li>Ask us to correct inaccurate data</li>
            <li>
              Ask us to delete your account and associated data, subject to
              legal retention requirements (for example, FDACS requires 2-year
              invoice retention)
            </li>
            <li>
              Opt out of marketing messages at any time by texting STOP to any
              SMS or clicking unsubscribe in email
            </li>
          </ul>
          <p className="text-[15px] leading-[1.7] text-[#444] mb-4">
            Email info@coastalmobilelube.com for any of these requests. We
            respond within 30 days.
          </p>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            California residents have additional rights under CCPA and CPRA,
            including the right to know categories of data collected, the right
            to delete, and the right to opt out of sale. Coastal does not sell
            personal data.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            7. Data retention
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.7] text-[#444]">
            <li>Appointment and service records: 2 years minimum (FDACS requirement)</li>
            <li>Invoice and payment records: 7 years (tax recordkeeping)</li>
            <li>QR code scan logs: 90 days</li>
            <li>
              Deleted customer accounts: purged within 30 days unless retention
              is legally required
            </li>
          </ul>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            8. Security
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            We use industry-standard encryption for data in transit (TLS/HTTPS)
            and at rest. Access to your data is limited to Coastal staff and the
            service providers listed above. No system is 100 percent secure. If
            a breach affects your data, we will notify you as required by
            Florida law.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            9. Children
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            This site is not intended for anyone under 18. We do not knowingly
            collect data from minors. If you believe we have, contact us and we
            will delete it.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            10. Changes
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            We may update this policy. The effective date at the top shows the
            latest version. Material changes will be posted on the site and,
            where we have your contact info, sent by email.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            11. Questions
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            Email info@coastalmobilelube.com or call 813-722-5823.
          </p>
        </div>
      </section>
    </>
  );
}
