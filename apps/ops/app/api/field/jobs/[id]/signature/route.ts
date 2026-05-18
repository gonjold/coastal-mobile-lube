import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const KINDS = new Set(["estimate", "completion"]);

type Body = { kind?: string; dataUrl?: string };

const URL_FIELD_BY_KIND: Record<string, string> = {
  estimate: "customerEstimateSignatureUrl",
  completion: "customerCompletionSignatureUrl",
};
const SIGNED_AT_FIELD_BY_KIND: Record<string, string> = {
  estimate: "customerEstimateSignedAt",
  completion: "customerCompletionSignedAt",
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
  const { kind, dataUrl } = (await req.json().catch(() => ({}))) as Body;
  if (!kind || !KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 500 },
    );
  }

  // Phase 2 stores signature data URLs directly on the booking doc.
  // The codebase has no Cloudinary upload helper; FDACS-D ships one.
  // When that lands, swap this for a Cloudinary upload and write a URL here.
  const update = {
    [URL_FIELD_BY_KIND[kind]]: dataUrl,
    [SIGNED_AT_FIELD_BY_KIND[kind]]: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection("bookings").doc(id).update(update);

  return NextResponse.json({ ok: true });
}
