"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

type ContactPref = "call" | "text" | "email";

export default function QuoteModal({ isOpen, onClose }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [contactPref, setContactPref] = useState<ContactPref>("call");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !phone.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "quickQuotes"), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.replace(/\D/g, ""),
        email: email.trim(),
        city: city.trim(),
        service,
        contactPreference: contactPref,
        source: "quote-modal",
        createdAt: serverTimestamp(),
      });
      setMsg({ type: "success", text: "Got it! We'll be in touch soon." });
      setTimeout(() => {
        setMsg(null);
        onClose();
        setFirstName(""); setLastName(""); setPhone(""); setEmail(""); setCity(""); setService(""); setContactPref("call");
      }, 2500);
    } catch {
      setMsg({ type: "error", text: "Something went wrong. Call 813-722-LUBE." });
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full bg-[#F7F8FA] border border-[#E8E8E8] rounded-[10px] text-[15px] p-[12px_14px] outline-none focus:border-[#E07B2D] transition-colors";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-[#0B2040]/65 backdrop-blur-[4px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-[51] top-1/2 left-1/2 w-[calc(100%-32px)] md:w-[440px] bg-white rounded-[20px] shadow-[0_24px_80px_rgba(0,0,0,0.3)] p-[28px_20px_32px] md:p-[36px_32px] max-h-[calc(100vh-80px)] overflow-y-auto"
        style={{
          animation: "quoteModalIn 0.25s ease-out forwards",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#F7F8FA] rounded-full w-8 h-8 flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-[22px]">
          <h3 className="text-[#0B2040] text-[22px] font-extrabold">Connect with us</h3>
          <p className="text-[#7A7A7A] text-[14px] leading-[1.4] mt-1">Tell us what you need. We get back to you fast.</p>
        </div>

        {msg ? (
          <p className={`text-center text-[16px] font-semibold py-8 ${msg.type === "success" ? "text-emerald-500" : "text-red-500"}`}>{msg.text}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
            <div className="flex gap-[10px]">
              <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
              <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </div>
            <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className={inputClass} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
            <div className="relative">
              <select value={service} onChange={(e) => setService(e.target.value)} className={`${inputClass} appearance-none pr-8`}>
                <option value="">Service needed</option>
                {["Oil change", "Tires", "Brakes", "Marine service", "RV service", "Fleet service", "Other"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#999]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
            {/* Contact preference */}
            <div>
              <p className="text-[13px] text-[#555] font-semibold mb-2">Reach me by:</p>
              <div className="flex justify-center gap-3">
                {(["call", "text", "email"] as ContactPref[]).map((pref) => (
                  <label key={pref} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="contactPref"
                      checked={contactPref === pref}
                      onChange={() => setContactPref(pref)}
                      className="accent-[#E07B2D]"
                    />
                    <span className="text-[14px] capitalize text-[#333]">{pref}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-[#E07B2D] text-white rounded-[10px] py-[14px] font-semibold mt-1 shadow-[0_2px_12px_rgba(224,123,45,0.3)] disabled:opacity-50">
              {submitting ? "Sending..." : "Send Quote Request"}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes quoteModalIn {
          from { opacity: 0; transform: translate(-50%, -48%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
