import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";
import { requireRole } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { computeTotals } from "@/lib/services/totals";

export const dynamic = "force-dynamic";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

type Body = {
  description?: string;
  qty?: number;
  unitPrice?: number;
  taxable?: boolean;
  sourceServiceId?: string | null;
};

type ExistingLine = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxable: boolean;
  sourceServiceId?: string | null;
  addedDuringWork?: boolean;
  partsCondition?: "New" | "Used" | "Rebuilt" | "Reconditioned" | null;
  reAuthEventId?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["owner", "tech"]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const status = msg === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;

  const description = (body.description ?? "").trim();
  const qty = Number.isFinite(body.qty as number) ? Math.trunc(body.qty as number) : NaN;
  const unitPrice =
    typeof body.unitPrice === "number" && Number.isFinite(body.unitPrice)
      ? body.unitPrice
      : NaN;
  const taxable = Boolean(body.taxable);

  if (!description) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }
  if (!Number.isFinite(qty) || qty < 1 || qty > 99) {
    return NextResponse.json({ error: "qty must be 1–99" }, { status: 400 });
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return NextResponse.json(
      { error: "unitPrice must be ≥ 0" },
      { status: 400 },
    );
  }

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

  const newLine: ExistingLine = {
    id: `li_${nanoid()}`,
    description,
    qty,
    unitPrice,
    taxable,
    sourceServiceId: body.sourceServiceId ?? null,
  };
  const next = [...existing, newLine];
  const totals = computeTotals(next);

  await bRef.update({
    estimateLineItems: next,
    estimateSubtotal: totals.subtotal,
    estimateTaxableSubtotal: totals.taxableSubtotal,
    estimateTax: totals.tax,
    estimateTotal: totals.total,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    ok: true,
    lineItem: newLine,
    totals,
  });
}
