import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";
import { requireRole } from "@/lib/auth/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

type AssetType = "vehicle" | "boat" | "trailer" | "fleet_vehicle";

type EditPatch = {
  year?: number | string | null;
  make?: string | null;
  model?: string | null;
  vin?: string | null;
  licensePlate?: string | null;
  nickname?: string | null;
};

type Body =
  | { mode: "edit"; patch: EditPatch }
  | { mode: "swap"; assetId: string }
  | {
      mode: "create";
      asset: {
        type?: AssetType;
        year?: number | string;
        make: string;
        model: string;
        nickname?: string;
        vin?: string;
        licensePlate?: string;
      };
    };

function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asYear(v: unknown): number | null {
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
  const email =
    asStr(booking.email).toLowerCase() ||
    asStr(booking.customerEmail).toLowerCase();
  if (email) {
    const snap = await db
      .collection("customers")
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].id;
  }
  const phoneRaw = asStr(booking.phone) || asStr(booking.customerPhone);
  const phoneDigits = phoneRaw.replace(/\D/g, "");
  if (phoneDigits.length >= 10) {
    const snap = await db
      .collection("customers")
      .where("phoneNormalized", "==", phoneDigits)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].id;
  }
  const name = asStr(booking.name).trim() || asStr(booking.customerName).trim();
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

async function resolveCustomerId(
  db: Firestore,
  booking: Record<string, unknown>,
): Promise<string | null> {
  const aid = asStr(booking.assetId);
  if (aid) {
    const snap = await db.collection("assets").doc(aid).get();
    if (snap.exists) {
      const data = snap.data() ?? {};
      const cid = asStr(data.customerId);
      if (cid) return cid;
    }
  }
  return findCustomerId(db, booking);
}

export async function GET(
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

  const bSnap = await db.collection("bookings").doc(id).get();
  if (!bSnap.exists) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const booking = bSnap.data() ?? {};
  const finalized = Boolean(booking.invoiceId);
  const currentAssetId = asStr(booking.assetId) || null;

  let currentAsset: Record<string, unknown> | null = null;
  if (currentAssetId) {
    const aSnap = await db.collection("assets").doc(currentAssetId).get();
    if (aSnap.exists) {
      currentAsset = { id: aSnap.id, ...(aSnap.data() ?? {}) };
    }
  }

  const customerId = await resolveCustomerId(db, booking);

  let otherAssets: Array<Record<string, unknown>> = [];
  if (customerId) {
    const snap = await db
      .collection("assets")
      .where("customerId", "==", customerId)
      .get();
    otherAssets = snap.docs
      .map(
        (d) =>
          ({ id: d.id, ...(d.data() ?? {}) }) as Record<string, unknown>,
      )
      .filter((a) => a.id !== currentAssetId && !a.deletedAt);
  }

  return NextResponse.json({
    ok: true,
    finalized,
    customerId,
    currentAssetId,
    currentAsset,
    otherAssets,
  });
}

export async function PATCH(
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
  const body = (await req.json().catch(() => ({}))) as Body;

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
  const booking = bSnap.data() ?? {};
  const finalized = Boolean(booking.invoiceId);
  if (finalized) {
    return NextResponse.json(
      { error: "Invoice finalized — asset cannot change." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();

  if (body.mode === "edit") {
    const aid = asStr(booking.assetId);
    if (!aid) {
      return NextResponse.json(
        { error: "No asset linked to this job — switch to Swap or Create." },
        { status: 400 },
      );
    }
    const patch: Record<string, unknown> = { updatedAt: now };
    const p = body.patch ?? {};
    if (p.year !== undefined) {
      const y = asYear(p.year);
      patch.year = y ?? null;
    }
    if (p.make !== undefined) patch.make = asStr(p.make).trim() || null;
    if (p.model !== undefined) patch.model = asStr(p.model).trim() || null;
    if (p.vin !== undefined) patch.vin = asStr(p.vin).trim() || null;
    if (p.licensePlate !== undefined)
      patch.licensePlate = asStr(p.licensePlate).trim() || null;
    if (p.nickname !== undefined)
      patch.nickname = asStr(p.nickname).trim() || null;

    await db.collection("assets").doc(aid).update(patch);
    await bRef.update({ updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true, mode: "edit", assetId: aid });
  }

  if (body.mode === "swap") {
    const newAid = asStr(body.assetId);
    if (!newAid) {
      return NextResponse.json({ error: "assetId required" }, { status: 400 });
    }
    const newSnap = await db.collection("assets").doc(newAid).get();
    if (!newSnap.exists) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    await bRef.update({
      assetId: newAid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, mode: "swap", assetId: newAid });
  }

  if (body.mode === "create") {
    const a = body.asset ?? ({} as Extract<Body, { mode: "create" }>["asset"]);
    const type: AssetType = (a.type as AssetType) ?? "vehicle";
    const make = asStr(a.make).trim();
    const model = asStr(a.model).trim();
    if (!make || !model) {
      return NextResponse.json(
        { error: "make and model required" },
        { status: 400 },
      );
    }
    const customerId = await resolveCustomerId(db, booking);
    if (!customerId) {
      return NextResponse.json(
        {
          error:
            "Cannot link new asset: no matching customer record. Create the customer record first.",
        },
        { status: 400 },
      );
    }
    const year = asYear(a.year);
    const newId = `${type}_${nanoid()}`;
    const nickname = asStr(a.nickname).trim();
    const display = nickname || [year, make, model].filter(Boolean).join(" ");
    const assetDoc: Record<string, unknown> = {
      id: newId,
      customerId,
      type,
      make,
      model,
      createdAt: now,
      updatedAt: now,
    };
    if (year !== null) assetDoc.year = year;
    if (asStr(a.vin).trim()) assetDoc.vin = asStr(a.vin).trim();
    if (asStr(a.licensePlate).trim())
      assetDoc.licensePlate = asStr(a.licensePlate).trim();
    if (display) assetDoc.nickname = display;

    const batch = db.batch();
    batch.set(db.collection("assets").doc(newId), assetDoc);
    batch.update(db.collection("customers").doc(customerId), {
      assets: FieldValue.arrayUnion(newId),
      updatedAt: now,
    });
    batch.update(bRef, {
      assetId: newId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return NextResponse.json({
      ok: true,
      mode: "create",
      assetId: newId,
      customerId,
    });
  }

  return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
}
