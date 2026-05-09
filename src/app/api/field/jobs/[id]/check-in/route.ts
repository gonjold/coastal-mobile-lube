import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

type CheckInBody = {
  lat?: number;
  lng?: number;
  accuracy?: number;
};

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
  const body = (await req.json().catch(() => ({}))) as CheckInBody;
  const { lat, lng, accuracy } = body;

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
  const status = data.status as string | undefined;
  if (status === "in_progress") {
    return NextResponse.json(
      { error: "Job already in progress" },
      { status: 409 },
    );
  }
  if (status === "completed" || status === "cancelled") {
    return NextResponse.json(
      { error: `Cannot check in: job status is ${status}` },
      { status: 409 },
    );
  }

  const update: Record<string, unknown> = {
    status: "in_progress",
    techCheckInAt: FieldValue.serverTimestamp(),
    jobStartedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!data.assignedTechId) {
    update.assignedTechId = user.uid;
  }
  if (typeof lat === "number" && typeof lng === "number") {
    update.checkInLocation = {
      lat,
      lng,
      accuracy: typeof accuracy === "number" ? accuracy : null,
      capturedAt: FieldValue.serverTimestamp(),
    };
  }

  await ref.update(update);

  return NextResponse.json({ ok: true });
}
