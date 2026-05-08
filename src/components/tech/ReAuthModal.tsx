"use client";

import { useRef, useState } from "react";
import {
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import SignaturePad, { SignaturePadHandle } from "./SignaturePad";

type Method = "in_person_signature" | "phone";

interface Props {
  bookingId: string;
  customerName: string;
  consentChoice:
    | "simple_under_150"
    | "authorize_up_to"
    | "contact_above"
    | "no_contact";
  threshold: number;
  pendingNewTotal: number;
  pendingLineDescription: string;
  onConfirm: (event: {
    method: Method;
    signatureUrl?: string;
    note?: string;
  }) => void | Promise<void>;
  onCancel: () => void;
}

export default function ReAuthModal({
  bookingId,
  customerName,
  consentChoice,
  threshold,
  pendingNewTotal,
  pendingLineDescription,
  onConfirm,
  onCancel,
}: Props) {
  const phoneAllowed = consentChoice !== "no_contact";
  const [activeTab, setActiveTab] = useState<Method>("in_person_signature");
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [phoneNote, setPhoneNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sigPadRef = useRef<SignaturePadHandle | null>(null);

  const canConfirmInPerson = !signatureEmpty;
  const canConfirmPhone = phoneNote.trim().length > 0;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      if (activeTab === "in_person_signature" && sigPadRef.current) {
        const dataUrl = sigPadRef.current.toDataURL();
        const ts = Date.now();
        const fileRef = storageRef(
          storage,
          `signatures/${bookingId}/reauth-${ts}.png`
        );
        await uploadString(fileRef, dataUrl, "data_url", {
          contentType: "image/png",
        });
        const url = await getDownloadURL(fileRef);
        await onConfirm({ method: "in_person_signature", signatureUrl: url });
      } else if (activeTab === "phone") {
        await onConfirm({ method: "phone", note: phoneNote });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-bold text-[#0B2040]">
          Customer authorization required
        </h2>
        <button
          onClick={onCancel}
          className="min-h-[48px] min-w-[48px] px-3 py-2 text-2xl text-slate-500 hover:text-slate-700"
          aria-label="Cancel"
        >
          ✕
        </button>
      </header>

      <div className="border-b border-orange-100 bg-orange-50 px-4 py-3">
        <p className="text-sm text-slate-700">
          Adding <strong>{pendingLineDescription}</strong> would put the total
          at <strong>${pendingNewTotal.toFixed(2)}</strong>, above the
          customer&apos;s authorized{" "}
          <strong>${threshold.toFixed(2)}</strong>. Choose how authorization
          was obtained:
        </p>
      </div>

      {phoneAllowed && (
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("in_person_signature")}
            className={`flex-1 px-4 py-3 text-sm font-semibold ${
              activeTab === "in_person_signature"
                ? "border-b-2 border-[#E07B2D] text-[#0B2040]"
                : "text-slate-500"
            }`}
          >
            Customer signing here
          </button>
          <button
            onClick={() => setActiveTab("phone")}
            className={`flex-1 px-4 py-3 text-sm font-semibold ${
              activeTab === "phone"
                ? "border-b-2 border-[#E07B2D] text-[#0B2040]"
                : "text-slate-500"
            }`}
          >
            Phone authorization
          </button>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {activeTab === "in_person_signature" && (
          <>
            <SignaturePad ref={sigPadRef} onChange={setSignatureEmpty} />
            <button
              onClick={() => sigPadRef.current?.clear()}
              className="inline-flex min-h-[48px] items-center px-2 py-3 text-sm text-slate-500 underline"
            >
              Clear
            </button>
          </>
        )}
        {activeTab === "phone" && phoneAllowed && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Customer
              </label>
              <p className="text-base text-[#0B2040]">{customerName}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Time
              </label>
              <p className="text-base text-[#0B2040]">
                {new Date().toLocaleString()}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Note (what was authorized)
              </label>
              <textarea
                value={phoneNote}
                onChange={(e) => setPhoneNote(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
                placeholder="Customer authorized via phone — replacing front brake pads, $89 added"
              />
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 p-4">
        <button
          onClick={handleConfirm}
          disabled={
            submitting ||
            (activeTab === "in_person_signature"
              ? !canConfirmInPerson
              : !canConfirmPhone)
          }
          className="w-full min-h-[48px] rounded-lg bg-[#E07B2D] px-4 py-4 text-base font-semibold text-white shadow disabled:opacity-50"
        >
          {submitting ? "Confirming..." : "Confirm authorization"}
        </button>
      </footer>
    </div>
  );
}
