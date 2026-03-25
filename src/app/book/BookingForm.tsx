"use client";

import { useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

/* ─── Data ─────────────────────────────────────────────────────── */

const services = [
  { name: "Synthetic Oil Change", price: "$49" },
  { name: "Conventional Oil Change", price: "$39" },
  { name: "Tire Rotation & Balance", price: "$29" },
  { name: "Tire Sales & Installation", price: "$75" },
  { name: "Brake Pads (per axle)", price: "$199" },
  { name: "Brake Pads & Rotors", price: "$349" },
  { name: "Battery Replacement", price: "$149" },
  { name: "A/C Recharge", price: "$149" },
  { name: "Spark Plugs", price: "$89" },
  { name: "Suspension/Struts (per strut)", price: "$149" },
  { name: "Full Maintenance Package", price: "$179" },
  { name: "Coolant Flush", price: "$99" },
  { name: "Transmission Fluid Change", price: "$129" },
  { name: "Power Steering Flush", price: "$89" },
  { name: "Diagnostic Visit", price: "$49" },
  { name: "Other (describe below)", price: "Quote" },
] as const;

const timeWindows = [
  { value: "morning", label: "Morning (7–10)" },
  { value: "midday", label: "Midday (10–1)" },
  { value: "afternoon", label: "Afternoon (1–5)" },
] as const;

/* ─── Helpers ──────────────────────────────────────────────────── */

function stripPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getMaxDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split("T")[0];
}

function formatDateDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}/${y}`;
}

/* ─── Types ────────────────────────────────────────────────────── */

interface FormData {
  service: string;
  preferredDate: string;
  timeWindow: string;
  name: string;
  phone: string;
  email: string;
  contactPreference: "call" | "text" | "email";
  datesFlexible: boolean;
  address: string;
  notes: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

/* ─── Component ────────────────────────────────────────────────── */

export default function BookingForm() {
  const [formData, setFormData] = useState<FormData>({
    service: "",
    preferredDate: "",
    timeWindow: "",
    name: "",
    phone: "",
    email: "",
    contactPreference: "call",
    datesFlexible: false,
    address: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Returning customer lookup
  const [showLookup, setShowLookup] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<{
    type: "success" | "info";
    text: string;
  } | null>(null);
  const [returningCustomer, setReturningCustomer] = useState(false);

  /* ── Field update ── */
  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  /* ── Validation ── */
  function validate(): Errors {
    const errs: Errors = {};
    if (!formData.service) errs.service = "Please select a service";
    if (!formData.preferredDate) errs.preferredDate = "Please pick a date";
    if (!formData.timeWindow) errs.timeWindow = "Please choose a time window";
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.phone.trim()) {
      errs.phone = "Phone is required";
    } else if (stripPhone(formData.phone).length < 10) {
      errs.phone = "Please enter a valid phone number";
    }
    if (!formData.address.trim()) errs.address = "Address is required";
    return errs;
  }

  /* ── Customer lookup ── */
  async function handleLookup() {
    const digits = stripPhone(lookupPhone);
    if (digits.length < 10) {
      setLookupMessage({ type: "info", text: "Enter a valid phone number" });
      return;
    }
    setLookupLoading(true);
    setLookupMessage(null);
    try {
      const q = query(
        collection(db, "bookings"),
        where("phone", "==", digits)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setFormData((prev) => ({
          ...prev,
          name: data.name || prev.name,
          phone: data.phone || prev.phone,
          email: data.email || prev.email,
          address: data.address || prev.address,
        }));
        setReturningCustomer(true);
        setLookupMessage({ type: "success", text: "Welcome back!" });
      } else {
        setLookupMessage({
          type: "info",
          text: "No worries — fill out the form below and we'll get you set up",
        });
      }
    } catch {
      setLookupMessage({
        type: "info",
        text: "Couldn't look up your info right now. Please fill out the form below.",
      });
    } finally {
      setLookupLoading(false);
    }
  }

  /* ── Submit ── */
  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        service: formData.service,
        preferredDate: formData.preferredDate,
        timeWindow: formData.timeWindow,
        name: formData.name.trim(),
        phone: stripPhone(formData.phone),
        email: formData.email.trim().toLowerCase(),
        contactPreference: formData.contactPreference,
        datesFlexible: formData.datesFlexible,
        address: formData.address.trim(),
        notes: formData.notes.trim() || "",
        status: "pending",
        source: "website",
        returningCustomer,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch {
      setErrors({ service: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setFormData({
      service: "",
      preferredDate: "",
      timeWindow: "",
      name: "",
      phone: "",
      email: "",
      contactPreference: "call",
      datesFlexible: false,
      address: "",
      notes: "",
    });
    setErrors({});
    setSubmitted(false);
    setReturningCustomer(false);
    setLookupMessage(null);
    setLookupPhone("");
    setShowLookup(false);
  }

  /* ─── Input style (matches contact page) ─── */
  const inputBase =
    "w-full text-[15px] rounded-[10px] px-3.5 py-3 outline-none border-2 border-[#eee] bg-white focus:border-[#E07B2D] transition-colors";

  const labelClass =
    "block text-[12px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5";

  /* ─── Render ─────────────────────────────────────────────────── */

  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="section-inner px-4 lg:px-6 pt-10 pb-4 md:pt-14 md:pb-6">
          <div className="max-w-[700px]">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              Automotive Service
            </p>
            <h1 className="text-[28px] md:text-[34px] font-[800] leading-[1.1] text-[#0B2040] tracking-[-1px] mb-4">
              Book your service
            </h1>
            <p className="text-[16px] leading-[1.7] text-[#444] max-w-[520px]">
              Pick a service, choose a date, and we will confirm your
              appointment within 2 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-center text-[13px] text-[#888] mb-6">
            Looking for <Link href="/fleet" className="text-[#E07B2D] font-semibold hover:underline">fleet</Link> or{" "}
            <Link href="/marine" className="text-[#E07B2D] font-semibold hover:underline">marine</Link> service? Get a custom quote on those pages.
          </p>
          <div className="max-w-[700px] mx-auto">
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-6 md:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              {submitted ? (
                /* ── Confirmation ── */
                <div className="flex flex-col items-center text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center mb-5">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className="text-[28px] font-[800] text-[#0B2040] mb-3">
                    You&apos;re all set!
                  </h2>
                  <p className="text-[15px] text-[#444] max-w-[440px] mb-2 leading-relaxed">
                    We received your request for{" "}
                    <span className="font-semibold text-[#0B2040]">
                      {formData.service}
                    </span>{" "}
                    on{" "}
                    <span className="font-semibold text-[#0B2040]">
                      {formatDateDisplay(formData.preferredDate)}
                    </span>
                    .{" "}
                    {formData.contactPreference === "email" ? (
                      <>We&apos;ll email you at{" "}<span className="font-semibold text-[#0B2040]">{formData.email}</span></>
                    ) : (
                      <>We&apos;ll {formData.contactPreference === "text" ? "text" : "call"} you at{" "}<span className="font-semibold text-[#0B2040]">{(() => { const d = formData.phone.replace(/\D/g, ""); return d.length === 10 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : formData.phone; })()}</span></>
                    )}{" "}
                    within 2 hours to confirm your appointment.
                  </p>
                  <p className="text-[14px] text-[#888] mb-8">
                    Need to make changes? Call us at{" "}
                    <a
                      href="tel:8137225823"
                      className="font-semibold text-[#0B2040] hover:underline"
                    >
                      813-722-LUBE
                    </a>
                  </p>
                  <div className="flex flex-col w-full max-w-[340px] gap-3">
                    <button
                      onClick={resetForm}
                      className="w-full py-4 rounded-[10px] bg-[#E07B2D] text-white font-bold text-[16px] hover:bg-[#cc6a1f] transition-colors"
                    >
                      Book Another Service
                    </button>
                    <Link
                      href="/"
                      className="w-full py-4 rounded-[10px] border-2 border-[#0B2040] text-[#0B2040] font-bold text-[16px] text-center hover:bg-[#0B2040] hover:text-white transition-colors"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              ) : (
                /* ── Form ── */
                <div className="flex flex-col gap-6">
                  {/* Returning customer lookup */}
                  <div>
                    {!showLookup ? (
                      <p className="text-[14px] text-[#444]">
                        Been here before?{" "}
                        <button
                          type="button"
                          onClick={() => setShowLookup(true)}
                          className="text-[#E07B2D] font-semibold hover:underline"
                        >
                          Look up your info
                        </button>
                      </p>
                    ) : (
                      <div className="bg-[#FAFBFC] border border-[#e8e8e8] rounded-[10px] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[13px] font-semibold text-[#444]">
                            Find your info
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowLookup(false);
                              setLookupMessage(null);
                            }}
                            className="text-[12px] text-[#888] hover:text-[#444]"
                          >
                            Dismiss
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            placeholder="(555) 555-5555"
                            value={lookupPhone}
                            onChange={(e) => setLookupPhone(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleLookup();
                            }}
                            className={`${inputBase} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={handleLookup}
                            disabled={lookupLoading}
                            className="px-5 py-3 bg-[#0B2040] text-white text-[14px] font-semibold rounded-[10px] hover:bg-[#132E54] transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {lookupLoading ? "..." : "Find me"}
                          </button>
                        </div>
                        {lookupMessage && (
                          <p
                            className={`mt-2 text-[13px] font-medium ${
                              lookupMessage.type === "success"
                                ? "text-[#22c55e]"
                                : "text-[#444]"
                            }`}
                          >
                            {lookupMessage.text}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Field 1: Service Type */}
                  <div>
                    <label className={labelClass}>What do you need?</label>
                    {errors.service && (
                      <p className="text-[12px] text-red-500 mb-2">
                        {errors.service}
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {services.map((s) => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => updateField("service", s.name)}
                          className={`relative text-left rounded-[10px] p-3.5 border-2 transition-all duration-150 cursor-pointer ${
                            formData.service === s.name
                              ? "border-[#E07B2D] bg-[rgba(224,123,45,0.02)] border-l-[3px] border-l-[#E07B2D]"
                              : "border-[#eee] hover:border-[#E07B2D] hover:bg-[rgba(224,123,45,0.02)] hover:-translate-y-[1px]"
                          }`}
                        >
                          {formData.service === s.name && (
                            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#E07B2D] flex items-center justify-center">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </span>
                          )}
                          <span className="block text-[15px] font-semibold text-[#0B2040]">
                            {s.name}
                          </span>
                          <span className="block text-[13px] font-semibold text-[#E07B2D]">
                            {s.price === "Quote" ? "Get a quote" : `starting at ${s.price}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 2: Preferred Date */}
                  <div>
                    <label className={labelClass}>Preferred Date</label>
                    <input
                      type="date"
                      value={formData.preferredDate}
                      min={getTomorrow()}
                      max={getMaxDate()}
                      onChange={(e) =>
                        updateField("preferredDate", e.target.value)
                      }
                      className={`${inputBase} ${
                        errors.preferredDate
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    {errors.preferredDate && (
                      <p className="text-[12px] text-red-500 mt-1">
                        {errors.preferredDate}
                      </p>
                    )}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors ${formData.datesFlexible ? "bg-[#E07B2D] border-[#E07B2D]" : "border-[#ddd]"}`}>
                      {formData.datesFlexible && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </span>
                    <span className="text-[14px] text-[#888]">My dates are flexible</span>
                    <input
                      type="checkbox"
                      checked={formData.datesFlexible}
                      onChange={(e) => updateField("datesFlexible", e.target.checked)}
                      className="sr-only"
                    />
                  </label>

                  {/* Field 3: Time Window */}
                  <div>
                    <label className={labelClass}>Preferred Time</label>
                    <div className="flex gap-2">
                      {timeWindows.map((tw) => (
                        <button
                          key={tw.value}
                          type="button"
                          onClick={() => updateField("timeWindow", tw.value)}
                          className={`flex-1 py-3 rounded-[10px] text-[14px] font-semibold border-2 transition-all cursor-pointer ${
                            formData.timeWindow === tw.value
                              ? "bg-[#E07B2D] text-white border-[#E07B2D]"
                              : "border-[#eee] text-[#444] hover:border-[#ddd]"
                          }`}
                        >
                          {tw.label}
                        </button>
                      ))}
                    </div>
                    {errors.timeWindow && (
                      <p className="text-[12px] text-red-500 mt-1">
                        {errors.timeWindow}
                      </p>
                    )}
                  </div>

                  {/* Field 4: Name */}
                  <div>
                    <label className={labelClass}>Your Name</label>
                    <input
                      type="text"
                      placeholder="First and last name"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={`${inputBase} ${
                        errors.name ? "border-red-500" : ""
                      }`}
                    />
                    {errors.name && (
                      <p className="text-[12px] text-red-500 mt-1">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Field 5: Phone */}
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      type="tel"
                      placeholder="(555) 555-5555"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className={`${inputBase} ${
                        errors.phone ? "border-red-500" : ""
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-[12px] text-red-500 mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Field 6: Email */}
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={inputBase}
                    />
                  </div>

                  {/* Field 7: Contact Preference */}
                  <div>
                    <label className={labelClass}>Best way to reach you</label>
                    <div className="flex gap-2">
                      {(["call", "text", "email"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => updateField("contactPreference", method)}
                          className={`flex-1 py-3 rounded-[10px] text-[14px] font-semibold border-2 transition-all cursor-pointer ${
                            formData.contactPreference === method
                              ? "bg-[#E07B2D] text-white border-[#E07B2D]"
                              : "border-[#eee] text-[#444] hover:border-[#ddd]"
                          }`}
                        >
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 8: Address */}
                  <div>
                    <label className={labelClass}>Service Address</label>
                    <input
                      type="text"
                      placeholder="Street address, city, ZIP"
                      value={formData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      className={`${inputBase} ${
                        errors.address ? "border-red-500" : ""
                      }`}
                    />
                    {errors.address && (
                      <p className="text-[12px] text-red-500 mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Field 7: Notes */}
                  <div>
                    <label className={labelClass}>
                      Anything else we should know?
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Vehicle details, gate codes, special requests..."
                      value={formData.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      className={`${inputBase} resize-y`}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 rounded-[10px] bg-[#E07B2D] text-white font-bold text-[16px] hover:bg-[#cc6a1f] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(224,123,45,0.35)] transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      "Request Appointment"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it works + What's included */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="max-w-[700px] mx-auto">
            <h3 className="text-[20px] font-bold text-[#0B2040] mb-6 text-center">
              How it works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { num: "1", title: "You request", desc: "Pick your service and preferred time" },
                { num: "2", title: "We confirm", desc: "Our team confirms within 2 hours" },
                { num: "3", title: "We show up", desc: "Fully equipped service van at your door" },
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-[#0B2040] flex items-center justify-center mb-3">
                    <span className="text-[14px] font-bold text-white">{step.num}</span>
                  </div>
                  <p className="text-[15px] font-semibold text-[#0B2040] mb-1">{step.title}</p>
                  <p className="text-[13px] text-[#444]">{step.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-[20px] font-bold text-[#0B2040] mb-5 text-center">
              What&apos;s included
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "Factory-grade parts and fluids",
                "Certified master technicians",
                "12-month service warranty",
                "No hidden fees, ever",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-[14px] text-[#444]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
