"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
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

export default function MobileQuickQuote() {
  const pathname = usePathname();
  const { bookingOpen } = useBooking();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [contactPref, setContactPref] = useState<ContactPref>("call");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (bookingOpen || pathname.startsWith("/admin")) return null;

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
        source: "mobile-quick-quote",
        status: "new",
        createdAt: serverTimestamp(),
      });
      setMessage({ type: "success", text: "Got it! We'll reach out shortly." });
      setTimeout(() => {
        setMessage(null);
        setOpen(false);
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

  const labelClass = "block text-[11px] uppercase tracking-[0.5px] text-[#475569] mb-1 font-semibold";
  const inputClass =
    "w-full bg-white text-[#1e293b] text-[14px] placeholder:text-[#94a3b8] border border-[#E2E8F0] focus:border-[#F97316] outline-none px-3 py-[10px] rounded-lg transition-colors";

  return (
    <div className="block lg:hidden">
      {/* Tab pinned to right edge */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-40"
          style={{
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 36,
            height: 120,
            background: "#F97316",
            color: "#fff",
            border: "none",
            borderRadius: "8px 0 0 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "-2px 0 8px rgba(0,0,0,0.15)",
          }}
          aria-label="Open quick quote"
        >
          <span
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
            }}
          >
            Quick Quote
          </span>
        </button>
      )}

      {/* Overlay + Panel */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() => setOpen(false)}
          />

          {/* Slide-in panel */}
          <div
            className="absolute top-0 right-0 h-full bg-white flex flex-col"
            style={{
              width: "min(300px, 85vw)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              animation: "slideInRight 0.25s ease-out",
            }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#E2E8F0]" style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
              <div>
                <p className="text-[18px] font-bold text-[#0B2447]">Quick Quote</p>
                <p className="text-[13px] text-[#64748B]">We&apos;ll get back to you within the hour.</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[#94a3b8] hover:text-[#475569] transition-colors flex-shrink-0"
                aria-label="Close quick quote"
              >
                <X size={20} />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {message ? (
                <p className={`text-center text-[15px] font-semibold py-8 ${message.type === "success" ? "text-[#22c55e]" : "text-red-500"}`}>
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
                    <input type="tel" placeholder="Phone number" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" placeholder="Email address" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Service</label>
                    <div className="relative">
                      <select
                        className="w-full bg-white text-[#1e293b] text-[14px] border border-[#E2E8F0] focus:border-[#F97316] outline-none px-3 py-[10px] rounded-lg appearance-none pr-8 transition-colors"
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
                          type="button"
                          onClick={() => setContactPref(pref)}
                          className={`text-[12px] font-semibold px-4 py-[7px] rounded-full capitalize transition-all ${
                            contactPref === pref
                              ? "bg-[#F97316] text-white"
                              : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                          }`}
                        >
                          {pref}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full font-bold text-white text-[15px] rounded-lg px-6 py-3 bg-[#F97316] hover:bg-[#EA680C] transition-colors disabled:opacity-50 shadow-[0_4px_16px_rgba(249,115,22,0.3)] mt-1"
                  >
                    {submitting ? "Sending..." : "Get My Quote"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
