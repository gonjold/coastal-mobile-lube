"use client";

import { useState } from "react";
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

export default function FloatingQuoteBar() {
  const { bookingOpen } = useBooking();
  const [collapsed, setCollapsed] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [contactPref, setContactPref] = useState<ContactPref>("call");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (bookingOpen) return null;

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        customerName: name.trim(),
        customerPhone: phone.replace(/\D/g, ""),
        customerEmail: email.trim(),
        serviceCategory: service,
        contactPreference: contactPref,
        source: "floating-quick-quote",
        status: "new",
        createdAt: serverTimestamp(),
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
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-[#E07B2D] text-white font-semibold text-[14px] shadow-[0_4px_20px_rgba(224,123,45,0.4)] hover:bg-[#CC6A1F] transition-colors"
      >
        <ChevronUp size={16} />
        Get a Quote
      </button>
    );
  }

  const labelClass = "block text-[10px] uppercase tracking-[1.5px] text-white/60 mb-1 font-semibold";
  const inputClass =
    "w-full bg-transparent text-white text-[14px] placeholder:text-white/50 border-b border-white/20 focus:border-[#E07B2D] outline-none py-2 transition-colors";

  return (
    <div
      className="fixed z-50 bottom-4 left-4 right-4 md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[calc(100%-48px)] md:max-w-[900px]"
    >
      <div
        className="relative rounded-[16px] px-5 py-5 md:px-6 md:py-4"
        style={{
          background: "rgba(11, 36, 71, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setCollapsed(true)}
          className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
          aria-label="Minimize quote bar"
        >
          <X size={16} />
        </button>

        {message ? (
          <p className={`text-center text-[15px] font-semibold py-2 ${message.type === "success" ? "text-[#22c55e]" : "text-red-400"}`}>
            {message.text}
          </p>
        ) : (
          <>
            {/* ── Desktop: single row ── */}
            <div className="hidden md:flex items-end gap-3">
              <div className="flex-1 min-w-0">
                <label className={labelClass}>Name</label>
                <input type="text" placeholder="Your name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex-1 min-w-0">
                <label className={labelClass}>Phone</label>
                <input type="tel" placeholder="Phone number" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="flex-1 min-w-0">
                <label className={labelClass}>Email</label>
                <input type="email" placeholder="Email address" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex-1 min-w-0">
                <label className={labelClass}>Service</label>
                <div className="relative">
                  <select
                    className="w-full bg-transparent text-white text-[14px] border-b border-white/20 focus:border-[#E07B2D] outline-none py-2 appearance-none pr-6 transition-colors"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                  >
                    <option value="" className="text-[#333]">What do you need?</option>
                    {serviceOptions.map((s) => (
                      <option key={s} value={s} className="text-[#333]">{s}</option>
                    ))}
                  </select>
                  <svg className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-white/40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </div>
              <div className="shrink-0">
                <label className={labelClass}>Contact</label>
                <div className="flex gap-1">
                  {(["call", "text", "email"] as ContactPref[]).map((pref) => (
                    <button
                      key={pref}
                      onClick={() => setContactPref(pref)}
                      className={`text-[12px] font-semibold px-3 py-[7px] rounded-full capitalize transition-all ${
                        contactPref === pref
                          ? "bg-[#E07B2D] text-white"
                          : "bg-transparent text-white border border-white/30 hover:border-white/50"
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
                className="shrink-0 whitespace-nowrap font-bold text-white text-[14px] rounded-full px-6 py-[10px] bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors disabled:opacity-50 shadow-[0_4px_16px_rgba(224,123,45,0.3)]"
              >
                {submitting ? "Sending..." : "Get My Quote"}
              </button>
            </div>

            {/* ── Mobile: stacked ── */}
            <div className="md:hidden space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Name</label>
                  <input type="text" placeholder="Your name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input type="tel" placeholder="Phone number" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" placeholder="Email address" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Service</label>
                <div className="relative">
                  <select
                    className="w-full bg-transparent text-white text-[14px] border-b border-white/20 focus:border-[#E07B2D] outline-none py-2 appearance-none pr-6 transition-colors"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                  >
                    <option value="" className="text-[#333]">What do you need?</option>
                    {serviceOptions.map((s) => (
                      <option key={s} value={s} className="text-[#333]">{s}</option>
                    ))}
                  </select>
                  <svg className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-white/40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
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
                          : "bg-transparent text-white border border-white/30 hover:border-white/50"
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
                className="w-full font-bold text-white text-[14px] rounded-full px-6 py-3 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors disabled:opacity-50 shadow-[0_4px_16px_rgba(224,123,45,0.3)]"
              >
                {submitting ? "Sending..." : "Get My Quote"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
