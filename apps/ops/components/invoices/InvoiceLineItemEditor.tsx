"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useServices, type Service } from "@/hooks/useServices";
import type { Invoice, InvoiceLineItem } from "@coastal/shared-types";

// Design tokens from coastal-lineitem-editor-v1.jsx.
const NAVY = "#0B2040";
const ORANGE = "#E07B2D";
const HAIRLINE = "rgba(11,32,64,0.10)";
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const TAX_RATE = 0.075;
const CONDITIONS: Array<"New" | "Used" | "Rebuilt" | "Reconditioned"> = [
  "New",
  "Used",
  "Rebuilt",
  "Reconditioned",
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

interface EditorLine {
  id: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
  kind: "service" | "part";
  partsCondition: "New" | "Used" | "Rebuilt" | "Reconditioned" | null;
  /** Carried fields the tech path persists; preserved when writing back so we
   * never drop FDACS audit data attached to a line. */
  addedDuringWork?: boolean;
  reAuthEventId?: string | null;
}

let _id = 0;
function nextId(): string {
  _id += 1;
  return `li_${Date.now().toString(36)}_${_id}`;
}

function partKindFromService(svc: Service): "service" | "part" {
  const haystack = [svc.type, svc.category, svc.subcategory]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\bpart(s)?\b/.test(haystack) ? "part" : "service";
}

function toEditorLine(raw: InvoiceLineItem & Record<string, unknown>): EditorLine {
  const kind: "service" | "part" =
    raw.kind === "part"
      ? "part"
      : raw.partsCondition != null
        ? "part"
        : "service";
  return {
    id: nextId(),
    serviceName: raw.serviceName ?? "",
    quantity: Number(raw.quantity) || 1,
    unitPrice: Number(raw.unitPrice) || 0,
    taxable: !!raw.taxable,
    kind,
    partsCondition:
      kind === "part" ? (raw.partsCondition ?? "New") : null,
    addedDuringWork:
      typeof raw.addedDuringWork === "boolean"
        ? raw.addedDuringWork
        : undefined,
    reAuthEventId:
      typeof raw.reAuthEventId === "string" ? raw.reAuthEventId : null,
  };
}

function toPersisted(line: EditorLine): InvoiceLineItem & Record<string, unknown> {
  const out: InvoiceLineItem & Record<string, unknown> = {
    serviceName: line.serviceName.trim(),
    quantity: line.quantity,
    unitPrice: round2(line.unitPrice),
    lineTotal: round2(line.quantity * line.unitPrice),
    taxable: line.taxable,
    kind: line.kind,
    partsCondition: line.kind === "part" ? (line.partsCondition ?? "New") : null,
  };
  if (typeof line.addedDuringWork === "boolean") {
    out.addedDuringWork = line.addedDuringWork;
  }
  if (line.reAuthEventId != null) {
    out.reAuthEventId = line.reAuthEventId;
  }
  return out;
}

function computeTotals(lines: EditorLine[]) {
  const subtotal = round2(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0));
  const taxableSubtotal = round2(
    lines
      .filter((l) => l.taxable)
      .reduce((s, l) => s + l.quantity * l.unitPrice, 0),
  );
  const taxAmount = round2(taxableSubtotal * TAX_RATE);
  const total = round2(subtotal + taxAmount);
  return { subtotal, taxAmount, total };
}

interface Props {
  invoice: Invoice & { id: string };
  editable: boolean;
  onPersisted?: (next: {
    lineItems: ReturnType<typeof toPersisted>[];
    subtotal: number;
    taxAmount: number;
    total: number;
  }) => void;
}

