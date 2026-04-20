import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Coastal Mobile Lube & Tire",
  description:
    "Terms governing use of coastalmobilelube.com and services provided by Coastal Mobile Lube & Tire.",
  alternates: { canonical: "https://coastalmobilelube.com/terms" },
};

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0B2040]">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-12 pb-10 md:pt-16 md:pb-14">
          <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[2.5px] mb-4">
            Legal
          </p>
          <h1 className="text-[32px] md:text-[46px] font-extrabold leading-[1.06] text-white tracking-[-1.5px] mb-4">
            Terms of Service
          </h1>
          <p className="text-[14px] text-white/60">Effective: April 20, 2026</p>
        </div>
      </section>

      {/* Body */}
      <section className="bg-white">
        <div className="max-w-[780px] mx-auto px-4 lg:px-6 py-12 md:py-16">
          <p className="text-[15px] leading-[1.7] text-[#444] mb-10">
            These Terms govern your use of coastalmobilelube.com and any
            service booked through it. By using the site or booking a service,
            you agree to these Terms. If you do not agree, do not use the site.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            1. About us
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            Coastal Mobile Lube &amp; Tire LLC is a licensed Florida motor
            vehicle repair business operating in the Tampa Bay area. We provide
            mobile automotive, fleet, marine, and RV services at
            customer-specified locations. FDACS registration information
            available on request.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            2. Booking a service
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444] mb-4">
            When you book through the site you confirm:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.7] text-[#444] mb-4">
            <li>
              You own the vehicle, or you have the owner&rsquo;s permission to
              authorize service
            </li>
            <li>The information you provide is accurate</li>
            <li>
              You will be available or have an authorized adult present at the
              appointment address
            </li>
          </ul>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            Bookings are not confirmed until Coastal sends you a confirmation
            email or text. We may decline or reschedule bookings based on
            scheduling, location, or vehicle condition.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            3. Pricing and fees
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444] mb-4">
            Prices shown on the site are estimates for the service selected,
            based on the vehicle you entered. A mobile convenience fee applies
            to each visit. The current fee is shown in the booking summary
            before you submit.
          </p>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            Final pricing may change if additional work is needed once we
            inspect the vehicle. We will contact you for approval before
            performing any work beyond the original scope. Parts, tire, and
            specialty service pricing is quoted at time of service.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            4. Cancellation and rescheduling
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444] mb-4">
            You can cancel or reschedule up to 24 hours before your appointment
            at no charge. Text or call 813-722-5823 or reply to your
            confirmation.
          </p>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            Cancellations inside 24 hours or no-shows may be subject to the
            convenience fee. We reserve the right to cancel or reschedule if
            weather, vehicle access, or other circumstances make the service
            unsafe.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            5. Payment
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            Payment is due at time of service unless otherwise agreed in
            writing. We accept credit cards, debit cards, and ACH through our
            payment partners (Clover and Intuit QuickBooks Payments). Unpaid
            invoices may be subject to a late fee after 30 days and may be
            submitted to collections after 60 days.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            6. Warranty
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444] mb-4">
            Coastal warranties its labor for 30 days or 1,000 miles, whichever
            comes first. Parts are covered by the manufacturer&rsquo;s warranty.
            This warranty does not cover:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.7] text-[#444] mb-4">
            <li>Damage or wear caused by normal use after service</li>
            <li>Damage from accidents, misuse, or modifications</li>
            <li>Pre-existing conditions noted on the service invoice</li>
            <li>
              Fleet accounts, which are governed by the fleet service agreement
            </li>
          </ul>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            To make a warranty claim, contact us within the warranty period at
            info@coastalmobilelube.com with your invoice number.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            7. Your responsibilities
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.7] text-[#444] mb-4">
            <li>
              Provide safe, legal access to the vehicle at the service address
              (driveway, street parking where permitted, or private lot with
              permission)
            </li>
            <li>Disclose known mechanical issues, prior repairs, or modifications</li>
            <li>Remove personal items of value from the service area</li>
            <li>Keep pets and children clear of the work area</li>
          </ul>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            We may decline to perform service if the site is unsafe or
            inaccessible.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            8. Limitation of liability
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444] mb-4">
            To the maximum extent permitted by Florida law, Coastal&rsquo;s
            total liability for any claim related to a service is limited to
            the amount you paid for that service. Coastal is not liable for
            indirect, incidental, or consequential damages, including lost
            time, rental costs, towing beyond the standard trip, or missed
            work. Coastal is not responsible for pre-existing mechanical issues
            or wear items that fail outside the scope of work performed.
          </p>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            Nothing in this section limits liability for gross negligence,
            willful misconduct, or anything that cannot be limited under
            Florida law.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            9. Governing law and disputes
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            These Terms are governed by the laws of the State of Florida. Any
            dispute will be resolved in the state or federal courts located in
            Hillsborough County, Florida. You and Coastal each waive any right
            to a jury trial for disputes arising from these Terms or from a
            service.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            10. End user license agreement
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            To the extent the site provides software (including the booking
            wizard, customer portal, and admin tools), Coastal grants you a
            limited, non-exclusive, non-transferable, revocable license to use
            those tools for the purpose of booking or managing services. You
            may not reverse engineer, resell, or sublicense access to these
            tools.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            11. Changes to terms
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            We may update these Terms. Material changes will be posted on the
            site with a new effective date and, where we have your contact
            info, sent by email. Continued use of the site after changes means
            you accept them.
          </p>

          <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0B2040] tracking-[-0.5px] mt-10 mb-4">
            12. Contact
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#444]">
            Coastal Mobile Lube &amp; Tire LLC
            <br />
            Apollo Beach, FL
            <br />
            813-722-5823
            <br />
            info@coastalmobilelube.com
          </p>
        </div>
      </section>
    </>
  );
}
