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

const serviceCategories = [
  {
    label: "OIL CHANGES",
    services: [
      { name: "Syn Blend Oil Change", price: "$89.95" },
      { name: "Full Synthetic Oil Change", price: "$119.95" },
      { name: "Diesel Oil Change", price: "$219.95" },
    ],
  },
  {
    label: "BUNDLES",
    services: [
      { name: "Basic Bundle", price: "$119.95" },
      { name: "Better Bundle", price: "$209.95" },
      { name: "Best Bundle", price: "$309.95" },
    ],
  },
  {
    label: "TIRES",
    services: [
      { name: "Tire Rotation", price: "$39.95" },
      { name: "Mount & Balance (4 Tires)", price: "$159.95" },
    ],
  },
  {
    label: "BRAKES",
    services: [
      { name: "Front + Rear Brakes", price: "$320" },
    ],
  },
  {
    label: "MAINTENANCE",
    services: [
      { name: "Cabin Air Filter", price: "$99.95" },
      { name: "Battery Replacement", price: "From $50" },
      { name: "HVAC Recharge", price: "$299.99" },
    ],
  },
  {
    label: "FLUIDS",
    services: [
      { name: "Brake Flush", price: "$239.95" },
      { name: "Coolant Flush", price: "$269.95" },
      { name: "Transmission Flush", price: "$419.95" },
    ],
  },
  {
    label: "OTHER",
    services: [
      { name: "Wiper Blades", price: "$19" },
      { name: "Other (describe below)", price: "Quote" },
    ],
  },
];

