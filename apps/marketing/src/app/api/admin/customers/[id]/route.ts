import { NextResponse, type NextRequest } from "next/server";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth/server";

// Whitelisted editable fields per WO-PHASE-4-ADMIN deliverable 3.
const ALLOWED = new Set(["name", "email", "phone"]);

function sanitize(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!ALLOWED.has(k)) continue;
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (k === "email") out.email = trimmed.toLowerCase();
    else if (k === "phone") out.phone = trimmed.replace(/\D/g, "");
    else out[k] = trimmed;
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
    .collection("customers")
    .doc(id)
    .set(
      { ...patch, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

  return NextResponse.json({ ok: true, id, patch });
}