export default function InvoiceLineItemEditor({
  invoice,
  editable,
  onPersisted,
}: Props) {
  const { services } = useServices({ activeOnly: true });

  const [lines, setLines] = useState<EditorLine[]>(() =>
    (invoice.lineItems ?? []).map((li) =>
      toEditorLine(li as InvoiceLineItem & Record<string, unknown>),
    ),
  );
  const [adding, setAdding] = useState(false);
  const persistedSigRef = useRef<string>("");

  // Re-seed local state when the invoice id flips. We intentionally do NOT
  // resync on every invoice change while editing — local edits are the source
  // of truth between writes, and a snapshot replaying our own write would
  // clobber an in-progress field.
  useEffect(() => {
    setLines(
      (invoice.lineItems ?? []).map((li) =>
        toEditorLine(li as InvoiceLineItem & Record<string, unknown>),
      ),
    );
    persistedSigRef.current = JSON.stringify(invoice.lineItems ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice.id]);

  const totals = useMemo(() => computeTotals(lines), [lines]);

  function patch(id: string, fields: Partial<EditorLine>) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...fields } : l)),
    );
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
    void persist(lines.filter((l) => l.id !== id));
  }

  function addFromCatalog(svc: Service) {
    const kind = partKindFromService(svc);
    const next: EditorLine = {
      id: nextId(),
      serviceName: svc.name,
      quantity: 1,
      unitPrice: Number(svc.price) || 0,
      taxable: true,
      kind,
      partsCondition: kind === "part" ? "New" : null,
    };
    const nextLines = [...lines, next];
    setLines(nextLines);
    setAdding(false);
    void persist(nextLines);
  }

  function addCustom() {
    const next: EditorLine = {
      id: nextId(),
      serviceName: "",
      quantity: 1,
      unitPrice: 0,
      taxable: true,
      kind: "service",
      partsCondition: null,
    };
    setLines((prev) => [...prev, next]);
    setAdding(false);
    // No write yet — empty line, user will fill it and blur to persist.
  }

  async function persist(next: EditorLine[]) {
    if (!editable) return;
    const payload = next.map(toPersisted);
    const sig = JSON.stringify(payload);
    if (sig === persistedSigRef.current) return;
    const { subtotal, taxAmount, total } = computeTotals(next);
    try {
      await updateDoc(doc(db, "invoices", invoice.id), {
        lineItems: payload,
        subtotal,
        taxAmount,
        total,
        updatedAt: serverTimestamp(),
      });
      persistedSigRef.current = sig;
      onPersisted?.({ lineItems: payload, subtotal, taxAmount, total });
    } catch (err) {
      toast.error("Could not save line items", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  function blurPersist() {
    void persist(lines);
  }

  // ── render ──────────────────────────────────────────────────────────────

  const micro: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(11,32,64,0.45)",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontFamily: FONT,
  };
  const meta: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 400,
    color: "rgba(11,32,64,0.58)",
    fontFamily: FONT,
  };
  const inputStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 500,
    color: NAVY,
    border: `1px solid ${HAIRLINE}`,
    borderRadius: 8,
    padding: "7px 9px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ fontFamily: FONT, color: NAVY }}>
      <div
        style={{
          background: "#fff",
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div style={{ ...micro, marginBottom: 10 }}>Services & parts</div>

        {lines.length === 0 && (
          <div style={{ ...meta, padding: "6px 0" }}>No line items yet.</div>
        )}

        {lines.map((it) => (
          <div
            key={it.id}
            style={{
              borderTop: `1px solid rgba(11,32,64,0.06)`,
              paddingTop: 12,
              marginTop: 12,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              {editable ? (
                <input
                  value={it.serviceName}
                  placeholder="Description"
                  onChange={(e) => patch(it.id, { serviceName: e.target.value })}
                  onBlur={blurPersist}
                  style={{ ...inputStyle, fontWeight: 600 }}
                />
              ) : (
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                  {it.serviceName || "Untitled line"}
                </div>
              )}
              {editable && (
                <button
                  type="button"
                  onClick={() => removeLine(it.id)}
                  aria-label="Remove line"
                  style={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: `1px solid ${HAIRLINE}`,
                    background: "#fff",
                    color: "rgba(178,58,46,0.85)",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              {editable ? (
                <>
                  <label
                    style={{
                      ...meta,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Qty
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) =>
                        patch(it.id, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      onBlur={blurPersist}
                      style={{
                        ...inputStyle,
                        width: 60,
                        padding: "6px 6px",
                        textAlign: "center",
                      }}
                    />
                  </label>
                  <label
                    style={{
                      ...meta,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      flex: 1,
                    }}
                  >
                    $
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={it.unitPrice}
                      onChange={(e) =>
                        patch(it.id, {
                          unitPrice: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      onBlur={blurPersist}
                      style={{
                        ...inputStyle,
                        width: 96,
                        padding: "6px 8px",
                      }}
                    />
                  </label>
                </>
              ) : (
                <div style={{ ...meta, flex: 1 }}>
                  {it.quantity} × {money(it.unitPrice)}
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, marginLeft: "auto" }}>
                {money(round2(it.quantity * it.unitPrice))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {editable && (
                <button
                  type="button"
                  onClick={() => {
                    const nextKind: EditorLine["kind"] =
                      it.kind === "part" ? "service" : "part";
                    const nextLines: EditorLine[] = lines.map((l) =>
                      l.id === it.id
                        ? {
                            ...l,
                            kind: nextKind,
                            partsCondition:
                              nextKind === "part"
                                ? (l.partsCondition ?? "New")
                                : null,
                          }
                        : l,
                    );
                    setLines(nextLines);
                    void persist(nextLines);
                  }}
                  style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "5px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: `1px solid ${it.kind === "part" ? ORANGE : HAIRLINE}`,
                    background:
                      it.kind === "part"
                        ? "rgba(224,123,45,0.08)"
                        : "#fff",
                    color:
                      it.kind === "part"
                        ? "#B5611F"
                        : "rgba(11,32,64,0.55)",
                  }}
                >
                  {it.kind === "part" ? "Part" : "Service"}
                </button>
              )}
              {it.kind === "part" && editable && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        const nextLines = lines.map((l) =>
                          l.id === it.id ? { ...l, partsCondition: c } : l,
                        );
                        setLines(nextLines);
                        void persist(nextLines);
                      }}
                      style={{
                        fontFamily: FONT,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "5px 9px",
                        borderRadius: 999,
                        cursor: "pointer",
                        border: `1px solid ${it.partsCondition === c ? ORANGE : HAIRLINE}`,
                        background:
                          it.partsCondition === c
                            ? "rgba(224,123,45,0.08)"
                            : "#fff",
                        color:
                          it.partsCondition === c
                            ? "#B5611F"
                            : "rgba(11,32,64,0.55)",
                      }}
                    >
                      {c === "Reconditioned" ? "Recond." : c}
                    </button>
                  ))}
                </div>
              )}
              {it.kind === "part" && !editable && it.partsCondition && (
                <span style={{ ...micro, fontSize: 10 }}>
                  Part · {it.partsCondition}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!editable) return;
                  const nextLines = lines.map((l) =>
                    l.id === it.id ? { ...l, taxable: !l.taxable } : l,
                  );
                  setLines(nextLines);
                  void persist(nextLines);
                }}
                style={{
                  marginLeft: "auto",
                  fontFamily: FONT,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 999,
                  cursor: editable ? "pointer" : "default",
                  border: `1px solid ${it.taxable ? "rgba(11,32,64,0.18)" : HAIRLINE}`,
                  background: it.taxable
                    ? "rgba(11,32,64,0.04)"
                    : "#fff",
                  color: it.taxable ? NAVY : "rgba(11,32,64,0.4)",
                }}
              >
                {it.taxable ? "Taxable" : "Non-tax"}
              </button>
            </div>
          </div>
        ))}

        {editable && (
          <div style={{ marginTop: 14 }}>
            {!adding ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 10,
                  border: `1px dashed rgba(11,32,64,0.25)`,
                  background: "#fff",
                  color: NAVY,
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Add line item
              </button>
            ) : (
              <div
                style={{
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <div style={{ ...micro, marginBottom: 8 }}>From catalog</div>
                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {services.length === 0 ? (
                    <div style={{ ...meta, padding: "6px 0" }}>
                      No services found.
                    </div>
                  ) : (
                    services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => addFromCatalog(s)}
                        style={{
                          width: "100%",
                          border: "none",
                          background: "transparent",
                          borderRadius: 8,
                          padding: "9px 8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          fontFamily: FONT,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: NAVY,
                            textAlign: "left",
                          }}
                        >
                          {s.name}
                        </span>
                        <span style={{ ...meta, fontSize: 13 }}>
                          {money(Number(s.price) || 0)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={addCustom}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 10,
                      background: "#fff",
                      color: NAVY,
                      border: `1px solid rgba(11,32,64,0.16)`,
                      fontFamily: FONT,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Custom line
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdding(false)}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 10,
                      background: "transparent",
                      color: NAVY,
                      border: "none",
                      fontFamily: FONT,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <div style={{ ...meta, fontSize: 11.5, marginTop: 8 }}>
                  Catalog prices prefill and stay editable, so you can override
                  per job.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 14,
          padding: 14,
          marginTop: 12,
        }}
      >
        <Row label="Subtotal" value={money(totals.subtotal)} />
        <Row
          label={`Tax (${(TAX_RATE * 100).toFixed(1)}%)`}
          value={money(totals.taxAmount)}
        />
        <div
          style={{
            borderTop: `1px solid rgba(11,32,64,0.08)`,
            marginTop: 8,
            paddingTop: 10,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
          <span style={{ fontSize: 17, fontWeight: 700 }}>
            {money(totals.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 0",
        fontFamily: FONT,
      }}
    >
      <span style={{ fontSize: 13, color: "rgba(11,32,64,0.58)" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, color: NAVY }}>
        {value}
      </span>
    </div>
  );
}