const timeWindows = [
  { value: "early-morning", label: "Early Morning (8-10)" },
  { value: "morning", label: "Morning (10-12)" },
  { value: "midday", label: "Midday (12-2)" },
  { value: "afternoon", label: "Afternoon (2-4)" },
  { value: "late-afternoon", label: "Late Afternoon (3-5)" },
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
  services: string[];
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
    services: [],
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

  function toggleService(serviceName: string) {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceName)
        ? prev.services.filter((s) => s !== serviceName)
        : [...prev.services, serviceName],
    }));
    if (errors.services) setErrors((prev) => ({ ...prev, services: undefined }));
  }

  /* ── Validation ── */
  function validate(): Errors {
    const errs: Errors = {};
    if (formData.services.length === 0) errs.services = "Please select at least one service";
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
          text: "No worries, fill out the form below and we will get you set up.",
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
        services: formData.services,
        service: formData.services.join(", "),
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
      setErrors({ services: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setFormData({
      services: [],
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
    "w-full text-[15px] rounded-[10px] px-3.5 py-3 outline-none border border-[#0B2040]/10 bg-white/60 backdrop-blur-sm focus:border-[#E07B2D] focus:bg-white/80 transition-all placeholder:text-[#888]/60";

  const labelClass =
    "block text-[12px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5";

  /* ─── Render ─────────────────────────────────────────────────── */

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#07192F] via-[#0B2040] to-[#0F2A52] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(107,163,224,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(224,123,45,0.05),transparent_50%)]" />
        <div className="relative section-inner px-4 lg:px-6 pt-12 pb-6 md:pt-16 md:pb-8">
          <div className="max-w-[700px]">
            <p className="text-[13px] uppercase font-bold text-[#6BA3E0] tracking-[1.5px] mb-3">
              Automotive Service
            </p>
            <h1 className="text-[28px] md:text-[34px] font-[800] leading-[1.1] text-white tracking-[-1px] mb-4">
              Book your service
            </h1>
            <p className="text-[16px] leading-[1.7] text-white/60 max-w-[700px]">
              Pick a service, choose a date, and we will confirm your
              appointment within 2 hours. Or call{" "}
              <a href="tel:8137225823" className="text-[#E07B2D] font-semibold hover:underline">813-722-LUBE</a>.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-gradient-to-b from-[#0F2A52] via-[#F0F2F5] to-[#F5F7FA]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-center text-[13px] text-white/50 mb-6">
            Looking for <Link href="/fleet" className="text-[#E07B2D] font-semibold hover:underline">fleet</Link> or{" "}
            <Link href="/marine" className="text-[#E07B2D] font-semibold hover:underline">marine</Link> service? Get a custom quote on those pages.
          </p>
          <div className="max-w-[700px] mx-auto">
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[16px] p-6 md:p-8 shadow-[0_8px_32px_rgba(11,32,64,0.10)]">
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
                      {formData.services.join(", ")}
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
                      <div className="bg-white/40 backdrop-blur-sm border border-[#0B2040]/8 rounded-[10px] p-4">
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

                  {/* Field 1: Service Type (multi-select, grouped) */}
                  <div>
                    <label className={labelClass}>What do you need?</label>
                    {errors.services && (
                      <p className="text-[12px] text-red-500 mb-2">
                        {errors.services}
                      </p>
                    )}
                    <div className="flex flex-col gap-5">
                      {serviceCategories.map((cat) => (
                        <div key={cat.label}>
                          <p className="text-[11px] uppercase font-bold text-[#0B2040]/40 tracking-[1.5px] mb-2">
                            {cat.label}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {cat.services.map((s) => {
                              const selected = formData.services.includes(s.name);
                              return (
                                <button
                                  key={s.name}
                                  type="button"
                                  onClick={() => toggleService(s.name)}
                                  className={`relative text-left rounded-[10px] p-3 border-2 transition-all duration-150 cursor-pointer ${
                                    selected
                                      ? "border-[#E07B2D] bg-[#E07B2D]/5 shadow-[0_0_0_1px_rgba(224,123,45,0.2)]"
                                      : "border-[#0B2040]/8 bg-white/50 hover:border-[#E07B2D]/40 hover:bg-white/70 hover:-translate-y-[1px]"
                                  }`}
                                >
                                  {selected && (
                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#E07B2D] flex items-center justify-center">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    </span>
                                  )}
                                  <span className="block text-[14px] font-semibold text-[#0B2040]">
                                    {s.name}
                                  </span>
                                  <span className="block text-[13px] font-semibold text-[#E07B2D]">
                                    {s.price === "Quote" ? "Get a quote" : s.price}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
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
                    <div className="flex flex-wrap gap-2">
                      {timeWindows.map((tw) => (
                        <button
                          key={tw.value}
                          type="button"
                          onClick={() => updateField("timeWindow", tw.value)}
                          className={`px-4 py-3 rounded-[10px] text-[13px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                            formData.timeWindow === tw.value
                              ? "bg-[#E07B2D] text-white border-[#E07B2D] shadow-[0_2px_8px_rgba(224,123,45,0.3)]"
                              : "border-[#0B2040]/10 bg-white/50 text-[#444] hover:border-[#E07B2D]/40"
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
                          className={`flex-1 py-3 rounded-[10px] text-[14px] font-semibold border transition-all cursor-pointer ${
                            formData.contactPreference === method
                              ? "bg-[#E07B2D] text-white border-[#E07B2D] shadow-[0_2px_8px_rgba(224,123,45,0.3)]"
                              : "border-[#0B2040]/10 bg-white/50 text-[#444] hover:border-[#E07B2D]/40"
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
      <section className="bg-gradient-to-b from-[#F5F7FA] to-[#0B2040]">
        <div className="section-inner px-4 lg:px-6 py-12 md:py-16">
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
                  <div className="w-10 h-10 rounded-full bg-[#0B2040] flex items-center justify-center mb-3 shadow-[0_2px_8px_rgba(11,32,64,0.2)]">
                    <span className="text-[14px] font-bold text-white">{step.num}</span>
                  </div>
                  <p className="text-[15px] font-semibold text-[#0B2040] mb-1">{step.title}</p>
                  <p className="text-[13px] text-[#444]">{step.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-[20px] font-bold text-white mb-5 text-center">
              What&apos;s included
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "Factory-grade parts and fluids",
                "ASE-certified technicians",
                "12-month service warranty",
                "No hidden fees, ever",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E07B2D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-[14px] text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
