import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { formatTimeWindow } from "@/app/admin/shared";

export const dynamic = "force-dynamic";

const ALLOWED_TIME_WINDOWS = new Set([
  "morning",
  "midday",
  "afternoon",
  "late",
]);

type BookingCreateBody = {
  customerId?: string;
  assetId?: string;
  scheduledDate?: string; // YYYY-MM-DD
  timeWindow?: string;
  notes?: string;
};

function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireRole(["owner", "tech"]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const status = msg === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const body = (await req.json().catch(() => ({}))) as BookingCreateBody;
  const customerId = (body.customerId ?? "").trim();
  const assetId = (body.assetId ?? "").trim();
  const scheduledDate = (body.scheduledDate ?? "").trim();
  const timeWindow = (body.timeWindow ?? "").trim();
  const notes = (body.notes ?? "").trim();

  if (!customerId)
    return NextResponse.json({ error: "customerId required" }, { status: 400 });
  if (!assetId)
    return NextResponse.json({ error: "assetId required" }, { status: 400 });
  if (!isISODate(scheduledDate))
    return NextResponse.json(
      { error: "scheduledDate must be YYYY-MM-DD" },
      { status: 400 },
    );
  if (!ALLOWED_TIME_WINDOWS.has(timeWindow))
    return NextResponse.json(
      { error: "timeWindow must be one of: morning, midday, afternoon, late" },
      { status: 400 },
    );

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 500 },
    );
  }

  const [custSnap, assetSnap] = await Promise.all([
    db.collection("customers").doc(customerId).get(),
    db.collection("assets").doc(assetId).get(),
  ]);

  if (!custSnap.exists) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  if (!assetSnap.exists) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  const asset = assetSnap.data() as Record<string, unknown>;
  if (asset.customerId !== customerId) {
    return NextResponse.json(
      { error: "Asset does not belong to customer" },
      { status: 400 },
    );
  }

  const cust = custSnap.data() as Record<string, unknown>;
  const customerName = typeof cust.name === "string" ? cust.name : "Unknown";
  const customerPhone = typeof cust.phone === "string" ? cust.phone : null;
  const customerEmail = typeof cust.email === "string" ? cust.email : null;
  const customerAddress =
    typeof cust.address === "string" ? cust.address : null;

  const assetType = typeof asset.type === "string" ? asset.type : "vehicle";
  const yearStr =
    asset.year != null && asset.year !== "" ? String(asset.year) : null;
  const makeStr = typeof asset.make === "string" ? asset.make : null;
  const modelStr = typeof asset.model === "string" ? asset.model : null;

  const isVehicleLike =
    assetType === "vehicle" ||
    assetType === "trailer" ||
    assetType === "fleet_vehicle";
  const isBoat = assetType === "boat";

  const confirmedArrivalWindow = formatTimeWindow(timeWindow) ?? timeWindow;

  const payload: Record<string, unknown> = {
    customerId,
    assetId,
    name: customerName,
    customerName,
    phone: customerPhone,
    customerPhone,
    email: customerEmail,
    customerEmail,
    address: customerAddress,
    customerAddress,
    preferredDate: scheduledDate,
    confirmedDate: scheduledDate,
    timeWindow,
    confirmedArrivalWindow,
    status: "confirmed",
    source: "field",
    selectedServices: [],
    assignedTechId: user.uid,
    createdBy: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    confirmedAt: FieldValue.serverTimestamp(),
  };
  if (isVehicleLike) {
    if (yearStr !== null) payload.vehicleYear = yearStr;
    if (makeStr) payload.vehicleMake = makeStr;
    if (modelStr) payload.vehicleModel = modelStr;
  } else if (isBoat) {
    if (yearStr !== null) payload.vesselYear = yearStr;
    if (makeStr) payload.vesselMake = makeStr;
    if (modelStr) payload.vesselModel = modelStr;
  }
  if (notes) payload.notes = notes;

  const ref = db.collection("bookings").doc();
  await ref.set(payload);

  return NextResponse.json({ id: ref.id }, { status: 201 });
}
