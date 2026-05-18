import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

type Body = { notes?: string };

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
  const { notes } = (await req.json().catch(() => ({}))) as Body;
  if (typeof notes !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 500 },
    );
  }

  await db
    .collection("bookings")
    .doc(id)
    .update({ notes, updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true });
}
