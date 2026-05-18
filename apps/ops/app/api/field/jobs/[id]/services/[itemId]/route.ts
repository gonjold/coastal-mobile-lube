import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { computeTotals } from "@/lib/services/totals";

export const dynamic = "force-dynamic";

type ExistingLine = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxable: boolean;
};

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    await requireRole(["owner", "tech"]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const status = msg === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { id, itemId } = await params;
  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 500 },
    );
  }

  const bRef = db.collection("bookings").doc(id);
  const snap = await bRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const booking = snap.data() ?? {};
  if (booking.invoiceId) {
    return NextResponse.json(
      { error: "Invoice finalized — line items cannot change." },
      { status: 409 },
    );
  }

  const existing: ExistingLine[] = Array.isArray(booking.estimateLineItems)
    ? (booking.estimateLineItems as ExistingLine[])
    : [];

  if (!existing.some((l) => l.id === itemId)) {
    return NextResponse.json({ error: "Line item not found" }, { status: 404 });
  }

  const next = existing.filter((l) => l.id !== itemId);
  const totals = computeTotals(next);

  await bRef.update({
    estimateLineItems: next,
    estimateSubtotal: totals.subtotal,
    estimateTaxableSubtotal: totals.taxableSubtotal,
    estimateTax: totals.tax,
    estimateTotal: totals.total,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, removedId: itemId, totals });
}
