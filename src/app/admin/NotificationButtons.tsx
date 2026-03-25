"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

function formatPhoneDisplay(phone?: string): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length === 10)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

const SEND_EMAIL_URL = "https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendConfirmationEmail";

interface BookingData {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  contactPreference?: string;
  service?: string;
  serviceCategory?: string;
  source?: string;
  status?: string;
  address?: string;
  preferredDate?: string;
  timeWindow?: string;
  notes?: string;
}

export default function NotificationButtons({
  bookingId,
  booking,
  phone,
  email,
  onToast,
}: {
  bookingId: string;
  booking: BookingData;
  phone?: string;
  email?: string;
  onToast: (message: string, type?: "success" | "info") => void;
}) {
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [confirmText, setConfirmText] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  async function logComms(
    type: "call" | "text" | "email" | "note",
    summary: string
  ) {
    const entry = {
      id: crypto.randomUUID(),
      type,
      direction: "outbound" as const,
      summary,
      createdAt: new Date().toISOString(),
      createdBy: "admin",
    };
    await updateDoc(doc(db, "bookings", bookingId), {
      commsLog: arrayUnion(entry),
    });
  }

  async function handleEmailConfirmation() {
    setSendingEmail(true);
    try {
      const response = await fetch(SEND_EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking, bookingId }),
      });
      const data = (await response.json()) as { success: boolean; error?: string };
      if (data.success) {
        await logComms("email", `Confirmation email sent to ${email}`);
        onToast(`Confirmation email sent to ${email}`, "success");
      } else {
        onToast(`Failed to send email: ${data.error || "Unknown error"}`, "info");
      }
    } catch {
      onToast("Error sending email", "info");
    }
    setSendingEmail(false);
    setConfirmEmail(false);
  }

  async function handleTextConfirmation() {
    try {
      await logComms(
        "text",
        `Confirmation text sent to ${formatPhoneDisplay(phone)}`
      );
      onToast("Text logged. (SMS delivery coming soon)");
    } catch {
      /* silent */
    }
    setConfirmText(false);
  }

  async function handleCall() {
    try {
      await logComms("call", `Initiated call to ${formatPhoneDisplay(phone)}`);
    } catch {
      /* silent */
    }
  }

  return (
    <>
      <div className="mb-5">
        <p className="text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-2">
          Send Notification
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => (email ? setConfirmEmail(true) : undefined)}
            disabled={!email}
            title={!email ? "No email on file" : undefined}
            className="flex items-center justify-center gap-2 py-3 rounded-[8px] text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#1A5FAC] text-white hover:bg-[#164d8a]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polyline points="22,7 12,13 2,7" />
            </svg>
            Send Confirmation Email
          </button>
          <button
            onClick={() => (phone ? setConfirmText(true) : undefined)}
            disabled={!phone}
            title={!phone ? "No phone on file" : undefined}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-[8px] text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#16a34a] text-white hover:bg-[#15803d]"
          >
            <span className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Send Confirmation Text
            </span>
            <span className="text-[10px] font-normal opacity-75">(Coming soon)</span>
          </button>
          <a
            href={phone ? `tel:${phone}` : undefined}
            onClick={phone ? handleCall : undefined}
            className={`flex items-center justify-center gap-2 py-3 rounded-[8px] text-[13px] font-semibold transition-colors ${
              phone
                ? "bg-[#E07B2D] text-white hover:bg-[#cc6a1f] cursor-pointer"
                : "bg-[#E07B2D] text-white opacity-40 cursor-not-allowed"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call Customer
          </a>
        </div>
      </div>

      {/* Email confirmation modal */}
      {confirmEmail && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setConfirmEmail(false)}
        >
          <div
            className="bg-white rounded-[12px] p-6 max-w-[400px] w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-[16px] font-bold text-[#0B2040] mb-2">
              Send Confirmation Email
            </h4>
            <p className="text-[14px] text-[#444] mb-4">
              Send confirmation email to <strong>{email}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmEmail(false)}
                className="px-4 py-2 text-[13px] font-semibold text-[#444] border border-[#ddd] rounded-md hover:bg-[#f5f5f5]"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailConfirmation}
                disabled={sendingEmail}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-[#1A5FAC] rounded-md hover:bg-[#164d8a] disabled:opacity-50"
              >
                {sendingEmail ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text confirmation modal */}
      {confirmText && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setConfirmText(false)}
        >
          <div
            className="bg-white rounded-[12px] p-6 max-w-[400px] w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-[16px] font-bold text-[#0B2040] mb-2">
              Send Confirmation Text
            </h4>
            <p className="text-[14px] text-[#444] mb-4">
              Send confirmation text to{" "}
              <strong>{formatPhoneDisplay(phone)}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmText(false)}
                className="px-4 py-2 text-[13px] font-semibold text-[#444] border border-[#ddd] rounded-md hover:bg-[#f5f5f5]"
              >
                Cancel
              </button>
              <button
                onClick={handleTextConfirmation}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-[#16a34a] rounded-md hover:bg-[#15803d]"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
