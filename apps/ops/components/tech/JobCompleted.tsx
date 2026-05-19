"use client";

import { useState } from "react";
import type { Booking, FirestoreTimestamp } from "@/lib/types/booking";
import { formatPhone } from "@/lib/format";
import JobCompletedPayNow from "./JobCompletedPayNow";

interface Props {
  booking: Booking;
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
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function JobCompleted({ booking }: Props) {
  const v = booking.vehicleInfo;
  const customerName = booking.customerName || booking.name || "Customer";
  const customerPhone = booking.customerPhone || booking.phone || "";
  const customerEmail = booking.customerEmail || booking.email || "";

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
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const photos = booking.photos || [];
  const reAuthEvents = booking.reAuthEvents || [];
  const consent = booking.estimateConsent;

  const odoIn = v?.odometerIn ?? booking.odometerIn ?? null;
  const odoOut = v?.odometerOut ?? booking.odometerOut ?? null;

  const [showReAuth, setShowReAuth] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <div className="pb-12">
      <header className="mb-4 mt-2">
        <div className="mb-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-800">
          Completed · {formatTimestamp(booking.jobCompletedAt)}
        </div>
        <h1 className="text-xl font-bold text-[#0B2040]">{customerName}</h1>
        <div className="text-sm text-slate-700">{booking.address}</div>
      </header>

      <JobCompletedPayNow booking={booking} />


      <Section title="Customer">
        <div className="space-y-1 text-sm">
          <div>{customerName}</div>
          {customerPhone && <div>{formatPhone(customerPhone)}</div>}
          {customerEmail && <div>{customerEmail}</div>}
        </div>
      </Section>

      <Section title="Vehicle">
        <div className="space-y-1 text-sm">
          <div>{vehicleDisplay}</div>
          {(v?.vin || booking.vin) && (
            <div className="font-mono">VIN: {v?.vin || booking.vin}</div>
          )}
          {(v?.licenseTag || booking.licenseTag) && (
            <div>Tag: {v?.licenseTag || booking.licenseTag}</div>
          )}
          <div>
            Odometer: {odoIn != null ? `${odoIn.toLocaleString()} mi` : "—"} →{" "}
            {odoOut != null ? `${odoOut.toLocaleString()} mi` : "—"}
          </div>
        </div>
      </Section>

      {booking.customerComplaint && (
        <Section title="Customer Concern">
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm italic text-slate-700">
            {booking.customerComplaint}
          </div>
        </Section>
      )}

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
                <div className="text-sm text-[#0B2040]">
                  {l.description}
                  {l.addedDuringWork && (
                    <span className="ml-2 rounded bg-orange-50 px-1.5 py-0.5 text-xs text-orange-700">
                      Added mid-job
                    </span>
                  )}
                </div>
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
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-[#0B2040]">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
      </Section>

      {photos.length > 0 && (
        <Section title="Photos">
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <button
                key={`${p.url}-${i}`}
                onClick={() => setLightboxUrl(p.url)}
                className="aspect-square overflow-hidden rounded border border-slate-200 bg-slate-100"
                aria-label={`View photo ${i + 1}`}
              >
                <img
                  src={p.url}
                  alt={p.caption || `Photo ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </Section>
      )}

      {booking.customerEstimateSignatureUrl && (
        <Section title="Estimate signature">
          <img
            src={booking.customerEstimateSignatureUrl}
            alt="Customer estimate signature"
            className="w-full rounded border border-slate-200 bg-white"
            style={{ maxHeight: 200, objectFit: "contain" }}
          />
          {booking.customerEstimateSignedAt && (
            <div className="mt-1 text-xs text-slate-500">
              Signed {formatTimestamp(booking.customerEstimateSignedAt)}
            </div>
          )}
        </Section>
      )}

      {booking.customerCompletionSignatureUrl && (
        <Section title="Completion signature">
          <img
            src={booking.customerCompletionSignatureUrl}
            alt="Customer completion signature"
            className="w-full rounded border border-slate-200 bg-white"
            style={{ maxHeight: 200, objectFit: "contain" }}
          />
          {booking.customerCompletionSignedAt && (
            <div className="mt-1 text-xs text-slate-500">
              Signed {formatTimestamp(booking.customerCompletionSignedAt)}
            </div>
          )}
        </Section>
      )}

      {reAuthEvents.length > 0 && (
        <Section title="Re-authorizations">
          <button
            onClick={() => setShowReAuth((s) => !s)}
            className="text-sm text-slate-500 underline"
          >
            {reAuthEvents.length} re-authorization
            {reAuthEvents.length === 1 ? "" : "s"} on file ·{" "}
            {showReAuth ? "Hide" : "Show"} details
          </button>
          {showReAuth && (
            <div className="mt-3 space-y-3">
              {reAuthEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {evt.method === "in_person_signature"
                      ? "In-person signature"
                      : "Phone authorization"}{" "}
                    · {formatTimestamp(evt.timestamp)}
                  </div>
                  <div className="mt-1">By {evt.customerName}</div>
                  {evt.note && (
                    <div className="mt-1 italic text-slate-600">{evt.note}</div>
                  )}
                  {evt.signatureUrl && (
                    <img
                      src={evt.signatureUrl}
                      alt="Re-auth signature"
                      className="mt-2 w-full rounded border border-slate-200 bg-white"
                      style={{ maxHeight: 120, objectFit: "contain" }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {consent && (
        <Section title="Consent">
          <div className="text-sm text-slate-700">
            {consent.choice === "simple_under_150" && (
              <span>Customer authorized this work.</span>
            )}
            {consent.choice === "authorize_up_to" && (
              <span>
                Customer authorized repairs up to {fmt(consent.authorizeUpTo ?? 0)}.
              </span>
            )}
            {consent.choice === "contact_above" && (
              <span>
                Contact required above {fmt(consent.contactAbove ?? 0)} for additional
                work.
              </span>
            )}
            {consent.choice === "no_contact" && (
              <span>Customer declined contact regarding additional repairs.</span>
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
                <div>{formatPhone(consent.authorizedOtherPerson.phone)}</div>
              )}
            </div>
          )}
        </Section>
      )}

      <div className="mb-2 mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-xs text-slate-500">
        PDF will be generated when the invoice is finalized.
      </div>

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <img
            src={lightboxUrl}
            alt="Photo full view"
            className="max-h-full max-w-full"
            style={{ objectFit: "contain" }}
          />
        </div>
      )}
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
