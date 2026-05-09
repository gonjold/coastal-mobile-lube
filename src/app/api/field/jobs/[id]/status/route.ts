import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "pending",
  "confirmed",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

type Body = { to?: string };

export async function POST(
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
  const { to } = (await req.json().catch(() => ({}))) as Body;
  if (!to || !ALLOWED.has(to)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
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
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const data = snap.data() ?? {};
  const update: Record<string, unknown> = {
    status: to,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (to === "in_progress") {
    if (!data.techCheckInAt) {
      update.techCheckInAt = FieldValue.serverTimestamp();
    }
    if (!data.jobStartedAt) {
      update.jobStartedAt = FieldValue.serverTimestamp();
    }
    if (!data.assignedTechId) {
      update.assignedTechId = user.uid;
    }
  }
  if (to === "completed") {
    update.jobCompletedAt = FieldValue.serverTimestamp();
  }
  if (to === "cancelled") {
    update.cancelledAt = FieldValue.serverTimestamp();
  }

  await ref.update(update);
  return NextResponse.json({ ok: true });
}
