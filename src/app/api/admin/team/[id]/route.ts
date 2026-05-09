import { NextResponse, type NextRequest } from "next/server";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth/server";

// Per WO: editable fields are role + active. The canonical doc is users/{uid}.
// We also mirror role/active into the team/coastal singleton members[] entry
// so the legacy /api/admin/team GET endpoint stays consistent.
const ALLOWED_ROLES = new Set(["admin", "tech"]);

function sanitize(input: Record<string, unknown>) {
  const userPatch: Record<string, unknown> = {};
  if (typeof input.role === "string") {
    if (ALLOWED_ROLES.has(input.role)) userPatch.role = input.role;
  }
  if (typeof input.active === "boolean") userPatch.isActive = input.active;
  if (typeof input.isActive === "boolean") userPatch.isActive = input.isActive;
  return userPatch;
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

  // 1. Update canonical users/{uid} doc.
  await db
    .collection("users")
    .doc(id)
    .set(
      { ...patch, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

  // 2. Mirror to team/coastal singleton members[] entry, if present.
  const teamRef = db.collection("team").doc("coastal");
  const teamSnap = await teamRef.get();
  if (teamSnap.exists) {
    const data = teamSnap.data() as { members?: Array<Record<string, unknown>> };
    const members = Array.isArray(data.members) ? data.members : [];
    const updatedMembers = members.map((m) => {
      if (m.uid !== id) return m;
      const next: Record<string, unknown> = { ...m };
      if ("role" in patch) next.role = patch.role;
      if ("isActive" in patch) next.active = patch.isActive;
      return next;
    });
    await teamRef.set(
      { members: updatedMembers, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  }

  return NextResponse.json({ ok: true, id, patch });
}
