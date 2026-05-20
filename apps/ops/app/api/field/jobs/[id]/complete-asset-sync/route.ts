import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { ensureBookingAsset } from "@/lib/jobs/ensureBookingAsset";

export const dynamic = "force-dynamic";

/**
 * Post-completion asset sync. Pushes the booking's latest vehicle data
 * and odometerOut (last-known mileage) to the linked assets/{assetId}
 * doc so the customer detail VehiclesEditor stops reading stale or
 * zero mileage on the next visit.
 *
 * Server-only because assets writes require the owner/admin custom
 * claim per firestore.rules:174-177 and Mark Complete is typically
 * fired by a tech. Best-effort: the caller does not block on failure
 * (the booking + invoice are already committed by the time we run).
 */
export async function POST(
  _req: NextRequest,
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

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 500 },
    );
  }

  const bRef = db.collection("bookings").doc(id);
  const bSnap = await bRef.get();
  if (!bSnap.exists) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const b = (bSnap.data() ?? {}) as Record<string, unknown>;

  let assetId: string | null =
    typeof b.assetId === "string" && b.assetId.length > 0 ? b.assetId : null;
  let linkReason = assetId ? "already linked" : "";
  let created = false;

  if (!assetId) {
    const ensured = await ensureBookingAsset(db, id);
    assetId = ensured.assetId;
    linkReason = ensured.reason;
    created = ensured.created;
  }

  if (!assetId) {
    return NextResponse.json({
      ok: true,
      assetId: null,
      skipped: true,
      reason: linkReason || "no asset linkage available",
    });
  }

  const vehicleInfo = (b.vehicleInfo ?? null) as Record<string, unknown> | null;
  const odometerOut =
    (typeof vehicleInfo?.odometerOut === "number"
      ? vehicleInfo.odometerOut
      : null) ??
    (typeof b.odometerOut === "number" ? (b.odometerOut as number) : null);

  const trim =
    (typeof vehicleInfo?.trim === "string" ? vehicleInfo.trim : "") ||
    (typeof b.vehicleTrim === "string" ? b.vehicleTrim : "");
  const vin =
    (typeof vehicleInfo?.vin === "string" ? vehicleInfo.vin : "") ||
    (typeof b.vin === "string" ? b.vin : "");
  const licensePlate =
    (typeof vehicleInfo?.licenseTag === "string" ? vehicleInfo.licenseTag : "") ||
    (typeof b.licenseTag === "string" ? b.licenseTag : "");

  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    lastServicedAt: nowIso,
    updatedAt: nowIso,
  };
  if (odometerOut != null) patch.mileage = odometerOut;
  if (trim) patch.trim = trim;
  if (vin) patch.vin = vin;
  if (licensePlate) patch.licensePlate = licensePlate;

  await db
    .collection("assets")
    .doc(assetId)
    .set(patch, { merge: true });

  // Touch the booking so onSnapshot listeners refresh and the link
  // is timestamped consistently with the asset write.
  await bRef.update({ updatedAt: FieldValue.serverTimestamp() });

  return NextResponse.json({
    ok: true,
    assetId,
    created,
    reason: linkReason || "synced",
    fieldsApplied: Object.keys(patch),
  });
}
