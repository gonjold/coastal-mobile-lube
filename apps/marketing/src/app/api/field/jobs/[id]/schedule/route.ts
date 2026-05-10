import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { formatTimeWindow } from "@/app/admin/shared";

export const dynamic = "force-dynamic";

const ALLOWED_TIME_WINDOWS = new Set([
  "morning",
  "midday",
  "afternoon",
  "late",
]);

type Body = {
  scheduledDate?: string;
  timeWindow?: string;
};

function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireRole(["owner", "tech"]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const status = msg === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const scheduledDate = (body.scheduledDate ?? "").trim();
  const timeWindow = (body.timeWindow ?? "").trim();

  if (!isISODate(scheduledDate)) {
    return NextResponse.json(
      { error: "scheduledDate must be YYYY-MM-DD" },
      { status: 400 },
    );
  }
  if (!ALLOWED_TIME_WINDOWS.has(timeWindow)) {
    return NextResponse.json(
      { error: "timeWindow must be one of: morning, midday, afternoon, late" },
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

  const ref = db.collection("bookings").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const data = snap.data() ?? {};
  const previousDate =
    (data.confirmedDate as string | undefined) ??
    (data.preferredDate as string | undefined) ??
    null;
  const previousWindow =
    (data.confirmedArrivalWindow as string | undefined) ??
    (data.timeWindow as string | undefined) ??
    null;

  const confirmedArrivalWindow =
    formatTimeWindow(timeWindow) ?? timeWindow;

  await ref.update({
    confirmedDate: scheduledDate,
    preferredDate: scheduledDate,
    timeWindow,
    confirmedArrivalWindow,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Best-effort history log; pattern not enforced elsewhere in the codebase
  // yet — write to a `bookingHistory` subcollection so future audits work.
  try {
    await ref.collection("bookingHistory").add({
      type: "reschedule",
      previousDate,
      previousWindow,
      newDate: scheduledDate,
      newWindow: timeWindow,
      changedBy: user.uid,
      changedAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("[reschedule] history log failed:", err);
  }

  return NextResponse.json({ ok: true });
}
