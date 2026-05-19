import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

type Body = {
  secure_url?: string;
  public_id?: string;
  caption?: string;
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
  const body = (await req.json().catch(() => ({}))) as Body;
  const url = (body.secure_url ?? "").trim();
  const publicId = (body.public_id ?? "").trim();
  const caption = (body.caption ?? "").trim();

  if (!url || !/^https:\/\/res\.cloudinary\.com\//.test(url)) {
    return NextResponse.json(
      { error: "secure_url must be a cloudinary URL" },
      { status: 400 },
    );
  }
  if (!publicId) {
    return NextResponse.json({ error: "public_id required" }, { status: 400 });
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

  // Photos remain editable even when invoice is finalized — per Phase 2
  // design, photos are evidentiary, not invoice line items.

  // Note: serverTimestamp() can't be used inside arrayUnion — Firestore
  // requires sentinel values at the top level only. ISO strings round-trip
  // cleanly through the JobPhoto adapter's tsToISO() helper.
  const nowIso = new Date().toISOString();
  const entry: Record<string, unknown> = {
    url,
    publicId,
    uploadedAt: nowIso,
    uploadedBy: user.uid,
    capturedAt: nowIso,
  };
  if (caption) entry.caption = caption;

  await bRef.update({
    photos: FieldValue.arrayUnion(entry),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, photo: entry });
}
