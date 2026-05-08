"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  doc,
  updateDoc,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { Booking } from "@/app/admin/shared";
import SignaturePad, { type SignaturePadHandle } from "./SignaturePad";
import AddLineItemModal, { type NewLineItem } from "./AddLineItemModal";

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxable: boolean;
  partsCondition: "New" | "Used" | "Rebuilt" | "Reconditioned" | null;
  sourceServiceId: string | null;
}

const TAX_RATE = 0.075;
const CONSENT_THRESHOLD = 150;

type ConsentChoice =
  | "authorize_up_to"
  | "contact_above"
  | "no_contact"
  | null;

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `li-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function seedFromBooking(b: Booking): LineItem[] {
  if (b.estimateLineItems && b.estimateLineItems.length > 0) {
    return b.estimateLineItems.map((l) => ({
      id: l.id,
      description: l.description,
      qty: l.qty,
      unitPrice: l.unitPrice,
      taxable: l.taxable,
      partsCondition: l.partsCondition ?? null,
      sourceServiceId: l.sourceServiceId ?? null,
    }));
  }
  if (b.selectedServices && b.selectedServices.length > 0) {
    return b.selectedServices.map((s) => ({
      id: newId(),
      description: s.name,
      qty: 1,
      unitPrice: typeof s.price === "number" ? s.price : 0,
      taxable: false,
      partsCondition: null,
      sourceServiceId: s.id,
    }));
  }
  return [];
}

interface Props {
  booking: Booking;
}

export default function EstimateBuilder({ booking }: Props) {
  const bookingId = booking.id;

  // Customer (auto-save on blur)
  const [custName, setCustName] = useState(booking.customerName || booking.name || "");
  const [custPhone, setCustPhone] = useState(booking.phone || booking.customerPhone || "");
  const [custEmail, setCustEmail] = useState(booking.email || booking.customerEmail || "");

  // Refs for snapshot of last-saved value (so blur diff works)
  const savedNameRef = useRef(custName);
  const savedPhoneRef = useRef(custPhone);
  const savedEmailRef = useRef(custEmail);

  const [custToast, setCustToast] = useState<string | null>(null);

  // Line items
  const [lines, setLines] = useState<LineItem[]>(() => seedFromBooking(booking));
  const [showAddModal, setShowAddModal] = useState(false);

  // Consent — dual-mode: simple (≤$150) and 3-option (>$150). Both kept in state.
  const [simpleChecked, setSimpleChecked] = useState(
    booking.estimateConsent?.choice === "simple_under_150"
  );
  const [bigChoice, setBigChoice] = useState<ConsentChoice>(() => {
    const c = booking.estimateConsent?.choice;
    if (c === "authorize_up_to" || c === "contact_above" || c === "no_contact") return c;
    return null;
  });
  const [authorizeUpTo, setAuthorizeUpTo] = useState<string>(
    booking.estimateConsent?.authorizeUpTo != null
      ? String(booking.estimateConsent.authorizeUpTo)
      : ""
  );
  const [contactAbove, setContactAbove] = useState<string>(
    booking.estimateConsent?.contactAbove != null
      ? String(booking.estimateConsent.contactAbove)
      : "50"
  );

  // Authorized other person
  const initOther = booking.estimateConsent?.authorizedOtherPerson;
  const [otherOpen, setOtherOpen] = useState(!!initOther);
  const [otherName, setOtherName] = useState(initOther?.name || "");
  const [otherRel, setOtherRel] = useState(initOther?.relationship || "");
  const [otherPhone, setOtherPhone] = useState(initOther?.phone || "");

  // Signature
  const sigRef = useRef<SignaturePadHandle | null>(null);
  const [sigEmpty, setSigEmpty] = useState(true);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-fill authorizeUpTo on first total > 150 if empty
  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
    const taxableSubtotal = lines
      .filter((l) => l.taxable)
      .reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
    const tax = taxableSubtotal * TAX_RATE;
    const total = subtotal + tax;
    return { subtotal, taxableSubtotal, tax, total };
  }, [lines]);

  const isOver150 = totals.total > CONSENT_THRESHOLD;

  useEffect(() => {
    if (isOver150 && bigChoice === "authorize_up_to" && !authorizeUpTo) {
      setAuthorizeUpTo(totals.total.toFixed(2));
    }
  }, [isOver150, bigChoice, authorizeUpTo, totals.total]);

  function updateLine(id: string, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function handleAdd(line: NewLineItem) {
    setLines((prev) => [
      ...prev,
      {
        id: newId(),
        description: line.description,
        qty: line.qty,
        unitPrice: line.unitPrice,
        taxable: line.taxable,
        partsCondition: null,
        sourceServiceId: line.sourceServiceId,
      },
    ]);
    setShowAddModal(false);
  }

  // Customer auto-save on blur
  async function commitCustomerField(
    field: "customerName" | "phone" | "email",
    next: string,
    savedRef: React.MutableRefObject<string>,
    setLocal: (v: string) => void
  ) {
    const trimmed = next.trim();
    if (trimmed === savedRef.current) return;
    const previous = savedRef.current;
    savedRef.current = trimmed;
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        [field]: trimmed || null,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(`Failed to save ${field}`, e);
      savedRef.current = previous;
      setLocal(previous);
      setCustToast(`Couldn't save ${field}. Reverted.`);
      setTimeout(() => setCustToast(null), 3000);
    }
  }

  // Validation for Save & Sign
  const consentValid = (() => {
    if (lines.length === 0) return false;
    if (isOver150) {
      if (bigChoice === "authorize_up_to") {
        const v = parseFloat(authorizeUpTo);
        return !isNaN(v) && v >= totals.total;
      }
      if (bigChoice === "contact_above") {
        const v = parseFloat(contactAbove);
        return !isNaN(v) && v >= 0;
      }
      if (bigChoice === "no_contact") return true;
      return false;
    }
    return simpleChecked;
  })();

  const canSave = consentValid && !sigEmpty && !saving && lines.length > 0;

  async function handleSaveAndSign() {
    if (!canSave) return;
    setSaveError(null);
    setSaving(true);
    try {
      const dataUrl = sigRef.current?.toDataURL() || "";
      if (!dataUrl) throw new Error("Signature missing");

      const path = `signatures/${bookingId}/estimate-${Date.now()}.png`;
      const sRef = storageRef(storage, path);
      await uploadString(sRef, dataUrl, "data_url", {
        contentType: "image/png",
      });
      const url = await getDownloadURL(sRef);

      const consent: {
        choice: "authorize_up_to" | "contact_above" | "no_contact" | "simple_under_150";
        authorizeUpTo: number | null;
        contactAbove: number | null;
        authorizedOtherPerson: { name: string; relationship: string; phone: string } | null;
      } = isOver150
        ? bigChoice === "authorize_up_to"
          ? {
              choice: "authorize_up_to",
              authorizeUpTo: parseFloat(authorizeUpTo),
              contactAbove: null,
              authorizedOtherPerson: null,
            }
          : bigChoice === "contact_above"
          ? {
              choice: "contact_above",
              authorizeUpTo: null,
              contactAbove: parseFloat(contactAbove),
              authorizedOtherPerson: null,
            }
          : {
              choice: "no_contact",
              authorizeUpTo: null,
              contactAbove: null,
              authorizedOtherPerson: null,
            }
        : {
            choice: "simple_under_150",
            authorizeUpTo: null,
            contactAbove: null,
            authorizedOtherPerson: null,
          };

      const otherFilled =
        otherName.trim() || otherRel.trim() || otherPhone.trim();
      if (otherFilled) {
        consent.authorizedOtherPerson = {
          name: otherName.trim(),
          relationship: otherRel.trim(),
          phone: otherPhone.trim(),
        };
      }

      const payload: Record<string, unknown> = {
        estimateLineItems: lines.map((l) => ({
          id: l.id,
          description: l.description,
          qty: l.qty,
          unitPrice: l.unitPrice,
          taxable: l.taxable,
          partsCondition: l.partsCondition,
          sourceServiceId: l.sourceServiceId,
        })),
        estimateSubtotal: round2(totals.subtotal),
        estimateTaxableSubtotal: round2(totals.taxableSubtotal),
        estimateTax: round2(totals.tax),
        estimateTotal: round2(totals.total),
        estimateConsent: consent,
        customerEstimateSignatureUrl: url,
        customerEstimateSignedAt: serverTimestamp(),
        estimateLocked: true,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "bookings", bookingId), payload);
      // onSnapshot in parent flips estimateLocked → renders EstimateLocked.
    } catch (e) {
      console.error("Save & sign failed", e);
      const msg = e instanceof Error ? e.message : "unknown error";
      setSaveError("Failed to save: " + msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelStart() {
    const ok = confirm("Discard estimate progress and return to check-in?");
    if (!ok) return;
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "confirmed",
        techCheckInAt: deleteField(),
        jobStartedAt: deleteField(),
        estimateLineItems: deleteField(),
        estimateSubtotal: deleteField(),
        estimateTaxableSubtotal: deleteField(),
        estimateTax: deleteField(),
        estimateTotal: deleteField(),
        estimateConsent: deleteField(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Cancel start failed", e);
      const msg = e instanceof Error ? e.message : "unknown error";
      alert("Failed to cancel: " + msg);
    }
  }

  const v = booking.vehicleInfo;
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

  return (
    <div className="pb-32">
      <header className="mb-4 mt-2">
        <div className="mb-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase text-amber-800">
          In Progress · Estimate
        </div>
        <h1 className="text-xl font-bold text-[#0B2040]">Build Estimate</h1>
        <div className="text-sm text-slate-700">{booking.address}</div>
      </header>

      <Section title="Customer">
        <div className="space-y-3">
          <Field
            label="Name"
            value={custName}
            onChange={setCustName}
            onBlur={() =>
              commitCustomerField("customerName", custName, savedNameRef, setCustName)
            }
          />
          <Field
            label="Phone"
            value={custPhone}
            type="tel"
            onChange={setCustPhone}
            onBlur={() =>
              commitCustomerField("phone", custPhone, savedPhoneRef, setCustPhone)
            }
          />
          <Field
            label="Email"
            value={custEmail}
            type="email"
            onChange={setCustEmail}
            onBlur={() =>
              commitCustomerField("email", custEmail, savedEmailRef, setCustEmail)
            }
          />
          {custToast && (
            <div className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {custToast}
            </div>
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

      <button
        onClick={handleCancelStart}
        className="mb-4 text-sm text-slate-500 underline hover:text-slate-700"
      >
        ← Cancel start, return to check-in
      </button>

      <Section title="Line Items">
        {lines.length === 0 && (
          <div className="rounded border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
            No line items yet. Tap &ldquo;Add line item&rdquo; below.
          </div>
        )}
        <div className="space-y-3">
          {lines.map((line) => (
            <LineItemRow
              key={line.id}
              line={line}
              onUpdate={(patch) => updateLine(line.id, patch)}
              onRemove={() => removeLine(line.id)}
            />
          ))}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-3 w-full rounded-lg border border-dashed border-[#0B2040] px-4 py-3 text-sm font-semibold text-[#0B2040] min-h-[48px]"
        >
          + Add line item
        </button>
      </Section>

      <Section title="Totals">
        <div className="space-y-1 text-sm">
          <Row label="Subtotal" value={fmt(totals.subtotal)} />
          {totals.taxableSubtotal > 0 && (
            <Row
              label={`Tax (7.5% on ${fmt(totals.taxableSubtotal)})`}
              value={fmt(totals.tax)}
            />
          )}
          <div className="mt-2 border-t border-slate-200 pt-2">
            <Row label="Total" value={fmt(totals.total)} bold />
          </div>
          {isOver150 && (
            <div className="mt-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Total exceeds $150 — Florida statute FS 559.905 written estimate
              consent required below.
            </div>
          )}
        </div>
      </Section>

      <Section title="Consent">
        {!isOver150 && (
          <label className="flex items-start gap-3 text-base">
            <input
              type="checkbox"
              checked={simpleChecked}
              onChange={(e) => setSimpleChecked(e.target.checked)}
              className="mt-1 h-5 w-5"
            />
            <span>I authorize this work.</span>
          </label>
        )}

        {isOver150 && (
          <div className="space-y-3">
            <ConsentRadio
              checked={bigChoice === "authorize_up_to"}
              onChange={() => setBigChoice("authorize_up_to")}
              label={
                <>
                  Authorize repairs up to{" "}
                  <span className="inline-flex items-center gap-1">
                    $
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      value={authorizeUpTo}
                      onChange={(e) => setAuthorizeUpTo(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-28 rounded border border-slate-300 px-2 py-2 text-base"
                    />
                  </span>
                </>
              }
            />
            {bigChoice === "authorize_up_to" &&
              authorizeUpTo &&
              parseFloat(authorizeUpTo) < totals.total && (
                <div className="ml-7 text-xs text-red-600">
                  Must be at least {fmt(totals.total)} (current total).
                </div>
              )}
            <ConsentRadio
              checked={bigChoice === "contact_above"}
              onChange={() => setBigChoice("contact_above")}
              label={
                <>
                  Contact me before any additional work over{" "}
                  <span className="inline-flex items-center gap-1">
                    $
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      value={contactAbove}
                      onChange={(e) => setContactAbove(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-24 rounded border border-slate-300 px-2 py-2 text-base"
                    />
                  </span>
                </>
              }
            />
            <ConsentRadio
              checked={bigChoice === "no_contact"}
              onChange={() => setBigChoice("no_contact")}
              label={<>Do not contact me regarding additional repairs.</>}
            />
          </div>
        )}

        <div className="mt-4 border-t border-slate-200 pt-3">
          <button
            onClick={() => setOtherOpen((v) => !v)}
            className="text-sm text-slate-600 underline"
          >
            {otherOpen ? "− Hide" : "+ Add"} authorized other person (optional)
          </button>
          {otherOpen && (
            <div className="mt-3 space-y-2">
              <Field label="Name" value={otherName} onChange={setOtherName} />
              <Field
                label="Relationship"
                value={otherRel}
                onChange={setOtherRel}
              />
              <Field
                label="Phone"
                type="tel"
                value={otherPhone}
                onChange={setOtherPhone}
              />
            </div>
          )}
        </div>
      </Section>

      <Section title="Customer Signature">
        <SignaturePad
          ref={sigRef}
          onChange={(empty) => setSigEmpty(empty)}
        />
        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={() => sigRef.current?.clear()}
            className="text-sm text-slate-500 underline"
          >
            Clear
          </button>
          <span className="text-xs text-slate-500">
            {sigEmpty ? "Awaiting signature" : "Signed"}
          </span>
        </div>
      </Section>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3 shadow-lg">
        <div className="mx-auto max-w-2xl">
          {saveError && (
            <div className="mb-2 rounded bg-red-50 p-2 text-sm text-red-700">
              {saveError}
            </div>
          )}
          <button
            onClick={handleSaveAndSign}
            disabled={!canSave}
            className="w-full rounded-lg bg-[#E07B2D] px-4 py-4 text-base font-semibold text-white shadow disabled:opacity-50 min-h-[48px]"
          >
            {saving ? "Saving…" : `Save & Sign Estimate · ${fmt(totals.total)}`}
          </button>
        </div>
      </div>

      {showAddModal && (
        <AddLineItemModal
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function LineItemRow({
  line,
  onUpdate,
  onRemove,
}: {
  line: LineItem;
  onUpdate: (patch: Partial<LineItem>) => void;
  onRemove: () => void;
}) {
  const [editParts, setEditParts] = useState(line.partsCondition !== null);
  const lineTotal = line.qty * line.unitPrice;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <input
        type="text"
        value={line.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        className="w-full rounded border border-slate-300 px-2 py-2 text-base"
      />
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-slate-500">Qty</label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdate({ qty: Math.max(1, line.qty - 1) })}
              className="h-10 w-10 rounded border border-slate-300 text-lg font-semibold text-[#0B2040]"
              aria-label="Decrement quantity"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={line.qty}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                onUpdate({ qty: isNaN(n) ? 1 : Math.max(1, Math.min(99, n)) });
              }}
              className="w-12 rounded border border-slate-300 px-1 py-2 text-center text-base"
            />
            <button
              onClick={() => onUpdate({ qty: Math.min(99, line.qty + 1) })}
              className="h-10 w-10 rounded border border-slate-300 text-lg font-semibold text-[#0B2040]"
              aria-label="Increment quantity"
            >
              +
            </button>
          </div>
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-500">Unit Price</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            value={line.unitPrice}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              onUpdate({ unitPrice: isNaN(n) ? 0 : n });
            }}
            className="w-full rounded border border-slate-300 px-2 py-2 text-base"
          />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={line.taxable}
            onChange={(e) => onUpdate({ taxable: e.target.checked })}
            className="h-5 w-5"
          />
          Taxable
        </label>
        <span className="text-slate-700">{fmt(lineTotal)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        {!editParts && (
          <button
            onClick={() => setEditParts(true)}
            className="text-slate-500 underline"
          >
            + Parts condition
          </button>
        )}
        {editParts && (
          <select
            value={line.partsCondition || ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                onUpdate({ partsCondition: null });
                setEditParts(false);
              } else {
                onUpdate({
                  partsCondition: v as
                    | "New"
                    | "Used"
                    | "Rebuilt"
                    | "Reconditioned",
                });
              }
            }}
            className="rounded border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">— none —</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
            <option value="Rebuilt">Rebuilt</option>
            <option value="Reconditioned">Reconditioned</option>
          </select>
        )}
        <button
          onClick={onRemove}
          className="text-red-600 underline"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function ConsentRadio({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 text-base cursor-pointer">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-5"
      />
      <span className="flex-1">{label}</span>
    </label>
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

function Field({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full rounded border border-slate-300 px-3 py-3 text-base"
      />
    </div>
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
