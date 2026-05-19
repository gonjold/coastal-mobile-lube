/**
 * Forward-only: when a booking transitions to in_progress, guarantee the
 * vehicle being serviced is represented as a first-class `assets/{id}` doc and
 * `booking.assetId` points at it. Stops the field UI's reliance on the legacy
 * `vehicleInfo` blob fallback for new jobs.
 *
 * Naming note: the work order calls this collection `customerAssets`, but the
 * existing `assets/*` collection (see `src/lib/assets/mutations.ts`) is already
 * the system of record and is referenced by `customers/{id}.assets[]`. Match
 * the existing pattern to avoid forking the schema.
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  12,
);

export type EnsureBookingAssetResult = {
  assetId: string | null;
  created: boolean;
  reason: string;
};

function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normLower(v: unknown): string {
  return asStr(v).trim().toLowerCase();
}

function asYearNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const n = Number(v.trim());
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return null;
}

async function findCustomerId(
  db: Firestore,
  booking: Record<string, unknown>,
): Promise<string | null> {
  const email = normLower(booking.email) || normLower(booking.customerEmail);
  if (email) {
    const snap = await db
      .collection("customers")
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].id;
  }

  const phoneRaw =
    asStr(booking.phone) || asStr(booking.customerPhone);
  const phoneDigits = phoneRaw.replace(/\D/g, "");
  if (phoneDigits.length >= 10) {
    const snap = await db
      .collection("customers")
      .where("phoneNormalized", "==", phoneDigits)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].id;
  }

  const name =
    asStr(booking.name).trim() || asStr(booking.customerName).trim();
  if (name) {
    const snap = await db
      .collection("customers")
      .where("name", "==", name)
      .limit(2)
      .get();
    if (snap.size === 1) return snap.docs[0].id;
  }

  return null;
}

export async function ensureBookingAsset(
  db: Firestore,
  bookingId: string,
): Promise<EnsureBookingAssetResult> {
  const bRef = db.collection("bookings").doc(bookingId);
  const bSnap = await bRef.get();
  if (!bSnap.exists)
    return { assetId: null, created: false, reason: "booking missing" };

  const b = (bSnap.data() ?? {}) as Record<string, unknown>;

  if (typeof b.assetId === "string" && b.assetId.length > 0) {
    return { assetId: b.assetId, created: false, reason: "already linked" };
  }

  const customerId = await findCustomerId(db, b);
  if (!customerId)
    return { assetId: null, created: false, reason: "no customer match" };

  const vehicleInfo = (b.vehicleInfo ?? null) as Record<string, unknown> | null;

  const year =
    asYearNumber(b.vehicleYear) ?? asYearNumber(vehicleInfo?.year);
  const make =
    asStr(b.vehicleMake).trim() || asStr(vehicleInfo?.make).trim();
  const model =
    asStr(b.vehicleModel).trim() || asStr(vehicleInfo?.model).trim();
  const trim =
    asStr(b.vehicleTrim).trim() || asStr(vehicleInfo?.trim).trim();
  const vin = asStr(b.vin).trim() || asStr(vehicleInfo?.vin).trim();
  const plate =
    asStr(b.licenseTag).trim() || asStr(vehicleInfo?.licenseTag).trim();

  if (!year || !make || !model) {
    return {
      assetId: null,
      created: false,
      reason: "vehicle data incomplete",
    };
  }

  // Look for an existing vehicle asset on this customer that matches.
  const existing = await db
    .collection("assets")
    .where("customerId", "==", customerId)
    .where("type", "==", "vehicle")
    .get();

  const targetMake = make.toLowerCase();
  const targetModel = model.toLowerCase();
  const targetPlate = plate.toLowerCase();

  let matchedId: string | null = null;
  for (const doc of existing.docs) {
    const a = doc.data() as Record<string, unknown>;
    if (a.deletedAt) continue;
    const aYear = asYearNumber(a.year);
    if (aYear !== year) continue;
    if (asStr(a.make).trim().toLowerCase() !== targetMake) continue;
    if (asStr(a.model).trim().toLowerCase() !== targetModel) continue;
    // Plate is a refinement: when both have plate and they differ, reject.
    const aPlate = asStr(a.licensePlate).trim().toLowerCase();
    if (targetPlate && aPlate && targetPlate !== aPlate) continue;
    matchedId = doc.id;
    break;
  }

  if (matchedId) {
    await bRef.update({
      assetId: matchedId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { assetId: matchedId, created: false, reason: "linked existing" };
  }

  // Create a new vehicle asset and link it.
  const id = `vehicle_${nanoid()}`;
  const now = new Date().toISOString();
  const nickname = [year, make, model].filter(Boolean).join(" ");

  const assetDoc: Record<string, unknown> = {
    id,
    customerId,
    type: "vehicle",
    year,
    make,
    model,
    createdAt: now,
    updatedAt: now,
  };
  if (trim) assetDoc.trim = trim;
  if (vin) assetDoc.vin = vin;
  if (plate) assetDoc.licensePlate = plate;
  if (nickname) assetDoc.nickname = nickname;

  const batch = db.batch();
  batch.set(db.collection("assets").doc(id), assetDoc);
  batch.update(db.collection("customers").doc(customerId), {
    assets: FieldValue.arrayUnion(id),
    updatedAt: now,
  });
  batch.update(bRef, {
    assetId: id,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return { assetId: id, created: true, reason: "created new" };
}
