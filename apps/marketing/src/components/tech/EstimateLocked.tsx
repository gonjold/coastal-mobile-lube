"use client";

import { doc, updateDoc, serverTimestamp, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Booking, FirestoreTimestamp } from "@/app/admin/shared";
import WorkInProgress from "./WorkInProgress";

interface Props {
  booking: Booking;
}

export default function EstimateLocked({ booking }: Props) {
  const v = booking.vehicleInfo;
  const customerName =
    booking.customerName || booking.name || "Customer";
  const fallbackVehicle = [
    booking.vehicleYear,
    booking.vehicleMake,
    booking.vehicleModel,
    booking.vehicleTrim,
  ]
    .filter(Boolean)
    .join(" ");
  const vehicleDisplay =
    [v?.year, v?.make, v?.model, v?.trim].filter(Boolean).join(" ") ||
    fallbackVehicle ||
    "Vehicle pending";

  const lines = booking.estimateLineItems || [];
  const consent = booking.estimateConsent;

  async function handleRevise() {
    const ok = confirm("Discard signed estimate and re-edit?");
    if (!ok) return;
    try {
      await updateDoc(doc(db, "bookings", booking.id), {
        estimateLocked: false,
        customerEstimateSignatureUrl: deleteField(),
        customerEstimateSignedAt: deleteField(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Revise failed", e);
      const msg = e instanceof Error ? e.message : "unknown error";
      alert("Failed to revise: " + msg);
    }
  }

  return (
    <div className="pb-12">
      <header className="mb-4 mt-2">
        <div className="mb-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-800">
          Estimate signed · {formatTimestamp(booking.customerEstimateSignedAt)}
        </div>
        <h1 className="text-xl font-bold text-[#0B2040]">{customerName}</h1>
        <div className="text-sm text-slate-700">{booking.address}</div>
      </header>

      <Section title="Customer">
        <div className="text-sm">
          <div>{customerName}</div>
          {(booking.phone || booking.customerPhone) && (
            <div>{booking.phone || booking.customerPhone}</div>
          )}
          {(booking.email || booking.customerEmail) && (
            <div>{booking.email || booking.customerEmail}</div>
          )}
        </div>
      </Section>

      <Section title="Vehicle">
        <div className="text-sm">
          <div>{vehicleDisplay}</div>
          {(v?.vin || booking.vin) && (
            <div className="font-mono">VIN: {v?.vin || booking.vin}</div>
          )}
          {(v?.licenseTag || booking.licenseTag) && (
            <div>Tag: {v?.licenseTag || booking.licenseTag}</div>
          )}
          {v?.odometerIn != null && (
            <div>Odometer In: {v.odometerIn.toLocaleString()} mi</div>
          )}
        </div>
      </Section>

      <Section title="Line Items">
        {lines.length === 0 && (
          <div className="text-sm text-slate-500">No line items.</div>
        )}
        <div className="space-y-2">
          {lines.map((l) => (
            <div
              key={l.id}
              className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0"
            >
              <div className="flex-1">
                <div className="text-sm text-[#0B2040]">{l.description}</div>
                <div className="text-xs text-slate-500">
                  {l.qty} × {fmt(l.unitPrice)}
                  {l.taxable ? " · taxable" : ""}
                  {l.partsCondition ? ` · ${l.partsCondition}` : ""}
                </div>
              </div>
              <div className="text-sm text-slate-700">
                {fmt(l.qty * l.unitPrice)}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Totals">
        <div className="space-y-1 text-sm">
          <Row
            label="Subtotal"
            value={fmt(booking.estimateSubtotal ?? 0)}
          />
          {(booking.estimateTaxableSubtotal ?? 0) > 0 && (
            <Row
              label={`Tax (7.5% on ${fmt(
                booking.estimateTaxableSubtotal ?? 0
              )})`}
              value={fmt(booking.estimateTax ?? 0)}
            />
          )}
          <div className="mt-2 border-t border-slate-200 pt-2">
            <Row
              label="Total"
              value={fmt(booking.estimateTotal ?? 0)}
              bold
            />
          </div>
        </div>
      </Section>

      {consent && (
        <Section title="Consent">
          <div className="text-sm text-slate-700">
            {consent.choice === "simple_under_150" && (
              <span>Customer authorized this work.</span>
            )}
            {consent.choice === "authorize_up_to" && (
              <span>
                Customer authorized repairs up to{" "}
                {fmt(consent.authorizeUpTo ?? 0)}.
              </span>
            )}
            {consent.choice === "contact_above" && (
              <span>
                Contact required above {fmt(consent.contactAbove ?? 0)} for
                additional work.
              </span>
            )}
            {consent.choice === "no_contact" && (
              <span>
                Customer declined contact regarding additional repairs.
              </span>
            )}
          </div>
          {consent.authorizedOtherPerson && (
            <div className="mt-3 rounded bg-slate-50 p-3 text-xs text-slate-600">
              <div className="font-semibold uppercase tracking-wide text-slate-500">
                Authorized other person
              </div>
              <div>
                {consent.authorizedOtherPerson.name}
                {consent.authorizedOtherPerson.relationship
                  ? ` (${consent.authorizedOtherPerson.relationship})`
                  : ""}
              </div>
              {consent.authorizedOtherPerson.phone && (
                <div>{consent.authorizedOtherPerson.phone}</div>
              )}
            </div>
          )}
        </Section>
      )}

      {booking.customerEstimateSignatureUrl && (
        <Section title="Signature">
          <img
            src={booking.customerEstimateSignatureUrl}
            alt="Customer estimate signature"
            className="w-full rounded border border-slate-200 bg-white"
            style={{ maxHeight: 200, objectFit: "contain" }}
          />
        </Section>
      )}

      <div className="mb-6 mt-2 text-center">
        <button
          onClick={handleRevise}
          className="inline-flex items-center px-3 py-3 text-sm text-slate-500 underline hover:text-slate-700"
        >
          Revise estimate (requires new signature)
        </button>
      </div>

      <WorkInProgress booking={booking} />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${
        bold ? "text-base font-bold text-[#0B2040]" : ""
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function fmt(n: number): string {
  return `$${(Math.round(n * 100) / 100).toFixed(2)}`;
}

function formatTimestamp(ts: FirestoreTimestamp | null | undefined): string {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts as unknown as string);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
