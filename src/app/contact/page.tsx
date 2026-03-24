"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react";

const inputClasses =
  "w-full text-sm rounded-[10px] px-3 py-2.5 outline-none border-2 border-[#eee] bg-[#fafafa] focus:border-[#1A5FAC] transition-colors";

const interestOptions = [
  "General inquiry",
  "Automotive service quote",
  "Fleet & commercial services",
  "Marine service quote",
  "Partnership or business opportunity",
  "Other",
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(
          new FormData(form) as unknown as Record<string, string>
        ).toString(),
      });
      setSubmitted(true);
    } catch {
      // Allow default form behavior as fallback
      form.submit();
    }
  }

  return (
    <>
      {/* Page Hero */}
      <section className="bg-white">
        <div className="section-inner px-4 lg:px-6 pt-10 pb-4 md:pt-14 md:pb-6">
          <div className="max-w-[700px]">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              Contact
            </p>
            <h1 className="text-[30px] md:text-[42px] font-extrabold leading-[1.1] text-[#0B2040] tracking-[-1px] mb-4">
              Get in touch
            </h1>
            <p className="text-[16px] leading-[1.7] text-[#444] max-w-[520px]">
              Have a question or want to learn more about our services? We respond within one business day. For service bookings, use our{" "}
              <Link href="/book" className="text-[#E07B2D] font-semibold hover:underline">Book Service</Link> page. For fleet or marine quotes, visit{" "}
              <Link href="/fleet" className="text-[#E07B2D] font-semibold hover:underline">Fleet</Link> or{" "}
              <Link href="/marine" className="text-[#E07B2D] font-semibold hover:underline">Marine</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Form + Contact Info */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12 max-w-[1100px] mx-auto">
            {/* Left Column: Form */}
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-6 md:p-8">
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <CheckCircle size={48} color="#2d7a2d" className="mb-5" />
                  <h2 className="text-[24px] font-bold text-[#0B2040] mb-3">
                    Message sent.
                  </h2>
                  <p className="text-[15px] text-[#444] max-w-[360px] mb-6">
                    We will get back to you within one business day. For
                    immediate help, call{" "}
                    <a
                      href="tel:8137225823"
                      className="font-semibold text-[#0B2040]"
                    >
                      813-722-LUBE
                    </a>
                    .
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-[14px] font-semibold text-[#1A5FAC] hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form
                  name="contact"
                  method="POST"
                  data-netlify="true"
                  onSubmit={handleSubmit}
                >
                  <input
                    type="hidden"
                    name="form-name"
                    value="contact"
                  />

                  <div className="flex flex-col gap-5">
                    {/* Row 1: Name + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          placeholder="Your name"
                          required
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="(555) 555-5555"
                          required
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    {/* Row 2: Email */}
                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="you@email.com"
                        required
                        className={inputClasses}
                      />
                    </div>

                    {/* Row 3: Interest */}
                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
                        I am interested in
                      </label>
                      <select name="interest" className={inputClasses}>
                        {interestOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Row 4: Message */}
                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
                        Message
                      </label>
                      <textarea
                        name="message"
                        placeholder="Tell us how we can help. Include vehicle details, fleet size, or any questions."
                        required
                        className={`${inputClasses} resize-none`}
                        style={{ minHeight: 120 }}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full font-semibold text-white rounded-[var(--radius-button)] py-3.5 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors"
                    >
                      Send Message
                    </button>

                    <p className="text-center text-[12px] text-[#888]">
                      We respond to every message within one business day.
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: Contact Info */}
            <div>
              {/* Call or text */}
              <div className="py-6 border-b border-[#eee]">
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={18} className="text-[#E07B2D]" />
                  <span className="text-[13px] font-semibold text-[#888] uppercase tracking-wide">
                    Call or text
                  </span>
                </div>
                <a
                  href="tel:8137225823"
                  className="text-[24px] font-bold text-[#E07B2D] hover:underline"
                >
                  813-722-LUBE
                </a>
                <p className="text-[13px] text-[#888] mt-1">
                  Available Monday through Saturday
                </p>
              </div>

              {/* Email */}
              <div className="py-6 border-b border-[#eee]">
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={18} className="text-[#1A5FAC]" />
                  <span className="text-[13px] font-semibold text-[#888] uppercase tracking-wide">
                    Email
                  </span>
                </div>
                <a
                  href="mailto:info@coastalmobilelube.com"
                  className="text-[15px] font-semibold text-[#0B2040] hover:underline"
                >
                  info@coastalmobilelube.com
                </a>
                <p className="text-[13px] text-[#888] mt-1">
                  We respond within one business day
                </p>
              </div>

              {/* Service area */}
              <div className="py-6 border-b border-[#eee]">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-[#1A5FAC]" />
                  <span className="text-[13px] font-semibold text-[#888] uppercase tracking-wide">
                    Service area
                  </span>
                </div>
                <p className="text-[15px] font-semibold text-[#0B2040]">
                  Tampa and surrounding Hillsborough County
                </p>
                <p className="text-[13px] text-[#888] mt-1">
                  Tampa, Brandon, Riverview, Wesley Chapel, Plant City, Temple
                  Terrace, Lutz, Land O&apos; Lakes
                </p>
              </div>

              {/* Business hours */}
              <div className="py-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={18} className="text-[#1A5FAC]" />
                  <span className="text-[13px] font-semibold text-[#888] uppercase tracking-wide">
                    Business hours
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    { day: "Monday - Friday", hours: "7:00 AM - 6:00 PM" },
                    { day: "Saturday", hours: "8:00 AM - 4:00 PM" },
                    { day: "Sunday", hours: "Closed" },
                  ].map((row) => (
                    <div
                      key={row.day}
                      className="flex justify-between text-[14px]"
                    >
                      <span className="font-semibold text-[#0B2040]">
                        {row.day}
                      </span>
                      <span className="text-[#444]">{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0B2040]">
        <div className="section-inner px-4 lg:px-6 py-10 text-center">
          <h2 className="text-[24px] font-extrabold text-white mb-2">
            Prefer to book directly?
          </h2>
          <p className="text-[14px] text-white/70 mb-6">
            Skip the form and schedule your service now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/book"
              className="inline-flex items-center justify-center px-[30px] py-[14px] font-semibold text-white rounded-[var(--radius-button)] bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors"
            >
              Book Service
            </Link>
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-white bg-transparent border-2 border-white/40 rounded-[var(--radius-button)] hover:border-white/70 transition-all"
            >
              <Phone size={16} />
              Call 813-722-LUBE
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
