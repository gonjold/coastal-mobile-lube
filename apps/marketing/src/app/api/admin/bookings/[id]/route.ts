import { NextResponse, type NextRequest } from "next/server";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth/server";

// WO field names → schema field names: scheduledDate→confirmedDate,
// timeSlot→timeWindow. status maps directly.
const ALLOWED_STATUSES = new Set([
  "new",
  "new-lead",
  "pending",
  "confirmed",
  "in-progress",
  "completed",
  "invoiced",
  "cancelled",
  "dead",
]);

function sanitize(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};

  if (typeof input.scheduledDate === "string") {
    const v = input.scheduledDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) out.confirmedDate = v;
  }
  if (typeof input.confirmedDate === "string") {
    const v = input.confirmedDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) out.confirmedDate = v;
  }
  if (typeof input.timeSlot === "string") {
    const v = input.timeSlot.trim();
    if (v.length > 0 && v.length < 64) out.timeWindow = v;
  }
  if (typeof input.timeWindow === "string") {
    const v = input.timeWindow.trim();
    if (v.length > 0 && v.length < 64) out.timeWindow = v;
  }
  if (typeof input.status === "string") {
    const v = input.status.trim();
    if (ALLOWED_STATUSES.has(v)) out.status = v;
  }
  if ("bookingPriceOverride" in input) {
    const raw = input.bookingPriceOverride;
    if (raw === null) {
      out.bookingPriceOverride = null;
    } else if (typeof raw === "number" && Number.isFinite(raw)) {
      // Accept positive, up-to-2-decimal numbers capped at $5000 to catch
      // typos like 13495 vs 134.95.
      if (raw > 0 && raw <= 5000) {
        out.bookingPriceOverride = Math.round(raw * 100) / 100;
      }
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > 0 && /^\d+(\.\d{1,2})?$/.test(trimmed)) {
        const num = parseFloat(trimmed);
        if (num > 0 && num <= 5000) {
          out.bookingPriceOverride = Math.round(num * 100) / 100;
        }
      }
    }
  }
  return out;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["owner", "admin_only"]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "FORBIDDEN";
    const status = msg === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const patch = sanitize(body);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "NO_VALID_FIELDS" }, { status: 400 });
  }

  const db = getFirestore();
  await db
    .collection("bookings")
    .doc(id)
    .set(
      { ...patch, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

  return NextResponse.json({ ok: true, id, patch });
}
