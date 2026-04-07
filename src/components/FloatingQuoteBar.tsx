"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X, ChevronUp } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useBooking } from "@/contexts/BookingContext";

const serviceOptions = [
  "Auto Service",
  "Marine Service",
  "RV / Trailer Service",
  "Fleet Inquiry",
];

type ContactPref = "call" | "text" | "email";

function formatPhoneDisplay(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function FloatingQuoteBar() {
  const pathname = usePathname();
  const { bookingOpen } = useBooking();
  const [collapsed, setCollapsed] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [contactPref, setContactPref] = useState<ContactPref>("call");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (bookingOpen || pathname.startsWith("/admin")) return null;

  /* Hide entirely on mobile — the sticky bottom bar handles CTAs below 768px */
  const hiddenOnMobile = "hidden lg:block";

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        name: name.trim(),
        phone: phone.replace(/\D/g, ""),
        email: email.trim(),
        service: service,
        serviceCategory: service,
        contactPreference: contactPref,
        source: "floating-quick-quote",
        type: "lead",
        status: "new-lead",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setMessage({ type: "success", text: "Got it! We'll reach out shortly." });
      setTimeout(() => {
        setMessage(null);
        setName("");
        setPhone("");
        setEmail("");
        setService("");
        setContactPref("call");
      }, 3000);
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please call 813-722-LUBE." });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Collapsed pill ── */
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className={`fixed bottom-[80px] lg:bottom-6 right-4 lg:right-6 z-50 items-center gap-2 px-5 py-3 rounded-full bg-[#E07B2D] text-white font-semibold text-[14px] shadow-[0_4px_20px_rgba(224,123,45,0.4)] hover:bg-[#CC6A1F] transition-colors ${hiddenOnMobile} lg:!flex`}
      >
        <ChevronUp size={16} />
        Get a Quote
      </button>
    );
  }

  const labelClass = "block text-[11px] uppercase tracking-[0.5px] text-[#475569] mb-1 font-semibold";
  const inputClass =
    "w-full bg-white text-[#1e293b] text-[14px] placeholder:text-[#94a3b8] border border-[#E2E8F0] focus:border-[#E07B2D] outline-none px-3 py-[10px] rounded-lg transition-colors";

  return (
    <div className={`fixed z-50 bottom-[80px] lg:bottom-6 right-4 lg:right-6 w-[380px] max-[480px]:left-4 max-[480px]:w-auto ${hiddenOnMobile}`}>
      <div
        className="relative rounded-[16px] p-5"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setCollapsed(true)}
          className="absolute top-3 right-3 text-[#94a3b8] hover:text-[#475569] transition-colors"
          aria-label="Minimize quote bar"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="mb-4 pr-6">
          <p className="text-[16px] font-bold text-[#0B2447]">Get a Quick Quote</p>
          <p className="text-[13px] text-[#64748B]">We&apos;ll get back to you within the hour.</p>
        </div>

        {message ? (
          <p className={`text-center text-[15px] font-semibold py-2 ${message.type === "success" ? "text-[#22c55e]" : "text-red-500"}`}>
            {message.text}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>Name</label>
              <input type="text" placeholder="Your name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" placeholder="(555) 555-5555" className={inputClass} value={phone} onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" placeholder="Email address" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Service</label>
              <div className="relative">
                <select
                  className="w-full bg-white text-[#1e293b] text-[14px] border border-[#E2E8F0] focus:border-[#E07B2D] outline-none px-3 py-[10px] rounded-lg appearance-none pr-8 transition-colors"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="">What do you need?</option>
                  {serviceOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#94a3b8]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>
            <div>
              <label className={labelClass}>Preferred Contact</label>
              <div className="flex gap-2 mt-1">
                {(["call", "text", "email"] as ContactPref[]).map((pref) => (
                  <button
                    key={pref}
                    onClick={() => setContactPref(pref)}
                    className={`text-[12px] font-semibold px-4 py-[7px] rounded-full capitalize transition-all ${
                      contactPref === pref
                        ? "bg-[#E07B2D] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full font-bold text-white text-[15px] rounded-lg px-6 py-3 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors disabled:opacity-50 shadow-[0_4px_16px_rgba(224,123,45,0.3)] mt-1"
            >
              {submitting ? "Sending..." : "Get My Quote"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
